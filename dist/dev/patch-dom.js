!function() {
  'use strict';
  function moduleFactory() {
    function areOfSameType(target, source) {
      if (!source) {
        return false;
      }
      if (target.nodeName === source.nodeName) {
        return true;
      }
      return false;
    }
    function namedNodeMapToObject(namedNodeMap) {
      var obj = {};
      for (var i = 0, n = namedNodeMap.length; n > i; ++i) {
        var node = namedNodeMap[i];
        obj[node.name] = node.value;
      }
      return obj;
    }
    function patchElementNode(target, source) {
      var targetAttrObj = namedNodeMapToObject(target.attributes);
      var sourceAttrArr = source.attributes;
      var i, n, sourceAttr, targetAttr, attrName;
      if ('INPUT' === target.nodeName) {
        target.value = source.value || '';
      }
      if (void 0 !== source.checked) {
        target.checked = source.checked;
      }
      if (void 0 !== source.selected) {
        target.selected = source.selected;
      }
      for (i = 0, n = sourceAttrArr.length; n > i; ++i) {
        sourceAttr = sourceAttrArr[i];
        attrName = sourceAttr.name;
        targetAttr = targetAttrObj[attrName];
        delete targetAttrObj[sourceAttr.name];
        if (targetAttr && targetAttr.value === sourceAttr.value) {
          continue;
        }
        target.setAttribute(attrName, sourceAttr.value);
      }
      for (attrName in targetAttrObj) {
        target.removeAttribute(attrName);
      }
    }
    function patchTextNode(target, source) {
      var sourceValue = source.nodeValue;
      if (target.nodeValue === sourceValue) {
        return;
      }
      target.nodeValue = sourceValue;
    }
    function patchNode(target, source) {
      switch (target.nodeType) {
       case Node.ELEMENT_NODE:
        patchElementNode(target, source);
        break;

       case Node.TEXT_NODE:
        patchTextNode(target, source);
      }
    }
    function shouldIgnoreNode(node) {
      return !!node.hasAttribute && node.hasAttribute('patch-ignore');
    }
    function patchRecursive(target, source, ignoreSubtreeOf) {
      var targetParent = target.parentNode;
      if (areOfSameType(target, source)) {
        patchNode(target, source);
      } else {
        if (source) {
          targetParent.replaceChild(source, target);
        } else {
          targetParent.removeChild(target);
        }
        return;
      }
      if (ignoreSubtreeOf && -1 !== Array.prototype.indexOf.call(ignoreSubtreeOf, target)) {
        return;
      }
      var targetChildren = target.childNodes;
      var sourceChildren = source.childNodes;
      var targetPos, sourcePos, substitution, insertion, deletion, targetChild, sourceChild;
      var nTargetChildren = targetChildren.length;
      var nSourceChildren = sourceChildren.length;
      var nIgnoredTargetChildren = 0;
      var nTargetChildrenToIgnore = 0;
      for (var i = 0; nTargetChildren > i; ++i) {
        shouldIgnoreNode(targetChildren[i]) && nTargetChildrenToIgnore++;
      }
      if (nTargetChildren - nTargetChildrenToIgnore === 0 && 0 === nSourceChildren) {
        return;
      }
      var levMat = [];
      for (targetPos = 0; nTargetChildren >= targetPos; ++targetPos) {
        levMat[targetPos] = [ targetPos ];
      }
      for (sourcePos = 0; nSourceChildren >= sourcePos; ++sourcePos) {
        levMat[0][sourcePos] = sourcePos;
      }
      for (targetPos = 1; nTargetChildren >= targetPos + nIgnoredTargetChildren; targetPos++) {
        targetChild = targetChildren[targetPos + nIgnoredTargetChildren - 1];
        if (shouldIgnoreNode(targetChild)) {
          nIgnoredTargetChildren++;
          targetPos--;
          continue;
        }
        for (sourcePos = 1; nSourceChildren >= sourcePos; ++sourcePos) {
          if (areOfSameType(targetChild, sourceChildren[sourcePos - 1])) {
            levMat[targetPos][sourcePos] = levMat[targetPos - 1][sourcePos - 1];
          } else {
            levMat[targetPos][sourcePos] = 1 + Math.min(levMat[targetPos - 1][sourcePos - 1], levMat[targetPos][sourcePos - 1], levMat[targetPos - 1][sourcePos]);
          }
        }
      }
      targetPos = nTargetChildren - nTargetChildrenToIgnore;
      sourcePos = nSourceChildren;
      while (targetPos > 0 || sourcePos > 0) {
        targetChild = targetChildren[targetPos + nTargetChildrenToIgnore - 1];
        if (shouldIgnoreNode(targetChild)) {
          nTargetChildrenToIgnore--;
          continue;
        }
        substitution = targetPos > 0 && sourcePos > 0 ? levMat[targetPos - 1][sourcePos - 1] : 1 / 0;
        insertion = sourcePos > 0 ? levMat[targetPos][sourcePos - 1] : 1 / 0;
        deletion = targetPos > 0 ? levMat[targetPos - 1][sourcePos] : 1 / 0;
        sourceChild = sourceChildren[sourcePos - 1];
        if (insertion >= substitution && deletion >= substitution) {
          if (substitution < levMat[targetPos][sourcePos]) {
            target.replaceChild(sourceChild, targetChild);
          } else {
            patchRecursive(targetChild, sourceChild, ignoreSubtreeOf);
          }
          targetPos--;
          sourcePos--;
        } else {
          if (deletion >= insertion) {
            target.insertBefore(sourceChild, targetChild.nextSibling);
            sourcePos--;
          } else {
            target.removeChild(targetChild);
            targetPos--;
          }
        }
      }
    }
    return function(target, source, options) {
      options = options || {};
      var ignoreSubtreeOf = options.ignoreSubtreeOf && target.querySelectorAll(options.ignoreSubtreeOf);
      patchRecursive(target, source, ignoreSubtreeOf);
      return target;
    };
  }
  if ('function' == typeof define && define.amd) {
    define(moduleFactory);
  } else {
    if ('object' == typeof exports) {
      module.exports = moduleFactory();
    } else {
      var bff = window.bff = window.bff || {};
      bff.patchDom = moduleFactory();
    }
  }
}();