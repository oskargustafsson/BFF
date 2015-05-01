define([
  './mixin',
  './event-emitter',
], function (
  mixin,
  eventEmitter
) {
  'use strict';

  function List() {
    if (arguments.length === 1 && typeof arguments[0] === 'number') {
      this.length = arguments[0];
    } else if (arguments.length) {
      this.push.apply(this, arguments);
    }
  }

  List.prototype = new Array();
  List.prototype.constructor = List;

  Object.defineProperties(List.prototype, {
    first: {
      get: function () { return this[0]; },
      set: function (val) { this[0] = val; },
    },
    last: {
      get: function () { return this[this.length - 1]; },
      set: function (val) { this[this.length - 1] = val; },
    }
  });

  mixin(List, eventEmitter);

  return List;

});