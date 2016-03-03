/* global define */
(function () {
	'use strict';

	/**
	 * @module bff/patch-dom
	 */
	function moduleFactory() {

		function makeLevMat(xSize, ySize) {
			var i, levMat = new Array(xSize + 1);

			for (i = 0; i <= xSize; ++i) {
				levMat[i] = new Array(ySize + 1);
				levMat[i][0] = i;
			}

			for (i = 0; i <= ySize; ++i) {
				levMat[0][i] = i;
			}

			return levMat;
		}

		var preallocLevMatSizeX = 63;
		var preallocLevMatSizeY = 63;
		var preallocLevMat = makeLevMat(preallocLevMatSizeX, preallocLevMatSizeY);

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

		function shouldIgnoreNode(node) {
			return !!node.hasAttribute && node.hasAttribute('patch-ignore');
		}

		function patchRecursive(target, source, ignoreSubtreeOf) {
			var targetParent = target.parentNode;

			var childrenToPatch = [];

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

			var i, n, targetPos, sourcePos, targetChild, sourceChild;
			var nTargetChildren = targetChildren.length;
			var nSourceChildren = sourceChildren.length;

			var nLeadingSameTypeChildren = 0;

			var nIgnoredTargetChildren = 0;
			var nTargetChildrenToIgnore = 0;
			var allChildrenMatchSoFar = true;

			for (i = 0; i < nTargetChildren; ++i) {
				if (shouldIgnoreNode(targetChildren[i])) {
					nTargetChildrenToIgnore++;
				} else if (allChildrenMatchSoFar) {
					if (areOfSameType(targetChildren[i + nTargetChildrenToIgnore], sourceChildren[i])) {
						childrenToPatch.push(targetChildren[i + nTargetChildrenToIgnore]);
						childrenToPatch.push(sourceChildren[i]);
						nLeadingSameTypeChildren++;
					} else {
						allChildrenMatchSoFar = false;
					}
				}
			}

			if (nTargetChildren - nTargetChildrenToIgnore === 0 && nSourceChildren === 0) { return; }

			var levMatSizeX = nTargetChildren - nLeadingSameTypeChildren;
			var levMatSizeY = nSourceChildren - nLeadingSameTypeChildren;

			var levMat;
			if (preallocLevMatSizeX < levMatSizeX || preallocLevMatSizeY < levMatSizeY) {
				// The preallocated matrix is too small.
				if (preallocLevMatSizeX <= levMatSizeX && preallocLevMatSizeY <= levMatSizeY) {
					// The needed matrix is bigger or equal to the preallocated one i all dimensions, so let's grow the
					// preallocated one.
					preallocLevMatSizeX = levMatSizeX;
					preallocLevMatSizeY = levMatSizeY;
					preallocLevMat = makeLevMat(preallocLevMatSizeX, preallocLevMatSizeY);
					levMat = preallocLevMat;
				} else {
					// The needed matrix is larger than the preallocated one in some, but not all dimensions. This
					// should be quite an edge case, so just use a temporary matrix for this operation.
					levMat = makeLevMat(levMatSizeX, levMatSizeY);
				}
			} else {
				// The needed matrix fits inside the preallocated one, so just use that one. This should be the most
				// common case.
				levMat = preallocLevMat;
			}

			for (targetPos = 1; targetPos + nIgnoredTargetChildren <= nTargetChildren - nLeadingSameTypeChildren; targetPos++) {
				targetChild = targetChildren[targetPos + nIgnoredTargetChildren + nLeadingSameTypeChildren - 1];

				if (shouldIgnoreNode(targetChild)) {
					nIgnoredTargetChildren++;
					targetPos--;
					continue;
				}

				for (sourcePos = 1; sourcePos <= nSourceChildren - nLeadingSameTypeChildren; ++sourcePos) {
					if (areOfSameType(targetChild, sourceChildren[sourcePos + nLeadingSameTypeChildren - 1])) {
						levMat[targetPos][sourcePos] = levMat[targetPos - 1][sourcePos - 1];
					} else {
						levMat[targetPos][sourcePos] = 1 + Math.min(
								levMat[targetPos - 1][sourcePos - 1],
								levMat[targetPos][sourcePos - 1],
								levMat[targetPos - 1][sourcePos]);
					}
				}
			}

			targetPos = nTargetChildren - nLeadingSameTypeChildren - nTargetChildrenToIgnore;
			sourcePos = nSourceChildren - nLeadingSameTypeChildren;
			while (targetPos > 0 || sourcePos > 0) {
				targetChild = targetChildren[targetPos + nLeadingSameTypeChildren + nTargetChildrenToIgnore - 1];

				if (shouldIgnoreNode(targetChild)) {
					nTargetChildrenToIgnore--;
					continue;
				}

				var substitution = targetPos > 0 && sourcePos > 0 ? levMat[targetPos - 1][sourcePos - 1] : Infinity;
				var insertion = sourcePos > 0 ? levMat[targetPos][sourcePos - 1] : Infinity;
				var deletion = targetPos > 0 ? levMat[targetPos - 1][sourcePos] : Infinity;

				sourceChild = sourceChildren[sourcePos + nLeadingSameTypeChildren - 1];

				if (substitution <= insertion && substitution <= deletion) {
					if (substitution < levMat[targetPos][sourcePos]) {
						// Substitute
						target.replaceChild(sourceChild, targetChild);
					} else {
						// Add to patch list
						childrenToPatch.push(targetChild);
						childrenToPatch.push(sourceChild);
					}
					targetPos--;
					sourcePos--;
				} else if (insertion <= deletion) {
					// Insert
					target.insertBefore(sourceChild, targetChild.nextSibling);
					sourcePos--;
				} else {
					// Delete
					target.removeChild(targetChild);
					targetPos--;
				}
			}

			for (i = 0, n = childrenToPatch.length; i < n; i += 2) {
				patchRecursive(childrenToPatch[i], childrenToPatch[i + 1], ignoreSubtreeOf);
			}
		}

		/**
		 * Patches the target element and its child elements such that it will be identical to the source element and its child structure. It achieves this by recursively _patching_, _removing_ or _adding_ elements in the target element hierarchy. The overall logic of the algorithm goes as follows:
		 * * If the target and source elements have differing node type types (e.g. a `<div>` and a `<span>` tag) the target element is replaced by the source element.
		 * * Otherwise, if the target and source elements are of the same type (e.g. two `<div>` tags), the attributes of the target element will be replaced by those of the target element. Then the target and source elements' children lists are compared using a version of the Levenshtein algorithm. This results in the children of the target element being either patched (by calling `patchDom` recursively) or removed. Child elements only present in the source child list will also be added to the target child list at their respective positions.
		 *
		 * If any encountered target elements has a `patch-ignore` attribute, that node and its children will not be patched.
		 *
		 * @func patchDom
		 * @instance
		 * @arg {HTMLElement} target - The element (hierarchy) to be patched. Will be identical to the source element (hierarchy) after the function call completes.
		 * @arg {HTMLElement} source - The element (hierarchy) that the target (hierarchy) will be transformed into.
		 * @arg {Object} [options] - Options that will be recursively passed down to all patchDom calls. Currently only one options is implemented:
		 * * _ignoreSubtreeOf_: A CSS selector string that identifies any elements, whose subtrees will not be patched.
		 */
		return function (target, source, options) {
			options = options || {};

			if (RUNTIME_CHECKS) {
				if (!(target instanceof HTMLElement)) {
					throw '"target" argument must be an HTMLElement';
				}
				if (!(source instanceof HTMLElement)) {
					throw '"source" argument must be an HTMLElement';
				}
				if (arguments.length > 2 && typeof options !== 'object') {
					throw '"options" argument must be an object';
				}
				if ('ignoreSubtreeOf' in options && typeof options.ignoreSubtreeOf !== 'string') {
					throw 'ignoreSubtreeOf option must be a valid CSS selector string';
				}
			}

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
