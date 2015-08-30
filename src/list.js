/** @module bff/list */
define([
  './extend',
  './event-emitter',
  './event-listener',
  './record',
], function (
  extend,
  eventEmitter,
  eventListener,
  Record
) {
  'use strict';

  var ADDED_EVENT = 'added';
  var REPLACED_EVENT = 'replaced';
  var REMOVED_EVENT = 'removed';
  /**
   * @event module:bff/list#item:added
   * @arg {any} item - The item that was added to the List.
   * @arg {number} index - The position withing the List where the item was added.
   * @arg {module:bff/list} list - The List to which the item was added.
   */
  var ITEM_ADDED_EVENT = 'item:added';
  /**
   * @event module:bff/list#item:replaced
   * @arg {any} newItem - The item that was added to the List.
   * @arg {any} oldItem - The item that was removed from the List.
   * @arg {number} index - The position withing the List where the item was replaced.
   * @arg {module:bff/list} list - The List in which the item was replaced.
   */
  var ITEM_REPLACED_EVENT = 'item:replaced';
  /**
   * @event module:bff/list#item:removed
   * @arg {any} item - The item that was removed from the List.
   * @arg {number} index - The position withing the List where the item was removed.
   * @arg {module:bff/list} list - The List from which the item was removed.
   */
  var ITEM_REMOVED_EVENT = 'item:removed';
  /**
   * @event module:bff/list#change:length
   * @arg {number} newLength - The current length of the List.
   * @arg {number} oldLength - The previous length of the List.
   * @arg {module:bff/list} list - The List whose length has changed.
   */
  var LENGTH_CHANGED_EVENT = 'change:length';

  var ITEM_EVENT_PREFIX = /^item:/;

  function isEmitter(obj) { return !!(obj && obj.addEventListener); } // Quack!

  function onItemAdded(self, item, index) {
    if (!isEmitter(item)) {
      self.emit(ITEM_ADDED_EVENT, item, index, self);
      return;
    }

    var eventNames = self.__private.listeningToItemEvents;
    var nEventNames = eventNames.length;
    for (var i = 0; i < nEventNames; ++i) {
      var eventName = eventNames[i];
      var strippedEventName = eventName.replace(ITEM_EVENT_PREFIX, '');
      reemitItemEvent(self, item, strippedEventName, eventName);
    }

    item.emit(ADDED_EVENT, item, index, self);
  }

  function onItemRemoved(self, item, index) {
    if (!isEmitter(item)) {
      self.emit(ITEM_REMOVED_EVENT, item, index, self);
      return;
    }

    item.emit(REMOVED_EVENT, item, index, self);
    self.stopListening(item);
  }

  function onItemReplaced(self, newItem, oldItem, index) {
    if (newItem === oldItem) { return; }

    isEmitter(oldItem) ?
      oldItem.emit(REPLACED_EVENT, newItem, oldItem, index, self) :
      self.emit(ITEM_REPLACED_EVENT, newItem, oldItem, index, self);
  }

  function reemitItemEvent(self, item, strippedEventName, eventName) {
    self.listenTo(item, strippedEventName, function () {
      self.emit.apply(self, [ eventName ].concat(Array.prototype.slice.call(arguments))); // TODO: better solution
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

  /**
   * Represents a list of items.
   * @constructor
   * @alias module:bff/list
   * @mixes bff/event-emitter
   * @mixes bff/event-listener
   * @arg {Object} [schema] - Description of properties that will be added to the List.
   * @arg {(Array|List)} [items] - Items that will be added to the List on creation.
   */
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

    if (RUNTIME_CHECKS && typeof schema !== 'object') {
      throw 'Schema argument must be an object';
    }
    if (RUNTIME_CHECKS && !(items instanceof Array)) {
      throw 'Items argument must be an array';
    }

    for (var propName in schema) {
      var propertySchema = schema[propName];

      if (RUNTIME_CHECKS && !propertySchema.getter) {
        throw 'List property ' + propName + ' must have a custom getter function';
      }
      if (RUNTIME_CHECKS && propertySchema.setter) {
        throw 'List property ' + propName + ' may not have a setter';
      }

      propertySchema.setter = false;
    }

    extend(schema, {
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

  /**
   * Add one or more items to the end of the List. Mirrors Array.push behavior.
   * @arg {...any} item - Each item argument will be pushed onto the List.
   * @emits module:bff/list#change:length
   * @emits module:bff/list#item:added
   * @returns {module:bff/list} Self reference
   */
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

  /**
   * Add one or more items to the beginning of the List. Mirrors Array.unshift behavior.
   * @arg {...any} item - Each item argument will be pushed onto the List.
   * @emits module:bff/list#change:length
   * @emits module:bff/list#item:added
   * @returns {module:bff/list} Self reference
   */
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

  /**
   * Remove and return one item from the end of the List. Mirrors Array.pop behavior.
   * @emits module:bff/list#change:length
   * @emits module:bff/list#item:removed
   * @returns {any} Removed item
   */
  List.prototype.pop = function () {
    if (this.length === 0) { return; }

    this.length = this.__private.array.length - 1;
    var poppedItem = this.__private.array.pop.apply(this.__private.array, arguments);

    onItemRemoved(this, poppedItem, this.length);

    return poppedItem;
  };

  /**
   * Remove and return one item from the beginning of the List. Mirrors Array.shift behavior.
   * @emits module:bff/list#change:length
   * @emits module:bff/list#item:removed
   * @returns {any} Removed item
   */
  List.prototype.shift = function () {
    if (this.length === 0) { return; }

    this.length = this.__private.array.length - 1;
    var shiftedItem = this.__private.array.shift.apply(this.__private.array, arguments);

    onItemRemoved(this, shiftedItem, 0);

    return shiftedItem;
  };

  /**
   * Changes the content of the List by removing existing elements and/or adding new elements. Mirrors Array.splice
   * behavior.
   * @arg {number} start - Index at which to start changing the array. If greater than the length of the array, actual
   *     starting index will be set to the length of the array. If negative, will begin that many elements from the end.
   * @arg {number} nItemsToRemove - An integer indicating the number of old array elements to remove. If nItemsToRemove
   *     is greater than the number of elements left in the array starting at start, then all of the elements through
   *     the end of the array will be deleted.
   * @arg {...any} [itemToAdd] - Item that will be added to the array, starting at the index specified in the first
   *     argument.
   * @emits module:bff/list#change:length
   * @emits module:bff/list#item:added
   * @emits module:bff/list#item:replaced
   * @emits module:bff/list#item:removed
   * @returns {any[]} Array of removed items
   */
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

    return deletedItems;
  };

  /**
   * @callback module:bff/list~forEachCallback
   * @param {any} item - Current List item.
   * @param {number} index - Item position in List.
   * @param {module:bff/list} list - List being iterated over.
   */

  /**
   * Executes the given function once per List item. Mirrors Array.forEach behavior.
   * @func
   * @arg {module:bff/list~forEachCallback} callback - The function that will be called once per List item.
   * @arg {any} thisArg - Value to use as "this" when executing callback.
   * @returns {undefined}
   */
  List.prototype.forEach = Array.prototype.forEach;

  /**
   * @callback module:bff/list~reduceCallback
   * @param {any} previousItem - The value previously returned in the last invocation of the callback, or initialValue,
   *     if supplied. Usually an aggregate of previous items.
   * @param {any} item - Current List item being processed.
   * @param {number} index - Item position in List.
   * @param {module:bff/list} list - List being iterated over.
   */

  /**
   * Applies a function against an accumulator and each value of the array (from left-to-right) to reduce it to a single
   *     value. Mirrors Array.reduce behavior.
   * @func
   * @arg {module:bff/list~reduceCallback} callback - The function that will be called once per List item.
   * @arg {any} initialVale - Value to use as the first argument to the first call of the callback.
   * @returns {any} Aggregated value
   */
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

  List.prototype.toArray = function () {
    return this.__private.array.slice();
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

  extend(List.prototype, eventEmitter, { 'function': 'merge' });
  extend(List.prototype, eventListener);

  return List;

});
