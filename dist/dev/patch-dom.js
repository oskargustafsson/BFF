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
      var targetPos, sourcePos, substitution, insertion, deletion;
      var nTargetChildren = targetChildren.length;
      var nSourceChildren = sourceChildren.length;
      if (0 === nTargetChildren && 0 === nSourceChildren) {
        return;
      }
      var levMat = [];
      for (targetPos = 0; nTargetChildren >= targetPos; ++targetPos) {
        levMat[targetPos] = [ targetPos ];
      }
      for (sourcePos = 0; nSourceChildren >= sourcePos; ++sourcePos) {
        levMat[0][sourcePos] = sourcePos;
      }
      for (targetPos = 1; nTargetChildren >= targetPos; ++targetPos) {
        for (sourcePos = 1; nSourceChildren >= sourcePos; ++sourcePos) {
          if (areOfSameType(targetChildren[targetPos - 1], sourceChildren[sourcePos - 1])) {
            levMat[targetPos][sourcePos] = levMat[targetPos - 1][sourcePos - 1];
          } else {
            levMat[targetPos][sourcePos] = 1 + Math.min(levMat[targetPos - 1][sourcePos - 1], levMat[targetPos][sourcePos - 1], levMat[targetPos - 1][sourcePos]);
          }
        }
      }
      targetPos = nTargetChildren;
      sourcePos = nSourceChildren;
      while (0 !== targetPos || 0 !== sourcePos) {
        substitution = targetPos > 0 && sourcePos > 0 ? levMat[targetPos - 1][sourcePos - 1] : 1 / 0;
        insertion = sourcePos > 0 ? levMat[targetPos][sourcePos - 1] : 1 / 0;
        deletion = targetPos > 0 ? levMat[targetPos - 1][sourcePos] : 1 / 0;
        if (insertion >= substitution && deletion >= substitution) {
          if (substitution < levMat[targetPos][sourcePos]) {
            target.replaceChild(sourceChildren[sourcePos - 1], targetChildren[targetPos - 1]);
          } else {
            patchRecursive(targetChildren[targetPos - 1], sourceChildren[sourcePos - 1], ignoreSubtreeOf);
          }
          targetPos--;
          sourcePos--;
        } else {
          if (deletion >= insertion) {
            sourcePos--;
            target.insertBefore(sourceChildren[sourcePos], targetChildren[targetPos].nextSibling);
          } else {
            targetPos--;
            target.removeChild(targetChildren[targetPos]);
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