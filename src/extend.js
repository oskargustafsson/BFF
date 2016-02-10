/* global RUNTIME_CHECKS, define */
(function () {
  'use strict';

  function moduleFactory() {

    var TYPES = [ 'object', 'array', 'function', 'string', 'number', 'boolean', 'null', 'undefined' ];
    var SOLVERS;

    function getType(item) { return item === null ? 'null' : item instanceof Array ? 'array' : typeof item; }
    function getSolverFunction(val) { return getType(val) === 'function' ? val : SOLVERS[val]; }

    function extend(target, source, onConflict, defaultOnConflict) {
      if (RUNTIME_CHECKS && !(target instanceof Object)) { throw '"target" argument must be an object'; }
      if (RUNTIME_CHECKS && !(source instanceof Object)) { throw '"source" argument must be an object'; }

      var isOnConflictObject = getType(onConflict) === 'object';
      defaultOnConflict = getSolverFunction(isOnConflictObject ? defaultOnConflict : onConflict) || SOLVERS.crash;
      isOnConflictObject || (onConflict = {});

      var solverFunctions = {};
      TYPES.forEach(function (type) {
        solverFunctions[type] = getSolverFunction(onConflict[type]) || defaultOnConflict;
      });

      for (var prop in source) {
        target.hasOwnProperty(prop) ?
            solverFunctions[getType(target[prop])](target, source, prop, onConflict, defaultOnConflict) :
            target[prop] = source[prop];
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

        if (RUNTIME_CHECKS && targetPropType !== sourcePropType) {
          throw 'Failed to mixin property ' + prop + ', source and target values are of differing types: ' +
              targetPropType + ' and ' + sourcePropType;
        }

        switch (getType(targetProp)) {
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
