!function() {
  'use strict';
  function moduleFactory() {
    function shouldPatch(target, source) {
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
      if (shouldPatch(target, source)) {
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
      var i, n, targetChildren = target.childNodes, sourceChildren = source.childNodes;
      for (i = 0, n = targetChildren.length; n > i; ++i) {
        patchRecursive(targetChildren[i], sourceChildren[i], ignoreSubtreeOf);
      }
      for (i = targetChildren.length, n = sourceChildren.length; n > i; ++i) {
        targetParent.appendChild(sourceChildren[i]);
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