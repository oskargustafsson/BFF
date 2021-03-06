!function() {
  'use strict';
  function moduleFactory(extend, eventEmitter, Record) {
    function isEmitter(obj) {
      return !!(obj && obj.addEventListener);
    }
    function reemitItemEvent(self, item, strippedEventName, eventName) {
      self.listenTo(item, strippedEventName, function() {
        self.emitArgsAsArray(eventName, arguments);
      });
    }
    function onItemAdded(self, item, index) {
      if (!isEmitter(item)) {
        self.emit(ITEM_ADDED_EVENT, item, index, self);
        return;
      }
      for (var eventName in self.__private.reEmittingEvents) {
        var strippedEventName = eventName.replace(ITEM_EVENT_TOKEN_MATCHER, '');
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
      if (newItem === oldItem) {
        return;
      }
      isEmitter(oldItem) ? oldItem.emit(REPLACED_EVENT, newItem, oldItem, index, self) : self.emit(ITEM_REPLACED_EVENT, newItem, oldItem, index, self);
    }
    function makeSetter(index) {
      return function(val) {
        this.splice(index, 1, val);
      };
    }
    function makeGetter(index) {
      return function() {
        return this.__private.array[index];
      };
    }
    function delegate(funcName) {
      return function() {
        return this.__private.array[funcName].apply(this.__private.array, arguments);
      };
    }
    function delegateCreator(funcName) {
      return function() {
        return new this.constructor(this.__private.array[funcName].apply(this.__private.array, arguments));
      };
    }
    function triggerPrechangeLengthEvent(self) {
      self.emit(PRECHANGE_EVENT, 'length', self.length, self);
      self.emit(PRECHANGE_LENGTH_EVENT, self.length, self);
    }
    function triggerChangeLengthEvent(self, prevLength) {
      if (self.length === prevLength) {
        return;
      }
      self.emit(CHANGE_EVENT, 'length', self.length, prevLength, self);
      self.emit(CHANGE_LENGTH_EVENT, self.length, prevLength, self);
    }
    function withProperties(schema) {
      function List(items) {
        if (true && arguments.length > 0 && (!items || void 0 === items.length)) {
          throw '"items" argument must have a length property';
        }
        this.__private || Object.defineProperty(this, '__private', {
          writable: true,
          value: {}
        });
        this.__private.array = [];
        this.__private.reEmittingEvents = {};
        this.listenTo(this, CHANGE_LENGTH_EVENT, function(length, prevLength) {
          var diff = length - prevLength;
          var i;
          if (diff > 0) {
            for (i = prevLength; i < length; ++i) {
              Object.defineProperty(this, i, {
                enumerable: true,
                configurable: true,
                get: makeGetter(i),
                set: makeSetter(i)
              });
            }
          } else {
            for (i = length; i < prevLength; ++i) {
              delete this[i];
            }
          }
        });
        RecordSubclass.call(this);
        items = items || [];
        items.length && this.pushAll(items);
      }
      for (var propName in schema) {
        var propertySchema = schema[propName];
        if (true && !propertySchema.getter) {
          throw 'List property ' + propName + ' must have a custom getter function';
        }
        if (true && propertySchema.setter) {
          throw 'List property ' + propName + ' may not have a setter';
        }
        propertySchema.setter = false;
      }
      extend(schema, {
        length: {
          getter: function() {
            return this.__private.array.length;
          },
          setter: false
        },
        first: {
          getter: function() {
            return this[0];
          },
          setter: false
        },
        last: {
          getter: function() {
            return this[this.length - 1];
          },
          setter: false
        }
      });
      var RecordSubclass = Record.withProperties(schema, true);
      List.prototype = Object.create(RecordSubclass.prototype);
      List.prototype.constructor = List;
      extend(List.prototype, listFunctions);
      return List;
    }
    var ADDED_EVENT = 'added';
    var REPLACED_EVENT = 'replaced';
    var REMOVED_EVENT = 'removed';
    var ITEM_ADDED_EVENT = 'item:added';
    var ITEM_REPLACED_EVENT = 'item:replaced';
    var ITEM_REMOVED_EVENT = 'item:removed';
    var CHANGE_LENGTH_EVENT = 'change:length';
    var PRECHANGE_LENGTH_EVENT = 'prechange:length';
    var PRECHANGE_EVENT = 'prechange';
    var CHANGE_EVENT = 'change';
    var ITEM_EVENT_TOKEN_MATCHER = /item:/;
    var listFunctions = {};
    listFunctions.push = function() {
      var nItems = arguments.length;
      if (0 === nItems) {
        return this.length;
      }
      var prevLength = this.length;
      triggerPrechangeLengthEvent(this);
      var privArray = this.__private.array;
      privArray.push.apply(privArray, arguments);
      for (var i = prevLength; i < privArray.length; ++i) {
        onItemAdded(this, privArray[i], i);
      }
      triggerChangeLengthEvent(this, prevLength);
      return this.length;
    };
    listFunctions.unshift = function() {
      var nItems = arguments.length;
      if (0 === nItems) {
        return this.length;
      }
      var prevLength = this.length;
      triggerPrechangeLengthEvent(this);
      var privArray = this.__private.array;
      privArray.unshift.apply(privArray, arguments);
      for (var i = 0; i < nItems; ++i) {
        onItemAdded(this, privArray[i], i);
      }
      triggerChangeLengthEvent(this, prevLength);
      return this.length;
    };
    listFunctions.pop = function() {
      if (0 === this.length) {
        return;
      }
      var prevLength = this.length;
      triggerPrechangeLengthEvent(this);
      var privArray = this.__private.array;
      var poppedItem = privArray.pop.apply(privArray, arguments);
      onItemRemoved(this, poppedItem, this.length);
      triggerChangeLengthEvent(this, prevLength);
      return poppedItem;
    };
    listFunctions.shift = function() {
      if (0 === this.length) {
        return;
      }
      var prevLength = this.length;
      triggerPrechangeLengthEvent(this);
      var privArray = this.__private.array;
      var shiftedItem = privArray.shift.apply(privArray, arguments);
      onItemRemoved(this, shiftedItem, 0);
      triggerChangeLengthEvent(this, prevLength);
      return shiftedItem;
    };
    listFunctions.splice = function(start, nItemsToRemove) {
      if (true) {
        if (arguments.length < 2) {
          throw '"start" and "nItemsToRemove" arguments are mandatory';
        }
        if ('number' != typeof start) {
          throw '"start" argument must be a number';
        }
        if ('number' != typeof nItemsToRemove) {
          throw '"nItemsToRemove" argument must be a number';
        }
      }
      var i;
      var oldLength = this.length;
      if (start < 0) {
        start = oldLength + start;
      }
      nItemsToRemove = Math.min(nItemsToRemove, oldLength - start);
      var nItemsToAdd = arguments.length - 2;
      var nItemsToReplace = Math.min(nItemsToAdd, nItemsToRemove);
      var nItemsAffected = Math.max(nItemsToAdd, nItemsToRemove);
      var prevLength = this.length;
      triggerPrechangeLengthEvent(this);
      var privArray = this.__private.array;
      var deletedItems = privArray.splice.apply(privArray, arguments);
      for (i = 0; i < nItemsAffected; ++i) {
        if (i < nItemsToAdd) {
          onItemAdded(this, privArray[start + i], start + i);
        }
        if (i < nItemsToReplace) {
          onItemReplaced(this, privArray[start + i], deletedItems[i], start + i);
        }
        if (i < nItemsToRemove) {
          onItemRemoved(this, deletedItems[i], start + i);
        }
      }
      triggerChangeLengthEvent(this, prevLength);
      return deletedItems;
    };
    [ 'forEach', 'every', 'some', 'indexOf', 'lastIndexOf', 'join', 'reduce', 'reduceRight' ].forEach(function(funcName) {
      listFunctions[funcName] = Array.prototype[funcName];
    });
    [ 'sort', 'reverse' ].forEach(function(funcName) {
      listFunctions[funcName] = delegate(funcName);
    });
    [ 'filter', 'slice', 'map' ].forEach(function(funcName) {
      listFunctions[funcName] = delegateCreator(funcName);
    });
    listFunctions.concat = function() {
      for (var i = 0, n = arguments.length; i < n; ++i) {
        var argument = arguments[i];
        if (!(argument instanceof Array) && void 0 !== argument.length) {
          arguments[i] = argument.toArray();
        }
      }
      return new this.constructor(this.__private.array.concat.apply(this.__private.array, arguments));
    };
    listFunctions.filterMut = function(predicate, thisArg) {
      if (true) {
        if ('function' != typeof predicate) {
          throw '"predicate" argument must be a function';
        }
      }
      var removeCount = 0;
      for (var i = this.length - 1; i >= -1; --i) {
        if (i > -1 && !predicate.call(thisArg, this[i], i, this)) {
          removeCount++;
        } else {
          if (removeCount) {
            this.splice(i + 1, removeCount);
            removeCount = 0;
          }
        }
      }
      return this;
    };
    listFunctions.remove = function(item) {
      return this.filterMut(function(listItem) {
        return item !== listItem;
      });
    };
    listFunctions.clear = function() {
      return this.splice(0, this.length);
    };
    listFunctions.pushAll = function(items) {
      if (true && (!items || void 0 === items.length)) {
        throw '"items" argument must have a length property';
      }
      items.length && this.push.apply(this, items);
      return this.length;
    };
    listFunctions.sliceMut = function(begin, end) {
      if (true) {
        if (arguments.length < 2) {
          throw '"begin" and "end" arguments are mandatory';
        }
        if ('number' != typeof begin) {
          throw '"begin" argument must be a number';
        }
        if ('number' != typeof end) {
          throw '"end" argument must be a number';
        }
      }
      var length = this.length;
      end = 'undefined' != typeof end ? end : length;
      var start = begin || 0;
      start = start >= 0 ? start : Math.max(0, length + start);
      var upTo = ('number' == typeof end ? Math.min(end, length) : length) - 1;
      end < 0 && (upTo = length + end);
      var size = upTo - start;
      if (size !== length) {
        this.splice(0, start);
        this.splice(upTo, length - upTo);
      }
      return this;
    };
    listFunctions.mapMut = function(callback, thisArg) {
      if (true && 'function' != typeof callback) {
        throw '"callback" argument must be a function';
      }
      for (var i = 0, length = this.length; i < length; ++i) {
        this[i] = callback.call(thisArg, this[i], i, this);
      }
      return this;
    };
    listFunctions.find = function(predicate, thisArg) {
      if (true && 'function' != typeof predicate) {
        throw '"predicate" argument must be a function';
      }
      for (var i = 0, length = this.length; i < length; ++i) {
        if (predicate.call(thisArg, this[i], i, this)) {
          return this[i];
        }
      }
    };
    listFunctions.findIndex = function(predicate, thisArg) {
      if (true && 'function' != typeof predicate) {
        throw '"predicate" argument must be a function';
      }
      for (var i = 0, length = this.length; i < length; ++i) {
        if (predicate.call(thisArg, this[i], i, this)) {
          return i;
        }
      }
      return -1;
    };
    listFunctions.includes = function(item, fromIndex) {
      if (true && arguments.length > 1 && 'number' != typeof fromIndex) {
        throw '"fromIndex" number must be a number';
      }
      fromIndex = fromIndex || 0;
      var index = this.__private.array.indexOf(item);
      return index !== -1 && index >= fromIndex;
    };
    listFunctions.toArray = function() {
      return this.__private.array.slice();
    };
    listFunctions.toJSON = function() {
      var jsonObj = new Array(this.length);
      for (var i = 0, n = jsonObj.length; i < n; ++i) {
        var item = this[i];
        jsonObj[i] = item instanceof Object ? item.toJSON ? item.toJSON() : JSON.parse(JSON.stringify(item)) : item;
      }
      return jsonObj;
    };
    listFunctions.propertiesToJSON = function() {
      return Record.prototype.toJSON.call(this);
    };
    listFunctions.addEventListener = function(eventName) {
      if (true && 'string' != typeof eventName) {
        throw '"eventName" argument must be a string';
      }
      if (!ITEM_EVENT_TOKEN_MATCHER.test(eventName) || this.__private.reEmittingEvents[eventName]) {
        return;
      }
      this.__private.reEmittingEvents[eventName] = true;
      var strippedEventName = eventName.replace(ITEM_EVENT_TOKEN_MATCHER, '');
      for (var i = 0, n = this.length; i < n; ++i) {
        var item = this[i];
        isEmitter(item) && reemitItemEvent(this, item, strippedEventName, eventName);
      }
    };
    listFunctions.removeEventListener = function(eventName) {
      if (true && 'string' != typeof eventName) {
        throw '"eventName" argument must be a string';
      }
      if (!ITEM_EVENT_TOKEN_MATCHER.test(eventName)) {
        return;
      }
      var listeners = this.__private.listeners[eventName];
      if (listeners && listeners.length) {
        return;
      }
      delete this.__private.reEmittingEvents[eventName];
      var strippedEventName = eventName.replace(ITEM_EVENT_TOKEN_MATCHER, '');
      this.stopListening(void 0, strippedEventName);
    };
    extend(listFunctions, eventEmitter, {
      function: 'merge'
    });
    listFunctions.toString = function() {
      return JSON.stringify(this, void 0, 2);
    };
    var List = withProperties({});
    List.withProperties = withProperties;
    return List;
  }
  if ('function' == typeof define && define.amd) {
    define([ './extend', './event-emitter', './record' ], moduleFactory);
  } else {
    if ('object' == typeof exports) {
      module.exports = moduleFactory(require('./extend'), require('./event-emitter'), require('./record'));
    } else {
      var bff = window.bff = window.bff || {};
      bff.List = moduleFactory(bff.extend, bff.eventEmitter, bff.Record);
    }
  }
}();