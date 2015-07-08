define([
  './mixin',
  './event-emitter',
  './event-listener',
  './record',
], function (
  mixin,
  eventEmitter,
  eventListener,
  Record
) {
  'use strict';

  var ADDED_EVENT = 'added';
  var REPLACED_EVENT = 'replaced';
  var REMOVED_EVENT = 'removed';
  var ITEM_ADDED_EVENT = 'item:added';
  var ITEM_REPLACED_EVENT = 'item:replaced';
  var ITEM_REMOVED_EVENT = 'item:removed';
  var LENGTH_CHANGED_EVENT = 'change:length';

  var ITEM_EVENT_PREFIX = /^item:/;

  function isEmitter(obj) { return !!(obj && obj.addEventListener); } // Quack!

  function onItemAdded(self, item, index) {
    var itemAddedArgs = [ item, index, self ];

    if (!isEmitter(item)) {
      self.emit(ITEM_ADDED_EVENT, itemAddedArgs);
      return;
    }

    var eventNames = self.__private.listeningToItemEvents;
    var nEventNames = eventNames.length;
    for (var i = 0; i < nEventNames; ++i) {
      var eventName = eventNames[i];
      var strippedEventName = eventName.replace(ITEM_EVENT_PREFIX, '');
      reemitItemEvent(self, item, strippedEventName, eventName);
    }

    item.emit(ADDED_EVENT, itemAddedArgs);
  }

  function onItemRemoved(self, item, index) {
    var itemRemovedArgs = [ item, index, self ];

    if (!isEmitter(item)) {
      self.emit(ITEM_REMOVED_EVENT, itemRemovedArgs);
      return;
    }

    item.emit(REMOVED_EVENT, itemRemovedArgs);
    self.stopListening(item);
  }

  function onItemReplaced(self, newItem, oldItem, index) {
    if (newItem === oldItem) { return; }

    var itemReplacedArgs = [ newItem, oldItem, index, self ];

    isEmitter(oldItem) ?
      oldItem.emit(REPLACED_EVENT, itemReplacedArgs) :
      self.emit(ITEM_REPLACED_EVENT, itemReplacedArgs);
  }

  function reemitItemEvent(self, item, strippedEventName, eventName) {
    self.listenTo(item, strippedEventName, function () {
      self.emit(eventName, arguments);
    });
  }

  function makeSetter(index) {
    return function setter(val) { this.splice(index, 1, val); };
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
    this.__private || Object.defineProperty(this, '__private', { writable: true, value: {}, });
    this.__private.array = [];
    this.__private.listeningToItemEvents = [];

    this.listenTo(this, LENGTH_CHANGED_EVENT, function (length, prevLength) {
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

    for (var propName in schema) {
      var propertySchema = schema[propName];

      if (!propertySchema.getter) { throw 'List property ' + propName + ' must have a custom getter function'; }
      if (propertySchema.setter) { throw 'List property ' + propName + ' may not have a setter'; }

      propertySchema.setter = false;
    }

    mixin(schema, {
      length: {
        type: 'number',
        defaultValue: 0,
        setter: function (newLength) {
          // TODO: Make sure this does work as expected
          //if (newLength !== this.__private.array.length) { throw 'Length may not be changed'; }
          return newLength;
        },
      },
      first: {
        getter: function () { return this[0]; },
        setter: false,
      },
      last: {
        getter: function () { return this[this.length - 1]; },
        setter: false,
      }
    });

    Record.call(this, schema);

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
    this.length = this.__private.array.length;

    return this;
  };

  List.prototype.unshift = function () {
    var nItems = arguments.length;
    if (nItems === 0) { return this; }
    this.__private.array.unshift.apply(this.__private.array, arguments);

    for (var i = 0; i < nItems; ++i) {
      onItemAdded(this, arguments[i], i);
    }
    this.length = this.__private.array.length;

    return this;
  };

  List.prototype.pop = function () {
    if (this.length === 0) { return; }

    this.length = this.__private.array.length - 1;
    var poppedItem = this.__private.array.pop.apply(this.__private.array, arguments);

    onItemRemoved(this, poppedItem, this.length);

    return poppedItem;
  };

  List.prototype.shift = function () {
    if (this.length === 0) { return; }

    this.length = this.__private.array.length - 1;
    var poppedItem = this.__private.array.shift.apply(this.__private.array, arguments);

    onItemRemoved(this, poppedItem, 0);

    return poppedItem;
  };

  List.prototype.splice = function (start, nItemsToRemove) {
    var i;
    var oldLength = this.length;
    var nItemsToAdd = arguments.length - 2;
    var nItemsToReplace = Math.min(nItemsToAdd, nItemsToRemove);
    var nItemsAffected = Math.max(nItemsToAdd, nItemsToRemove);

    var deletedItems = this.__private.array.splice.apply(this.__private.array, arguments);

    start < 0 && (start = oldLength + start);

    for (i = 0; i < nItemsAffected; ++i) {
      i < nItemsToAdd && onItemAdded(this, arguments[i + 2], start + i);
      i < nItemsToReplace && onItemReplaced(this, arguments[i + 2], deletedItems[i], start + i);
      i < nItemsToRemove && onItemRemoved(this, deletedItems[i], start + i);
    }

    this.length = this.__private.array.length;

    return this;
  };

  List.prototype.forEach = Array.prototype.forEach;
  List.prototype.reduce = Array.prototype.reduce;

  // TODO: do as above
  [ 'every', 'some', 'indexOf', 'lastIndexOf', 'join', 'reduceRight' ].forEach(function (funcName) {
    List.prototype[funcName] = delegate(funcName);
  });

  [ 'sort', 'reverse' ].forEach(function (funcName) {
    List.prototype[funcName] = delegateChainable(funcName);
  });

  [ 'filter', 'concat', 'slice', 'map' ].forEach(function (funcName) {
    List.prototype[funcName] = delegateCreator(funcName);
  });

  List.prototype.filterMut = function (predicate, thisArg) {
    var length = this.length;
    var removeCount = 0;
    for (var i = length - 1; i >= -1; --i) {
      if (i > -1 && predicate.call(thisArg, this[i], i, this)) {
        removeCount++;
      } else if (removeCount) {
        this.splice(i + 1, removeCount);
        removeCount = 0;
      }
    }
    return this;
  };

  List.prototype.pushArray = List.prototype.concatMut = function (items) {
    items.length && this.push.apply(this, items);
    return this.length;
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

  List.prototype.addEventListener = function (eventName) {
    if (!ITEM_EVENT_PREFIX.test(eventName)) { return; }

    this.__private.listeningToItemEvents.push(eventName);

    var strippedEventName = eventName.replace(ITEM_EVENT_PREFIX, '');
    var length = this.length;
    for (var i = 0; i < length; ++i) {
      var item = this[i];
      isEmitter(item) && reemitItemEvent(this, item, strippedEventName, eventName);
    }
  };

  List.prototype.removeEventListener = function (eventName) {
    if (!ITEM_EVENT_PREFIX.test(eventName)) { return; }

    var pos = this.__private.listeningToItemEvents.indexOf(eventName);
    pos === -1 || this.__private.listeningToItemEvents.splice(pos, 1);

    var strippedEventName = eventName.replace(ITEM_EVENT_PREFIX, '');
    this.stopListening(undefined, strippedEventName);
  };

  mixin(List, eventEmitter, { 'function': 'merge' });
  mixin(List, eventListener);

  return List;

});
