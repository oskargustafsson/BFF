define([
  './mixin',
  './event-emitter',
  './event-listener',
], function (
  mixin,
  eventEmitter,
  eventListener
) {
  'use strict';

  var ADDED_EVENT = 'added';
  var REPLACED_EVENT = 'replaced';
  var REMOVED_EVENT = 'removed';
  var ITEM_ADDED_EVENT = 'item:added';
  var ITEM_REPLACED_EVENT = 'item:replaced';
  var ITEM_REMOVED_EVENT = 'item:removed';

  var ITEM_EVENT_PREFIX = /^item:/;

  function isEmitter(obj) { return !!(obj && obj.emit); } // Quack!

  var reemitItemEvent = function (eventName, item) {
    var eventArgs = [ item ].concat(arguments);
    this.emit(eventName, eventArgs);
  };

  function makeSetter(index) {
    return function setter(val) {
      var oldVal = this[index];
      if (val === oldVal) { return; }

      this.__array[index] = val;

      if (isEmitter(oldVal)) {
        oldVal.emit(REMOVED_EVENT, [ index, this ]);
      } else {
        this.emit(ITEM_REMOVED_EVENT, [ oldVal, index, this ]);
      }

      if (isEmitter(val)) {
        val.emit(REPLACED_EVENT, [ oldVal, index, this ]);
        val.emit(ADDED_EVENT, [ index, this ]);
      } else {
        this.emit(ITEM_REPLACED_EVENT, [ val, oldVal, index, this ]);
        this.emit(ITEM_ADDED_EVENT, [ val, index, this ]);
      }
    };
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

  function List(schema, items) {
    this.__array = [];

    this.listenTo(this, 'change:length', function (length, prevLength) {
      var diff = length - prevLength;
      var i;
      if (diff > 0) {
        for (i = prevLength; i < length; ++i) {
          Object.defineProperty(this, i, {
            enumerable: true,
            configurable: true,
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

    this.listenTo(this, 'item:added', function (item) {
      if (!isEmitter(item)) { return; }

      var listeningTo = this.getListeningTo();
      for (var eventName in listeningTo) {
        this.listenTo(item, eventName, reemitItemEvent.bind(this, 'item:' + eventName, item));
      }
    });

    this.listenTo(this, 'item:removed', function (item) {
      isEmitter(item) && this.stopListening(item);
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
      var val = arguments[i];
      isEmitter(val) ?
          val.emit(ADDED_EVENT, [ oldLength + i, this ]) :
          this.emit(ITEM_ADDED_EVENT, [ val, oldLength + i, this ]);
    }
    this.emit('change:length', [ this.length, oldLength, this ]);

    return this;
  };

  List.prototype.unshift = function () {
    var nItems = arguments.length;
    if (nItems === 0) { return this; }
    var oldLength = this.length;
    this.__array.unshift.apply(this.__array, arguments);

    for (var i = 0; i < nItems; ++i) {
      var val = arguments[i];
      isEmitter(val) ?
          val.emit(ADDED_EVENT, [ i, this ]) :
          this.emit(ITEM_ADDED_EVENT, [ val, i, this ]);
    }
    this.emit('change:length', [ this.length, oldLength, this ]);

    return this;
  };

  List.prototype.pop = function () {
    var oldLength = this.length;
    if (oldLength === 0) { return; }

    var poppedItem = this.__array.pop.apply(this.__array, arguments);

    isEmitter(poppedItem) ?
        poppedItem.emit(REMOVED_EVENT, [ this.length, this ]) :
        this.emit(ITEM_REMOVED_EVENT, [ poppedItem, this.length, this ]);
    this.emit('change:length', [ this.length, oldLength, this ]);

    return poppedItem;
  };

  List.prototype.shift = function () {
    var oldLength = this.length;
    if (oldLength === 0) { return; }

    var poppedItem = this.__array.shift.apply(this.__array, arguments);

    isEmitter(poppedItem) ?
        poppedItem.emit(REMOVED_EVENT, [ 0, this ]) :
        this.emit(ITEM_REMOVED_EVENT, [ poppedItem, 0, this ]);
    this.emit('change:length', [ this.length, oldLength, this ]);

    return poppedItem;
  };

  List.prototype.splice = function (start, deleteCount) {
    var oldLength = this.length;
    var deletedItems = this.__array.splice.apply(this.__array, arguments);

    if (start < 0) {
      start = oldLength + start;
    }

    var item;
    for (var i = 0; i < deleteCount; ++i) {
      item = deletedItems[i];
      isEmitter(item) ?
          item.emit(REMOVED_EVENT, [ start + i, this ]) :
          this.emit(ITEM_REMOVED_EVENT, [ item, start + i, this ]);
    }
    for (i = 2; i < arguments.length; ++i) {
      item = arguments[i];
      isEmitter(item) ?
          item.emit(ADDED_EVENT, [ item, start + (i - 2), this ]) :
          this.emit(ITEM_ADDED_EVENT, [ item, start + (i - 2), this ]);
    }
    this.length === oldLength || this.emit('change:length', [ this.length, oldLength, this ]);

    return this;
  };

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
    var upTo = (typeof end === 'number') ? Math.min(end, length) : length;
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
  // TODO: itemAdded and item:removed events
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

  List.prototype.addEventListener = function (eventName) {
    if (!ITEM_EVENT_PREFIX.test(eventName)) { return; }

    var strippedEventName = eventName.replace(ITEM_EVENT_PREFIX, '');
    var length = this.length;
    for (var i = 0; i < length; ++i) {
      var item = this[i];
      isEmitter(item) && this.listenTo(item, strippedEventName, reemitItemEvent.bind(this, eventName, item));
    }
  };

  List.prototype.removeEventListener = function (eventName) {
    if (!ITEM_EVENT_PREFIX.test(eventName)) { return; }

    var strippedEventName = eventName.replace(ITEM_EVENT_PREFIX, '');
    this.stopListening(undefined, strippedEventName);
  };

  mixin(List, eventEmitter, { 'function': 'merge' });
  mixin(List, eventListener);

  return List;

});
