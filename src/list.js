define([
  './mixin',
  './event-emitter',
  './event-listener',
], function (
  mixin,
  eventEmitter,
  eventListner
) {
  'use strict';

  function makeSetter(list, index) {

    function setter(val) {
      var oldVal = list[index];
      if (val === oldVal) { return; }

      list.__array[index] = val;
      list.emit('itemChanged', [ val, oldVal, index ]);
    }

    return setter;
  }

  function makeGetter(list, index) {
    return function getter() { return list.__array[index]; };
  }

  function List() {
    this.__array = new Array();

    this.listenTo(this, 'change:length', function (length, prevLength) {
      var diff = length - prevLength;
      var i;
      if (diff > 0) {
        for (i = prevLength; i < length; ++i) {
          Object.defineProperty(this, i + '', {
            get: makeGetter(this, i),
            set: makeSetter(this, i),
          });
        }
      } else {
        for (i = length; i < prevLength; ++i) {
          delete this[i];
        }
      }
    });

    if (arguments.length) {
      this.push.apply(this, arguments);
    }
  }

  List.prototype.push = function () {
    var oldLength = this.length;
    this.__array.push.apply(this.__array, arguments);
    this.emit('change:length', [ this.length, oldLength ]);
  };

  Object.defineProperties(List.prototype, {
    length: {
      get: function () { return this.__array.length; },
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
  mixin(List, eventListner);

  return List;

});