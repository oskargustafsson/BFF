/* global RUNTIME_CHECKS, define */

(function () {
	'use strict';

	/**
	 * @module bff/extend
	 */
	function moduleFactory() {

		var TYPES = [ 'object', 'array', 'function', 'string', 'number', 'boolean', 'null', 'undefined' ];
		var SOLVERS;

		function getType(item) { return item === null ? 'null' : item instanceof Array ? 'array' : typeof item; }
		function getSolverFunction(val) { return getType(val) === 'function' ? val : SOLVERS[val]; }

		/**
		 * @callback module:bff/extend~conflictSolver
		 * @param {Object} target
		 * @param {Object} source
		 * @param {string} prop - The name of the conflicting property.
		 * @param {string|module:bff/extend~conflictSolver|Object} onConflict - The same onConflict argumet passed to the extend() call.
		 * @param {string|module:bff/extend~conflictSolver} defaultOnConflict - The same defaultOnConfluct argumet passed to the extend() call.
		 */

		/**
		 * A function that extends a target object with the properties of a source object, with options for describing property collision behavior. Note that the target object is mutated and returned, i.e. no new object gets created by invoking this function.
		 *
		 * The function comes with a set of named built-in conflict-solving functions:
		 * * _crash_: Throws an error when a property conflict occurs. This is the default solver function.
		 * * _useTarget_: Uses the target's property, i.e. leaves the target property unchanged.
		 * * _useSource_: Uses the source's property, i.e. overwrites the target property with the source property.
		 * * _merge_: Tries to merge the values in an intuitive way.
		 *     * Objects are merged recursively.
		 *     * Arrays are concatenated.
		 *     * Functions are combined, so that the target's function is first called, then the source's. Both functions are passed the same arguments.
		 *     * Numbers and strings added using the + operator.
		 *     * Boolean values are or:ed using the || operator (i.e. Boolean addition).
		 *     * If the source and target types are not the same, use the source value.
		 * The caller also has the option to specify custom solver functions.
		 *
		 * **Examples**
		 * ```javascript
		 * extend(
		 *   { a: { b: 'b', c: 'c' } },
		 *   { a: { c: 'c', d: 'd' } },
		 *   'useSource');
		 * // Returns { a: { c: 'c', d: 'd' } }
		 * ```
		 * As can be seen in above, the 'useSource' conflict solver is not recursive, it simply overwrites any property it encounters. This is how e.g. jQuery.extend and _.assign behaves.
		 * ```javascript
		 * extend(
		 *   { a: { b: 'b', c: 'c' } },
		 *   { a: { c: 'c', d: 'd' } },
		 *   'merge');
		 * // Returns { a: { b: 'b', c: 'c', d: 'd' } }
		 * ```
		 * Here we see that the 'merge' solver works recursively.
		 * ```javascript
		 * extend(
		 *   { a: { b: 'b' }, num: 1 },
		 *   { a: { c: 'c' }, num: 2 },
		 *   { object: 'merge' }, 'useSource');
		 * // Returns { a: { b: 'b', c: 'c' }, num: 2 }
		 * ```
		 * The above example uses the 'merge' solver on objects and the 'useSource' solver on all other property types. This produces a recursive behavior over objects, which is quite often desired. This is how e.g. _.merge behaves
		 * ```javascript
		 * extend(
		 *   { a: { b: 'b' }, num: 1 },
		 *   { a: { c: 'c' }, num: 2, newProp: 3 },
		 *   function (target, source, prop) { target[prop] = 42; });
		 * // Returns { a: 42, num: 42, newProp: 3 }
		 * ```
		 * Above we see a (fairly useless) custom conflict solver function.
		 * @alias module:bff/extend
		 * @arg {Object} target - The object that will be extende with new properties.
		 * @arg {Object} source - The object that provides the new properties.
		 * @arg {string|module:bff/extend~conflictSolver|Object} [onConflict] - Specifies how to handle cases where a property exists both on the target and on the source.
		 * * a _string_ argument will be used to identify one of the built in solver functions. Valid values are 'useTarget', 'useSouce', 'crash' and 'merge'.
		 * * a _function_ argument will be used as-is as a solver for all conflicts.
		 * * an _Object_ argument should have keys that correspond to value types, i.e. 'object', 'array', 'function', 'string', 'number', 'boolean', 'null' or 'undefined'. The object values can be either strings or functions, which will be used as solver functions for the corresponding key value types.
		 * @arg {string|module:bff/extend~conflictSolver} [defaultOnConflict] - Specifies a default solver, in the same manner as the onConflict argument. Can only be used if onConflict is an object.
		 * @returns {Object} The extended object
		 */
		function extend(target, source, onConflict, defaultOnConflict) {
			if (RUNTIME_CHECKS) {
				if (typeof target !== 'object') { throw '"target" argument must be an object'; }
				if (typeof source !== 'object') { throw '"source" argument must be an object'; }
				if (arguments.length > 2 && [ 'object', 'function', 'string' ].indexOf(typeof onConflict) === -1) {
					throw '"onConflict" argument must be an string (' + Object.keys(SOLVERS).join(', ') + '), object or function';
				}
				if (arguments.length > 3) {
					if (typeof onConflict !== 'object') {
						throw 'There is no point in specifying a defaultOnConflict of onConflict is not an object';
					}
					if ([ 'function', 'string' ].indexOf(typeof defaultOnConflict) === -1) {
						throw '"defaultOnConflict" argument must be a string (' + Object.keys(SOLVERS).join(', ') + '), or function';
					}
				}
			}

			var isOnConflictObject = getType(onConflict) === 'object';
			defaultOnConflict = getSolverFunction(isOnConflictObject ? defaultOnConflict : onConflict) || SOLVERS.crash;
			isOnConflictObject || (onConflict = {});

			var solverFunctions = {};
			TYPES.forEach(function (type) {
				solverFunctions[type] = getSolverFunction(onConflict[type]) || defaultOnConflict;
			});

			for (var prop in source) {
				if (target.hasOwnProperty(prop)) {
					solverFunctions[getType(target[prop])](target, source, prop, onConflict, defaultOnConflict);
				} else {
					target[prop] = source[prop];
				}
			}

			return target;
		}

		SOLVERS = {
			useTarget: function useTarget() {
				// Don't do nothin
			},
			useSource: function useSource(target, source, prop) {
				target[prop] = source[prop];
			},
			crash: function crash(target, source, prop) {
				throw 'Extend target already has property ' + prop;
			},
			merge: function merge(target, source, prop, onConflict, defaultOnConflict) {
				var sourceProp = source[prop];
				var sourcePropType = getType(sourceProp);
				var targetProp = target[prop];
				var targetPropType = getType(targetProp);

				if (targetPropType !== sourcePropType) {
					target[prop] = source[prop];
					return;
				}

				switch (targetPropType) {
				case 'object':
					extend(targetProp, sourceProp, onConflict, defaultOnConflict);
					break;
				case 'array':
					target[prop] = targetProp.concat(sourceProp);
					break;
				case 'function':
					target[prop] = function () {
						targetProp.apply(this, arguments);
						sourceProp.apply(this, arguments);
					};
					break;
				case 'string':
				case 'number':
					target[prop] = targetProp + sourceProp;
					break;
				case 'boolean':
					// Logical 'or' is kind of like the Boolean version of addition
					target[prop] = targetProp || sourceProp;
					break;
				default:
					// Don't to nothin for e.g. 'null' and 'undefined'
					break;
				}
			},
		};

		return extend;

	}

	// Expose, based on environment
	if (typeof define === 'function' && define.amd) { // AMD
		define(moduleFactory);
	} else if (typeof exports === 'object') { // Node, CommonJS-like
		module.exports = moduleFactory();
	} else { // Browser globals
		var bff = window.bff = window.bff || {};
		bff.extend = moduleFactory();
	}

}());
