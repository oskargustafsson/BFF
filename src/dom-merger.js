define(function () {
  'use strict';

  function shouldMerge(target, source) {
    if (target.nodeName === source.nodeName) {
      return true;
    }
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

  function updateNodeAttributes(target, source) {
    // Ref: http://quirksmode.org/dom/core/#attributes

    var targetAttrObj = namedNodeMapToObject(target.attributes);
    var sourceAttrArr = source.attributes;
    var i, n, sourceAttr, targetAttr, attrName;

    for (i = 0, n = sourceAttrArr.length; i < n; ++i) {
      sourceAttr = sourceAttrArr[i];
      attrName = sourceAttr.name;
      targetAttr = targetAttrObj[attrName];
      delete targetAttrObj[sourceAttr.name];
      if (targetAttr && targetAttr.value === sourceAttr.value) { continue; }
      target.setAttribute(attrName, sourceAttr.value);
    }

    // TODO: Handle 'checked', 'selected' and 'value'

    /*var remainingAttrs = Object.keys(targetAttrObj);
    for (i = 0, n = remainingAttrs.length; i < n; ++i) {
      target.removeAttribute(remainingAttrs[i]);
    }*/
    for (attrName in targetAttrObj) {
      target.removeAttribute(attrName);
    }
  }

  function merge(target, source) {
    updateNodeAttributes(target, source);
    return target;
  }

  return merge;

});
