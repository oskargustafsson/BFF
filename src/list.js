/* global RUNTIME_CHECKS, define */

/**
 * @module bff/list
 */

(function () {
	'use strict';

	function moduleFactory(extend, eventEmitter, Record) {
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
		var CHANGE_LENGTH_EVENT = 'change:length';

		// "Private event"
		var PRECHANGE_LENGTH_EVENT = 'prechange:length';

		var PRECHANGE_EVENT = 'prechange';
		var CHANGE_EVENT = 'change';

		/**
		 * @callback module:bff/list~forEachCallback
		 * @param {any} item - Current List item.
		 * @param {number} index - Item position in List.
		 * @param {module:bff/list} list - List being iterated over.
		 */

		/**
		 * @callback module:bff/list~mapCallback
		 * @param {any} item - Current List item.
		 * @param {number} index - Item position in List.
		 * @param {module:bff/list} list - List being iterated over.
		 * @returns {any} Transformed object.
		 */

		/**
		 * @callback module:bff/list~predicateCallback
		 * @param {any} item - Current List item.
		 * @param {number} index - Item position in List.
		 * @param {module:bff/list} list - List being iterated over.
		 * @returns {boolean} true if the item passes the test, false otherwise
		 */

		/**
		 * @callback module:bff/list~reduceCallback
		 * @param {any} previousItem - The value previously returned in the last invocation of the callback, or
		 *     initialValue, if supplied. Usually an aggregate of previous items.
		 * @param {any} item - Current List item being processed.
		 * @param {number} index - Item position in List.
		 * @param {module:bff/list} list - List being iterated over.
		 * @returns {any} The aggregated value.
		 */

		/**
		 * Compares _itemA_ and _itemB_ arguments according to some sorting criterion. Should return -1 if _itemA_ comes
		 * before _itemB_, 0 if _itemA_ is equal to _itemB_, 1 if _itemB_ comes before _itemA_.
		 * @callback module:bff/list~compareFunction
		 * @param {any} itemA - A list item.
		 * @param {any} itemB - Another list item.
		 * @returns {number}.
		 */

		var ITEM_EVENT_TOKEN_MATCHER = /item:/;

		function isEmitter(obj) { return !!(obj && obj.addEventListener); } // Quack!

		function reemitItemEvent(self, item, strippedEventName, eventName) {
			self.listenTo(item, strippedEventName, function reemitItemEvent() {
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
			if (newItem === oldItem) { return; }

			isEmitter(oldItem) ?
				oldItem.emit(REPLACED_EVENT, newItem, oldItem, index, self) :
				self.emit(ITEM_REPLACED_EVENT, newItem, oldItem, index, self);
		}

		function makeSetter(index) {
			// TODO: Investigate if this is really a good idea, performance wise
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
				return new this.constructor(this.__private.array[funcName].apply(this.__private.array, arguments));
			};
		}

		function triggerPrechangeLengthEvent(self) {
			self.emit(PRECHANGE_EVENT, 'length', self.length, self);
			self.emit(PRECHANGE_LENGTH_EVENT, self.length, self);
		}

		function triggerChangeLengthEvent(self, prevLength) {
			if (self.length === prevLength) { return; }
			self.emit(CHANGE_EVENT, 'length', self.length, prevLength, self);
			self.emit(CHANGE_LENGTH_EVENT, self.length, prevLength, self);
		}

		var listFunctions = {};

		/**
		 * Add one or more items to the end of the List. Mirrors Array.push behavior.
		 * @func push
		 * @instance
		 * @arg {...any} item - Each item argument will be pushed onto the List.
		 * @emits module:bff/list#change:length
		 * @emits module:bff/list#item:added
		 * @returns {Number} Updated List length
		 */
		listFunctions.push = function push() {
			var nItems = arguments.length;
			if (nItems === 0) { return this.length; }

			var prevLength = this.length;
			triggerPrechangeLengthEvent(this);

			this.__private.array.push.apply(this.__private.array, arguments);

			triggerChangeLengthEvent(this, prevLength);
			for (var i = 0; i < nItems; ++i) {
				onItemAdded(this, this[prevLength + i], prevLength + i);
			}

			return this.length;
		};

		/**
		 * Add one or more items to the beginning of the List. Mirrors Array.unshift behavior.
		 * @func unshift
		 * @instance
		 * @arg {...any} item - Each item argument will be pushed onto the List.
		 * @emits module:bff/list#change:length
		 * @emits module:bff/list#item:added
		 * @returns {Number} Updated List length
		 */
		listFunctions.unshift = function unshift() {
			var nItems = arguments.length;
			if (nItems === 0) { return this.length; }

			var prevLength = this.length;
			triggerPrechangeLengthEvent(this);

			this.__private.array.unshift.apply(this.__private.array, arguments);

			triggerChangeLengthEvent(this, prevLength);
			for (var i = 0; i < nItems; ++i) {
				onItemAdded(this, this[i], i);
			}

			return this.length;
		};

		/**
		 * Remove and return one item from the end of the List. Mirrors Array.pop behavior.
		 * @func pop
		 * @instance
		 * @emits module:bff/list#change:length
		 * @emits module:bff/list#item:removed
		 * @returns {any} Removed item
		 */
		listFunctions.pop = function pop() {
			if (this.length === 0) { return; }

			var prevLength = this.length;
			triggerPrechangeLengthEvent(this);

			var poppedItem = this.__private.array.pop.apply(this.__private.array, arguments);

			triggerChangeLengthEvent(this, prevLength);
			onItemRemoved(this, poppedItem, this.length);

			return poppedItem;
		};

		/**
		 * Remove and return one item from the beginning of the List. Mirrors Array.shift behavior.
		 * @func shift
		 * @instance
		 * @emits module:bff/list#change:length
		 * @emits module:bff/list#item:removed
		 * @returns {any} Removed item
		 */
		listFunctions.shift = function shift() {
			if (this.length === 0) { return; }

			var prevLength = this.length;
			triggerPrechangeLengthEvent(this);

			var shiftedItem = this.__private.array.shift.apply(this.__private.array, arguments);

			triggerChangeLengthEvent(this, prevLength);
			onItemRemoved(this, shiftedItem, 0);

			return shiftedItem;
		};

		/**
		 * Changes the content of the List by removing existing items and/or adding new items. Mirrors Array.splice
		 * behavior.
		 * @func splice
		 * @instance
		 * @arg {number} start - Index at which to start changing the array. If greater than the length of the array, actual
		 *     starting index will be set to the length of the array. If negative, will begin that many items from the
		 *     end.
		 * @arg {number} nItemsToRemove - An integer indicating the number of old array items to remove. If
		 *     nItemsToRemove is greater than the number of items left in the array starting at start, then all of the
		 *     items through the end of the array will be deleted.
		 * @arg {...any} [itemToAdd] - Item that will be added to the array, starting at the index specified in the first
		 *     argument.
		 * @emits module:bff/list#change:length
		 * @emits module:bff/list#item:added
		 * @emits module:bff/list#item:replaced
		 * @emits module:bff/list#item:removed
		 * @returns {any[]} Array of removed items
		 */
		listFunctions.splice = function splice(start, nItemsToRemove) {
			if (RUNTIME_CHECKS) {
				if (arguments.length < 2) { throw '"start" and "nItemsToRemove" arguments are mandatory'; }
				if (typeof start !== 'number') { throw '"start" argument must be a number'; }
				if (typeof nItemsToRemove !== 'number') { throw '"nItemsToRemove" argument must be a number'; }
			}

			var i;
			var oldLength = this.length;

			start < 0 && (start = oldLength + start);
			nItemsToRemove = Math.min(nItemsToRemove, oldLength - start);

			var nItemsToAdd = arguments.length - 2;
			var nItemsToReplace = Math.min(nItemsToAdd, nItemsToRemove);
			var nItemsAffected = Math.max(nItemsToAdd, nItemsToRemove);

			var prevLength = this.length;
			triggerPrechangeLengthEvent(this);

			var deletedItems = this.__private.array.splice.apply(this.__private.array, arguments);

			triggerChangeLengthEvent(this, prevLength);
			for (i = 0; i < nItemsAffected; ++i) {
				i < nItemsToAdd && onItemAdded(this, this[start + i], start + i);
				i < nItemsToReplace && onItemReplaced(this, this[start + i], deletedItems[i], start + i);
				i < nItemsToRemove && onItemRemoved(this, deletedItems[i], start + i);
			}

			return deletedItems;
		};

		[
			/**
			 * Executes the given function once per List item. Mirrors Array.forEach behavior.
			 * @func forEach
			 * @instance
			 * @arg {module:bff/list~forEachCallback} callback - The function that will be called once per List item.
			 * @arg {any} [thisArg] - Value to use as "this" when executing callback.
			 */
			'forEach',
			/**
			 * @func every
			 * @instance
			 * Mirrors Array.every behavior.
			 * @arg {module:bff/list~predicateCallback} predicate - Executed once per List item.
			 * @arg {any} [thisArg] - Value to use as "this" when executing callback.
			 * @returns {boolean} true if all items passes the predicate test, false otherwise.
			 */
			'every',
			/**
			 * @func some
			 * @instance
			 * Mirrors Array.some behavior.
			 * @arg {module:bff/list~predicateCallback} predicate - Executed once per List item.
			 * @arg {any} [thisArg] - Value to use as "this" when executing callback.
			 * @returns {boolean} true if at least one item passes the predicate test, false otherwise.
			 */
			'some',
			/**
			 * @func indexOf
			 * @instance
			 * @arg {any} searchItem - The item to locate within the List.
			 * @arg {number} [fromIndex] - The index to start the search at. If the index is greater than or equal to the
			 *     List's length, -1 is returned, which means the List will not be searched. If the provided index
			 *     value is a negative number, it is taken as the offset from the end of the List. Mirrors Array.indexOf behavior.
			 * @returns {number} The first index at which a given item can be found in the List, or -1 if it is not present.
			 */
			'indexOf',
			/**
			 * @func lastIndexOf
			 * @instance
			 * @arg {any} searchItem - The item to locate within the List.
			 * @arg {number} [fromIndex] - The index at which to start searching backwards. Defaults to the List's length
			 *     minus one, i.e. the whole List will be searched. If the index is greater than or equal to the length
			 *     of the List, the whole List will be searched. If negative, it is taken as the offset from the end
			 *     of the List. Mirrors Array.lastIndexOf behavior.
			 * @returns {number} The last index at which a given item can be found in the List, or -1 if it is not present.
			 */
			'lastIndexOf',
			/**
			 * @func join
			 * @instance
			 * @arg {string} [separator] - Specifies a string to separate each item of the List. If omitted, the List
			 *     items are separated with a comma. Mirrors Array.join behavior.
			 * @returns {string} The stringified List items, joined by the 'separator' string argument.
			 */
			'join',
			/**
			 * Applies a function against an accumulator and each value of the List (from left-to-right) to reduce it to a
			 * single value. Mirrors Array.reduce behavior.
			 * @func reduce
			 * @instance
			 * @arg {module:bff/list~reduceCallback} callback - The function that will be called once per List item.
			 * @arg {any} initialValue - Value to use as the first argument to the first call of the callback.
			 * @returns {any} Aggregated value
			 */
			'reduce',
			/**
			 * Applies a function against an accumulator and each value of the List (from right-to-left) to reduce it to a
			 * single value. Mirrors Array.reduceRight behavior.
			 * @func reduceRight
			 * @instance
			 * @arg {module:bff/list~reduceCallback} callback - The function that will be called once per List item.
			 * @arg {any} initialValue - Value to use as the first argument to the first call of the callback.
			 * @returns {any} Aggregated value
			 */
			'reduceRight'
		].forEach(function (funcName) {
			listFunctions[funcName] = Array.prototype[funcName];
		});

		[
			/**
			 * Sorts the items of the List in place. The sort is not necessarily stable. The default sort order is
			 * according to string Unicode code points, unless a custom comparator finction is provided. Mirrors the
			 * behavior of Array.sort. No events are emitted by this operation.
			 * @func sort
			 * @instance
			 * @arg {module:bff/list~compareFunction} [comparator] - A function that specifies the ordering of two
			 *     arbitrary List items. Called multiple times in order to produce a total ordering of the items.
			 * @returns {List} The sorted list.
			 */
			'sort',
			/**
			 * Reverses the List in place. Mirros the behavior of Array.reverse. No events are emitted by this operation.
			 * @func reverse
			 * @instance
			 */
			'reverse'
		].forEach(function (funcName) {
			listFunctions[funcName] = delegate(funcName);
		});

		[
			/**
			 * Creates a new List with all items that pass the test implemented by the predicate function test. The
			 * original list is unchanged. Mirrors the behavior of Array.filter.
			 * @func filter
			 * @instance
			 * @arg {module:bff/list~predicateCallback} predicate - Executed once per List item.
			 * @returns {List}
			 */
			'filter',
			/**
			 * Creates a new List from the range of current items specified by the begin and end arguments. Mirrors the
			 * behavior of Array.slice.
			 * @func slice
			 * @instance
			 * @arg {number} [begin] Index that specifies the beginning of the range. Inclusive. A negative index will
			 *     be relative to the end of the List instead of the beginning.
			 * @arg {number} [end] Index that specifies the end of the range. Exclusive. A negative index will
			 *     be relative to the end of the List instead of the beginning.
			 * @returns {List}
			 */
			'slice',
			/**
			 * Creates a new List with the results of calling a provided callback function on every element in the List.
			 * Mirrors the behavior of Array.map.
			 * @func map
			 * @instance
			 * @arg {module:bff/module~mapCallback} callback - Executed once per List item.
			 * @arg {any} [thisArg] - Value to use as "this" when executing callback.
			 * @returns {List}
			 */
			'map'
		].forEach(function (funcName) {
			listFunctions[funcName] = delegateCreator(funcName);
		});

		listFunctions.concat = function concat() {
			for (var i = 0, n = arguments.length; i < n; ++i) {
				var argument = arguments[i];
				if (!(argument instanceof Array) && argument.length !== undefined) {
					arguments[i] = argument.toArray();
				}
			}
			return new this.constructor(this.__private.array.concat.apply(this.__private.array, arguments));
		};

		listFunctions.filterMut = function filterMut(predicate, thisArg) {
			if (RUNTIME_CHECKS) {
				if (typeof predicate !== 'function') { throw '"predicate" argument must be a function'; }
			}

			var removeCount = 0;
			for (var i = this.length - 1; i >= -1; --i) {
				if (i > -1 && !predicate.call(thisArg, this[i], i, this)) {
					removeCount++;
				} else if (removeCount) {
					this.splice(i + 1, removeCount);
					removeCount = 0;
				}
			}
			return this;
		};

		listFunctions.remove = function remove(item) {
			return this.filterMut(function (listItem) { return item !== listItem; });
		};

		listFunctions.clear = function clear() {
			return this.splice(0, this.length);
		};

		listFunctions.pushAll = listFunctions.concatMut = function pushAll(items) {
			if (RUNTIME_CHECKS && (!items || items.length === undefined)) {
				throw '"items" argument must have a length property';
			}
			items.length && this.push.apply(this, items);
			return this.length;
		};

		listFunctions.sliceMut = function sliceMut(begin, end) {
			if (RUNTIME_CHECKS) {
				if (arguments.length < 2) { throw '"begin" and "end" arguments are mandatory'; }
				if (typeof begin !== 'number') { throw '"begin" argument must be a number'; }
				if (typeof end !== 'number') { throw '"end" argument must be a number'; }
			}

			var length = this.length;

			end = (typeof end !== 'undefined') ? end : length;

			// Handle negative value for "begin"
			var start = begin || 0;
			start = (start >= 0) ? start : Math.max(0, length + start);

			// Handle negative value for "end"
			var upTo = ((typeof end === 'number') ? Math.min(end, length) : length) - 1;
			end < 0 && (upTo = length + end);

			// Actual expected size of the slice
			var size = upTo - start;

			if (size !== length) {
				this.splice(0, start);
				this.splice(upTo, length - upTo);
			}

			return this;
		};

		listFunctions.mapMut = function mapMut(callback, thisArg) {
			if (RUNTIME_CHECKS && typeof callback !== 'function') { throw '"callback" argument must be a function'; }

			for (var i = 0, length = this.length; i < length; ++i) {
				this[i] = callback.call(thisArg, this[i], i, this);
			}
			return this;
		};

		listFunctions.find = function find(callback, thisArg) {
			if (RUNTIME_CHECKS && typeof callback !== 'function') { throw '"callback" argument must be a function'; }

			for (var i = 0, length = this.length; i < length; ++i) {
				if (callback.call(thisArg, this[i], i, this)) { return this[i]; }
			}
		};

		listFunctions.findIndex = function findIndex(callback, thisArg) {
			if (RUNTIME_CHECKS && typeof callback !== 'function') { throw '"callback" argument must be a function'; }

			for (var i = 0, length = this.length; i < length; ++i) {
				if (callback.call(thisArg, this[i], i, this)) { return i; }
			}
			return -1;
		};

		listFunctions.includes = function includes(item, fromIndex) {
			if (RUNTIME_CHECKS && arguments.length > 1 && typeof fromIndex !== 'number') {
				throw '"fromIndex" number must be a number';
			}

			fromIndex = fromIndex || 0;
			var index = this.__private.array.indexOf(item);
			return index !== -1 && index >= fromIndex;
		};

		listFunctions.toArray = function toArray() {
			return this.__private.array.slice();
		};

		listFunctions.toJSON = function toJSON() {
			return this.toArray();
		};

		listFunctions.propertiesToJSON = function propertiesToJSON() {
			return Record.prototype.toJSON.call(this);
		};

		listFunctions.addEventListener = function addEventListener(eventName) {
			if (RUNTIME_CHECKS && typeof eventName !== 'string') {
				throw '"eventName" argument must be a string';
			}

			if (!ITEM_EVENT_TOKEN_MATCHER.test(eventName) || this.__private.reEmittingEvents[eventName]) { return; }
			this.__private.reEmittingEvents[eventName] = true;

			var strippedEventName = eventName.replace(ITEM_EVENT_TOKEN_MATCHER, '');
			for (var i = 0, n = this.length; i < n; ++i) {
				var item = this[i];
				isEmitter(item) && reemitItemEvent(this, item, strippedEventName, eventName);
			}
		};

		listFunctions.removeEventListener = function removeEventListener(eventName) {
			if (RUNTIME_CHECKS && typeof eventName !== 'string') {
				throw '"eventName" argument must be a string';
			}

			if (!ITEM_EVENT_TOKEN_MATCHER.test(eventName)) { return; }

			// Check if we still need to re-emit this event
			var listeners = this.__private.listeners[eventName];
			if (listeners && listeners.length) { return; }

			delete this.__private.reEmittingEvents[eventName];
			var strippedEventName = eventName.replace(ITEM_EVENT_TOKEN_MATCHER, '');
			this.stopListening(undefined, strippedEventName);
		};

		extend(listFunctions, eventEmitter, { 'function': 'merge' });

		function withProperties(schema) {
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
					getter: function () { return this.__private.array.length; },
					setter: false,
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

			var RecordSubclass = Record.withProperties(schema, true);

			function List(items) {
				if (RUNTIME_CHECKS && arguments.length > 0 && (!items || items.length === undefined)) {
					throw '"items" argument must have a length property';
				}

				this.__private || Object.defineProperty(this, '__private', { writable: true, value: {}, });
				this.__private.array = [];
				this.__private.reEmittingEvents = {};

				this.listenTo(this, CHANGE_LENGTH_EVENT, function (length, prevLength) {
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

				// We don't want to send any arguments to the record constructor,
				// none of the properties we added has any setters!
				RecordSubclass.call(this);

				items = items || [];

				items.length && this.pushAll(items);
			}

			List.prototype = Object.create(RecordSubclass.prototype);
			List.prototype.constructor = List;

			extend(List.prototype, listFunctions);

			return List;
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
		var List = withProperties({});
		List.withProperties = withProperties;

		return List;

	}

	// Expose, based on environment
	if (typeof define === 'function' && define.amd) { // AMD
		define([ './extend', './event-emitter', './record' ], moduleFactory);
	} else if (typeof exports === 'object') { // Node, CommonJS-like
		module.exports = moduleFactory(require('./extend'), require('./event-emitter'), require('./record'));
	} else { // Browser globals
		var bff = window.bff = window.bff || {};
		bff.List = moduleFactory(bff.extend, bff.eventEmitter, bff.Record);
	}

}());
