!function() {
  'use strict';
  function moduleFactory() {
    function getType(item) {
      return null === item ? 'null' : item instanceof Array ? 'array' : typeof item;
    }
    function getSolverFunction(val) {
      return 'function' === getType(val) ? val : SOLVERS[val];
    }
    function extend(target, source, onConflict, defaultOnConflict) {
      if (true && !(target instanceof Object)) {
        throw '"target" argument must be an object';
      }
      if (true && !(source instanceof Object)) {
        throw '"source" argument must be an object';
      }
      var isOnConflictObject = 'object' === getType(onConflict);
      defaultOnConflict = getSolverFunction(isOnConflictObject ? defaultOnConflict : onConflict) || SOLVERS.crash;
      isOnConflictObject || (onConflict = {});
      var solverFunctions = {};
      TYPES.forEach(function(type) {
        solverFunctions[type] = getSolverFunction(onConflict[type]) || defaultOnConflict;
      });
      for (var prop in source) {
        target.hasOwnProperty(prop) ? solverFunctions[getType(target[prop])](target, source, prop, onConflict, defaultOnConflict) : target[prop] = source[prop];
      }
      return target;
    }
    var TYPES = [ 'object', 'array', 'function', 'string', 'number', 'boolean', 'null', 'undefined' ];
    var SOLVERS;
    SOLVERS = {
      useTarget: function() {},
      useSource: function(target, source, prop) {
        target[prop] = source[prop];
      },
      crash: function(target, source, prop) {
        throw 'Extend target already has property ' + prop;
      },
      merge: function(target, source, prop, onConflict, defaultOnConflict) {
        var sourceProp = source[prop];
        var sourcePropType = getType(sourceProp);
        var targetProp = target[prop];
        var targetPropType = getType(targetProp);
        if (true && targetPropType !== sourcePropType) {
          throw 'Failed to mixin property ' + prop + ', source and target values are of differing types: ' + targetPropType + ' and ' + sourcePropType;
        }
        switch (getType(targetProp)) {
         case 'object':
          extend(targetProp, sourceProp, onConflict, defaultOnConflict);
          break;

         case 'array':
          target[prop] = targetProp.concat(sourceProp);
          break;

         case 'function':
          target[prop] = function() {
            targetProp.apply(this, arguments);
            sourceProp.apply(this, arguments);
          };
          break;

         case 'string':
         case 'number':
          target[prop] = targetProp + sourceProp;
          break;

         case 'boolean':
          target[prop] = targetProp || sourceProp;
        }
      }
    };
    return extend;
  }
  if ('function' == typeof define && define.amd) {
    define(moduleFactory);
  } else {
    if ('object' == typeof exports) {
      module.exports = moduleFactory();
    } else {
      var bff = window.bff = window.bff || {};
      bff.extend = moduleFactory();
    }
  }
}();