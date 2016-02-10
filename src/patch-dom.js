/* global define */
(function () {
	'use strict';

	function moduleFactory() {

		function areOfSameType(target, source) {
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

			if (ignoreSubtreeOf && Array.prototype.indexOf.call(ignoreSubtreeOf, target) !== -1) { return; }

			// Diff subtree using Levenshtein distance algorithm

			var targetChildren = target.childNodes;
			var sourceChildren = source.childNodes;

			var targetPos, sourcePos, substitution, insertion, deletion;
			var nTargetChildren = targetChildren.length;
			var nSourceChildren = sourceChildren.length;

			if (nTargetChildren === 0 && nSourceChildren === 0) { return; }

			var levMat = [];

			for (targetPos = 0; targetPos <= nTargetChildren; ++targetPos) {
				levMat[targetPos] = [ targetPos ];
			}

			for (sourcePos = 0; sourcePos <= nSourceChildren; ++sourcePos) {
				levMat[0][sourcePos] = sourcePos;
			}

			for (targetPos = 1; targetPos <= nTargetChildren; ++targetPos) {
				for (sourcePos = 1; sourcePos <= nSourceChildren; ++sourcePos) {
					if (areOfSameType(targetChildren[targetPos - 1], sourceChildren[sourcePos - 1])) {
						levMat[targetPos][sourcePos] = levMat[targetPos - 1][sourcePos - 1];
					} else {
						levMat[targetPos][sourcePos] = 1 + Math.min(
								levMat[targetPos - 1][sourcePos - 1],
								levMat[targetPos][sourcePos - 1],
								levMat[targetPos - 1][sourcePos]);
					}
				}
			}

			targetPos = nTargetChildren;
			sourcePos = nSourceChildren;
			while (targetPos !== 0 || sourcePos !== 0) {
				substitution = targetPos > 0 && sourcePos > 0 ? levMat[targetPos - 1][sourcePos - 1] : Infinity;
				insertion = sourcePos > 0 ? levMat[targetPos][sourcePos - 1] : Infinity;
				deletion = targetPos > 0 ? levMat[targetPos - 1][sourcePos] : Infinity;
				if (substitution <= insertion && substitution <= deletion) {
					if (substitution < levMat[targetPos][sourcePos]) {
						// Substitute
						target.replaceChild(sourceChildren[sourcePos - 1], targetChildren[targetPos - 1]);
					} else {
						// Patch
						patchRecursive(targetChildren[targetPos - 1], sourceChildren[sourcePos - 1], ignoreSubtreeOf);
					}
					targetPos--;
					sourcePos--;
				} else if (insertion <= deletion) {
					// Insert
					sourcePos--;
					target.insertBefore(sourceChildren[sourcePos], targetChildren[targetPos].nextSibling);
				} else {
					// Delete
					targetPos--;
					target.removeChild(targetChildren[targetPos]);
				}
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
