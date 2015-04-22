define(function () {
  'use strict';

  var TYPES = [ 'object', 'array', 'function', 'string', 'number', 'boolean', 'null', 'undefined' ];
  var SOLVERS;

  function getType(item) { return item === null ? 'null' : item instanceof Array ? 'array' : typeof item; }

  function mixin(target, source, onConflict, defaultOnConflict) {
    // Assign to the target's prototype if possible
    target = target.prototype || target;

    if (typeof onConflict === 'string') {
      defaultOnConflict = onConflict;
      onConflict = {};
    } else if (getType(onConflict) !== 'object') {
      throw 'onConflict must be either a string or an object';
    }

    defaultOnConflict = typeof defaultOnConflict === 'function' ?
        defaultOnConflict :
        SOLVERS[defaultOnConflict] || SOLVERS.crash;

    var solvers = {};
    TYPES.forEach(function (type) {
      var solver = onConflict[type];
      solvers[type] = typeof solver === 'function' ? solver : SOLVERS[solver] || defaultOnConflict;
    });

    for (var prop in source) {
      if (target.hasOwnProperty[prop]) {
        solvers[getType(target[prop])](target, source, prop, onConflict, defaultOnConflict);
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
