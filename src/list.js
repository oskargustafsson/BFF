define([
  './mixin',
  './event-emitter',
], function (
  mixin,
  eventEmitter
) {
  'use strict';

  function List() {
    this.__array = new Array();

    if (arguments.length) {
      this.push.apply(this, arguments);
    }
  }

  List.prototype.push = function () {
    this.__array.push.apply(this, arguments);
  };

  Object.defineProperties(List.prototype, {
    length: {
      get: function () { return this.__array.length; },
      set: function (length) {
        var oldLength = this.__array.length;
        this.__array.length = length;
        oldLength === length || this.emit('change:length', [ length, oldLength ]);
      },
    },
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