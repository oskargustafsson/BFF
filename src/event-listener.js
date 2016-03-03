/* global RUNTIME_CHECKS, define */
(function () {
	'use strict';

	function moduleFactory() {

		function filterList(listeningToList, eventName, eventEmitter) {
			var length = listeningToList.length;
			for (var i = length - 1; i >= 0; --i) {
				var listeningTo = listeningToList[i];
				if (!eventEmitter || listeningTo.emitter === eventEmitter) {
					listeningTo.emitter.removeEventListener(eventName, listeningTo.callback);
					listeningToList.splice(i, 1);
				}
			}
		}

		function setupListeners(self, eventEmitter, eventName, callback, context, useCapture) {
			if (RUNTIME_CHECKS) {
				if (!eventEmitter.addEventListener) {
					throw '"eventEmitter" argument must be an event emitter';
				}
				if (typeof eventName !== 'string') {
					throw '"eventName" argument must be a string';
				}
			}

			self.__private || Object.defineProperty(self, '__private', { writable: true, value: {}, });
			var listeningTo = self.__private.listeningTo || (self.__private.listeningTo = {});
			var listeningToEvent = listeningTo[eventName] || (listeningTo[eventName] = []);

			callback = callback.bind(context || self);

			listeningToEvent.push({ callback: callback, emitter: eventEmitter });

			eventEmitter.addEventListener(eventName, callback, useCapture);
		}

		/**
		 * A mixin, providing event listening capabilities to an object. This is an inversion-of-control with regards to
		 * regular event listening; the listener maintains a list of the events it is listening to. This allows the listener
		 * to remove some or all its event listeners, for instance when it is disabled or destroyed. This is an easy way to
		 * avoid leaking listeners. Caveat: don't mix eventEmitter.removeEventListener and eventListener.stopListening throughout a
		 * project, as that could result in memory leaks.
		 * @exports bff/event-listener
		 * @mixin
		 */
		var eventListener = {

			/**
			 * Start listening to an event on a specified event emitting object. Both eventEmitters and eventNames
			 * arguments can be arrays. The total amount of listeners added will be the Cartesian product of the two lists.
			 * @instance
			 * @arg {Object|Array|NodeList} eventEmitters - One or more event emitters that will be listened to.
			 * @arg {string|Array} eventNames - One or more string identifiers for events that will be listented to.
			 * @arg {function} callback - The function that will be called when the event is emitted.
			 * @arg {any} [context] - The context with which the callback will be called (i.e. what "this" will be).
			 *     Will default to the caller of .listenTo, if not provided.
			 */
			listenTo: function (eventEmitters, eventNames, callback, context, useCapture) {
				if (RUNTIME_CHECKS) {
					if (!eventEmitters || !(eventEmitters.addEventListener || eventEmitters instanceof Array)) {
						throw '"eventEmitters" argument must be an event emitter or an array of event emitters';
					}
					if (typeof eventNames !== 'string' && !(eventNames instanceof Array)) {
						throw '"eventNames" argument must be a string or an array of strings';
					}
					if (typeof callback !== 'function') {
						throw '"callback" argument must be a function';
					}
					if (arguments.length > 4 && typeof useCapture !== 'boolean') {
						throw '"useCapture" argument must be a boolean value';
					}
				}

				// Convenience functionality that allows you to listen to all items in an Array or NodeList
				// BFF Lists have this kind of functionality built it, so don't handle that case here
				eventEmitters = eventEmitters instanceof Array ||
						(typeof NodeList !== 'undefined' && eventEmitters instanceof NodeList) ? eventEmitters : [ eventEmitters ];

				eventNames = eventNames instanceof Array ? eventNames : [ eventNames ];

				for (var i = 0; i < eventEmitters.length; ++i) {
					for (var j = 0; j < eventNames.length; ++j) {
						setupListeners(this, eventEmitters[i], eventNames[j], callback, context, !!useCapture);
					}
				}
			},

			/**
			 * Stop listening to events. If no arguments are provided, the listener removes all its event listeners. Providing
			 * any or both of the optional arguments will filter the list of event listeners removed.
			 * @instance
			 * @arg {Object} [eventEmitter] - If provided, only callbacks attached to the given event emitter will be removed.
			 * @arg {string} [eventName] - If provided, only callbacks attached to the given event name will be removed.
			 */
			stopListening: function (eventEmitter, eventName) {
				if (RUNTIME_CHECKS) {
					if (!!eventEmitter && !eventEmitter.addEventListener) {
						throw '"eventEmitter" argument must be an event emitter';
					}
					if (arguments.length > 1 && typeof eventName !== 'string') {
						throw '"eventName" argument must be a string';
					}
				}

				if (!this.__private || !this.__private.listeningTo) { return; } // Not listening to anything? We are done.

				var eventNames = eventName ? {} : this.__private.listeningTo;
				eventName && (eventNames[eventName] = true);

				for (eventName in eventNames) {
					var listeningToList = this.__private.listeningTo[eventName];
					if (!listeningToList) { continue; }
					filterList(listeningToList, eventName, eventEmitter);
					listeningToList.length || (delete this.__private.listeningTo[eventName]);
				}
			},

		};

		return eventListener;

	}

	// Expose, based on environment
	if (typeof define === 'function' && define.amd) { // AMD
		define(moduleFactory);
	} else if (typeof exports === 'object') { // Node, CommonJS-like
		module.exports = moduleFactory();
	} else { // Browser globals
		var bff = window.bff = window.bff || {};
		bff.eventListener = moduleFactory();
	}

}());
