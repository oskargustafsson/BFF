(function () {
  'use strict';

  function moduleFactory() {

    function shouldPatch(target, source) {
      if (!source) { return false; }
      if (target.nodeName === source.nodeName) { return true; }
      return false;
    }

    function namedNodeMapToObject(namedNodeMap) {
      var obj = {};
      for (var i = 0, n = namedNodeMap.length; i < n; ++i) {
        var node = namedNodeMap[i];
        obj[node.name] = node.value;
      }
      return obj;
    }

    function patchElementNode(target, source) {
      // Ref: http://quirksmode.org/dom/core/#attributes

      var targetAttrObj = namedNodeMapToObject(target.attributes);
      var sourceAttrArr = source.attributes;
      var i, n, sourceAttr, targetAttr, attrName;

      // Special cases
      if (target.nodeName === 'INPUT') { target.value = source.value || ''; }
      if (source.checked !== undefined) { target.checked = source.checked; }
      if (source.selected !== undefined) { target.selected = source.selected; }

      for (i = 0, n = sourceAttrArr.length; i < n; ++i) {
        sourceAttr = sourceAttrArr[i];
        attrName = sourceAttr.name;
        targetAttr = targetAttrObj[attrName];
        delete targetAttrObj[sourceAttr.name];
        if (targetAttr && targetAttr.value === sourceAttr.value) { continue; }
        target.setAttribute(attrName, sourceAttr.value);
      }

      for (attrName in targetAttrObj) {
        target.removeAttribute(attrName);
      }
    }

    function patchTextNode(target, source) {
      var sourceValue = source.nodeValue;
      if (target.nodeValue === sourceValue) { return; }
      target.nodeValue = sourceValue;
    }

    function patchNode(target, source) {
      switch (target.nodeType) {
      case Node.ELEMENT_NODE: patchElementNode(target, source); break;
      case Node.TEXT_NODE: patchTextNode(target, source); break;
      }
    }

    function patchRecursive(target, source, ignoreSubtreeOf) {
      var targetParent = target.parentNode;

      // Patch the current node
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

      if (ignoreSubtreeOf && Array.prototype.indexOf.call(ignoreSubtreeOf, target) !== -1) { return; }

      // Add/patch/remove children
      var i, n,
          targetChildren = target.childNodes,
          sourceChildren = source.childNodes;

      for (i = 0, n = targetChildren.length; i < n; ++i) {
        patchRecursive(targetChildren[i], sourceChildren[i], ignoreSubtreeOf);
      }
      for (i = targetChildren.length, n = sourceChildren.length; i < n; ++i) {
        targetParent.appendChild(sourceChildren[i]);
      }
    }

    return function patchDom(target, source, options) {
      options = options || {};
      var ignoreSubtreeOf = options.ignoreSubtreeOf && target.querySelectorAll(options.ignoreSubtreeOf);
      patchRecursive(target, source, ignoreSubtreeOf);
      return target;
    };

  }

  // Expose, based on environment
  if (typeof define === 'function' && define.amd) { // AMD
    define(moduleFactory);
  } else if (typeof exports === 'object') { // Node, CommonJS-like
    module.exports = moduleFactory();
  } else { // Browser globals
    var bff = window.bff = window.bff || {};
    bff.patchDom = moduleFactory();
  }

}());
