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

  function makeSetter(index) {

    function setter(val) {
      var oldVal = this[index];
      if (val === oldVal) { return; }

      this.__array[index] = val;
      this.emit('itemChanged', [ val, oldVal, index, this ]);
    }

    return setter;
  }

  function makeGetter(index) {
    return function getter() { return this.__array[index]; };
  }

  function delegate(funcName) {
    return function () {
      return this.__array[funcName].apply(this.__array, arguments);
    };
  }

  function delegateCreator(funcName) {
    return function () {
      return new List(this.__array[funcName].apply(this.__array, arguments));
    };
  }

  function delegateChainable(funcName) {
    return function () {
      this.__array[funcName].apply(this.__array, arguments);
      return this;
    };
  }

  function delegateLengthMutator(funcName) {
    return function () {
      var oldLength = this.length;
      var ret = this.__array[funcName].apply(this.__array, arguments);
      this.length === oldLength || this.emit('change:length', [ this.length, oldLength, this ]);
      return ret;
    };
  }

  function List(schema, items) {
    this.__array = new Array();

    this.listenTo(this, 'change:length', function (length, prevLength) {
      var diff = length - prevLength;
      var i;
      if (diff > 0) {
        for (i = prevLength; i < length; ++i) {
          Object.defineProperty(this, i + '', {
            get: makeGetter(i),
            set: makeSetter(i),
          });
        }
      } else {
        for (i = length; i < prevLength; ++i) {
          delete this[i];
        }
      }
    });

    if (arguments.length === 1 && schema instanceof Array) {
      items = schema;
      schema = undefined;
    }
    schema = schema || {};
    items = items || [];

    if (typeof schema !== 'object') {
      throw 'Schema argument must be an object';
    }
    if (!(items instanceof Array)) {
      throw 'Items argument must be an array';
    }

    // TODO: add the properties defined in schema

    items.length && this.push.apply(this, items);
  }

  List.prototype.push = function () {
    var nItems = arguments.length;
    if (nItems === 0) { return this; }
    var oldLength = this.length;
    this.__array.push.apply(this.__array, arguments);

    for (var i = 0; i < nItems; ++i) {
      this.emit('itemAdded', [ arguments[i], oldLength + i, this ]);
    }
    this.emit('change:length', [ this.length, oldLength, this ]);

    return this;
  };

  [ 'pop', 'shift', 'unshift', 'splice' ].forEach(function (funcName) {
    List.prototype[funcName] = delegateLengthMutator(funcName);
  });

  [ 'every', 'some', 'indexOf', 'lastIndexOf', 'join', 'reduce', 'reduceRight' ].forEach(function (funcName) {
    List.prototype[funcName] = delegate(funcName);
  });

  // TODO: splice should be chainable
  [ 'forEach', 'sort', 'reverse' ].forEach(function (funcName) {
    List.prototype[funcName] = delegateChainable(funcName);
  });

  [ 'filter', 'concat', 'slice', 'map' ].forEach(function (funcName) {
    List.prototype[funcName] = delegateCreator(funcName);
  });

  List.prototype.filterMut = function (predicate, thisArg) {
    var length = this.length;
    var removeCount = 0;
    for (var i = length - 1; i >= 0; --i) {
      if (predicate.call(thisArg, this[i], i, this)) {
        removeCount++;
      } else if (removeCount) {
        this.splice(i + 1, removeCount);
        removeCount = 0;
      }
    }
    return this;
  };

  List.prototype.pushArray = List.prototype.concatMut = function (array) {
    array.forEach(this.push, this);
    return this;
  };

  List.prototype.sliceMut = function (begin, end) {
    var length = this.length;

    end = (typeof end !== 'undefined') ? end : length;

    // Handle negative value for "begin"
    var start = begin || 0;
    start = (start >= 0) ? start : Math.max(0, length + start);

    // Handle negative value for "end"
    var upTo = (typeof end == 'number') ? Math.min(end, length) : length;
    end < 0 && (upTo = length + end);

    // Actual expected size of the slice
    var size = upTo - start;

    if (size !== length) {
      this.splice(0, start);
      this.splice(upTo, length - upTo);
    }
    return this;
  };

  List.prototype.mapMut = function (callback, thisArg) {
    var length = this.length;
    for (var i = 0; i < length; ++i) {
      this[i] = callback.call(thisArg, this[i], i, this);
    }
    return this;
  };

  List.prototype.find = function (callback, thisArg) {
    var length = this.length;
    for (var i = 0; i < length; ++i) {
      if (callback.call(thisArg, this[i], i, this)) { return this[i]; }
    }
  };

  List.prototype.findIndex = function (callback, thisArg) {
    var length = this.length;
    for (var i = 0; i < length; ++i) {
      if (callback.call(thisArg, this[i], i, this)) { return i; }
    }
    return -1;
  };

  List.prototype.includes = function (item, fromIndex) {
    var index = this.__array.indexOf(item);
    return index !== -1 && index >= fromIndex;
  };

  // TODO: make functions chainable
  // TODO: itemAdded and itemRemoved events
  // TODO: implement some lodash funcs like union and intersection

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