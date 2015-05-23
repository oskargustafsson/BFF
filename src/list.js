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

  function isEmitter(obj) { return !!(obj && obj.addEventListener); } // Quack!

  function onItemAdded(self, item, index) {
    var args = [ item, index, self ];
    isEmitter(item) && item.emit(ADDED_EVENT, args);
    // Manually reemit event, as we are not yet listening to the item
    self.emit(ITEM_ADDED_EVENT, args);
  }

  function reemitItemEvent(self, item, strippedEventName, eventName) {
    self.listenTo(item, strippedEventName, function () {
      self.emit(eventName, arguments);
    });
  }

  function makeSetter(index) {
    return function setter(val) {
      var oldVal = this[index];
      if (val === oldVal) { return; }

      this.__private.array[index] = val;

      onItemAdded(this, val, index);

      if (isEmitter(oldVal)) {
        oldVal.emit(REPLACED_EVENT, [ val, oldVal, index, this ]);
        oldVal.emit(REMOVED_EVENT, [ oldVal, index, this ]);
      } else {
        this.emit(ITEM_REPLACED_EVENT, [ val, oldVal, index, this ]);
        this.emit(ITEM_REMOVED_EVENT, [ oldVal, index, this ]);
      }
    };
  }

  function makeGetter(index) {
    return function getter() { return this.__private.array[index]; };
  }

  function delegate(funcName) {
    return function () {
      return this.__private.array[funcName].apply(this.__private.array, arguments);
    };
  }

  function delegateCreator(funcName) {
    return function () {
      return new List(this.__private.array[funcName].apply(this.__private.array, arguments));
    };
  }

  function delegateChainable(funcName) {
    return function () {
      this.__private.array[funcName].apply(this.__private.array, arguments);
      return this;
    };
  }

  function List(schema, items) {
    Object.defineProperty(this, '__private', { writable: true, value: {}, });
    this.__private.array = [];

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
        if (!ITEM_EVENT_PREFIX.test(eventName)) { continue; }
        var strippedEventName = eventName.replace(ITEM_EVENT_PREFIX, '');
        if (!listeningTo[strippedEventName]) { continue; }
        reemitItemEvent(this, item, strippedEventName, eventName);
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
    this.__private.array.push.apply(this.__private.array, arguments);

    for (var i = 0; i < nItems; ++i) {
      onItemAdded(this, arguments[i], oldLength + i);
    }
    this.emit('change:length', [ this.length, oldLength, this ]);

    return this;
  };

  List.prototype.unshift = function () {
    var nItems = arguments.length;
    if (nItems === 0) { return this; }
    var oldLength = this.length;
    this.__private.array.unshift.apply(this.__private.array, arguments);

    for (var i = 0; i < nItems; ++i) {
      onItemAdded(this, arguments[i], i);
    }
    this.emit('change:length', [ this.length, oldLength, this ]);

    return this;
  };

  List.prototype.pop = function () {
    var oldLength = this.length;
    if (oldLength === 0) { return; }

    var poppedItem = this.__private.array.pop.apply(this.__private.array, arguments);

    isEmitter(poppedItem) ?
        poppedItem.emit(REMOVED_EVENT, [ poppedItem, this.length, this ]) :
        this.emit(ITEM_REMOVED_EVENT, [ poppedItem, this.length, this ]);
    this.emit('change:length', [ this.length, oldLength, this ]);

    return poppedItem;
  };

  List.prototype.shift = function () {
    var oldLength = this.length;
    if (oldLength === 0) { return; }

    var poppedItem = this.__private.array.shift.apply(this.__private.array, arguments);

    isEmitter(poppedItem) ?
        poppedItem.emit(REMOVED_EVENT, [ poppedItem, 0, this ]) :
        this.emit(ITEM_REMOVED_EVENT, [ poppedItem, 0, this ]);
    this.emit('change:length', [ this.length, oldLength, this ]);

    return poppedItem;
  };

  List.prototype.splice = function (start, deleteCount) {
    var i;
    var oldLength = this.length;
    var deletedItems = this.__private.array.splice.apply(this.__private.array, arguments);

    if (start < 0) {
      start = oldLength + start;
    }

    for (i = 2; i < arguments.length; ++i) {
      onItemAdded(this, arguments[i], start + (i - 2));
    }

    var item;
    for (i = 0; i < deleteCount; ++i) {
      item = deletedItems[i];
      isEmitter(item) ?
          item.emit(REMOVED_EVENT, [ item, start + i, this ]) :
          this.emit(ITEM_REMOVED_EVENT, [ item, start + i, this ]);
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
    var index = this.__private.array.indexOf(item);
    return index !== -1 && index >= fromIndex;
  };

  // TODO: make functions chainable
  // TODO: itemAdded and item:removed events
  // TODO: implement some lodash funcs like union and intersection

  Object.defineProperties(List.prototype, {
    length: {
      get: function () { return this.__private.array.length; },
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
      isEmitter(item) && reemitItemEvent(this, item, strippedEventName, eventName);
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
