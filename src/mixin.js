define(function () {
  'use strict';

  var TYPES = [ 'object', 'array', 'function', 'string', 'number', 'boolean', 'null', 'undefined' ];
  var SOLVERS;

  function getType(item) { return item === null ? 'null' : item instanceof Array ? 'array' : typeof item; }
  function getSolverFunction(val) { return getType(val) === 'function' ? val : SOLVERS[val]; }

  function mixin(target, source, onConflict, defaultOnConflict) {
    target = target.prototype || target;

    var isOnConflictObject = getType(onConflict) === 'object';
    defaultOnConflict = getSolverFunction(isOnConflictObject ? defaultOnConflict : onConflict) || SOLVERS.crash;
    isOnConflictObject || (onConflict = {});

    var solverFunctions = {};
    TYPES.forEach(function (type) {
      solverFunctions[type] = getSolverFunction(onConflict[type]) || defaultOnConflict;
    });

    for (var prop in source) {
      target.hasOwnProperty[prop] ?
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
      throw 'Mixin target already has property ' + prop;
    },
    merge: function merge(target, source, prop, onConflict, defaultOnConflict) {
      var sourceProp = source[prop];
      var sourcePropType = getType(sourceProp);
      var targetProp = target[prop];
      var targetPropType = getType(targetProp);

      if (targetPropType !== sourcePropType) {
        throw 'Failed to mixin property ' + prop + ', source and target values are of differing types: ' +
            targetPropType + ' and ' + sourcePropType;
      }

      switch (getType(targetProp)) {
      case 'object':
        mixin(targetProp, sourceProp, onConflict, defaultOnConflict);
        break;
      case 'array':
        target[prop] = targetProp.concat(sourceProp);
        break;
      case 'function':
        target[prop] = function () {
          targetProp.apply(null, arguments);
          sourceProp.apply(null, arguments);
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

  return mixin;

});
