/* global RUNTIME_CHECKS, define */
(function () {
	'use strict';

	function moduleFactory() {
		/**
		 * A mixin, providing event emitting capabilities to an object. Events are simply strings. When they are
		 * emitted, zero or more parameters can be passed as arguments to the listening functions.
		 * @exports bff/event-emitter
		 * @mixin
		 */
		var EventEmitter = {
			/**
			 * Emit an event. Callbacks will be called with the same arguments as this function was called with,
			 * except for the event name argument.
			 * @arg {string} eventName - Identifier string for the event.
			 * @arg {...any} [eventArguments] - Zero or more arguments that event listeners will be called with.
			 * @returns {undefined}
			 */
			emit: function emit(eventName) {
				if (RUNTIME_CHECKS && typeof eventName !== 'string') {
					throw '"eventName" argument must be a string';
				}

				if (!this.__private || !this.__private.listeners) { return; }

				var listenersForEvent = this.__private.listeners[eventName];
				if (!listenersForEvent) { return; }

				for (var i = 0, n = listenersForEvent.length; i < n; ++i) {
					var listener = listenersForEvent[i];
					// Call the listener without the first item in the "arguments" array
					listener.call.apply(listener, arguments);
				}
			},

			/**
			 * Emit an event. Callbacks will be called with arguments given as an an array in the second argument
			 * @arg {string} eventName - Identifier string for the event.
			 * @arg {array} [argsArray] - An array of arguments with which the callbacks will be called. Each item in
			 *     the array will be provided as an individual argument to the callbacks.
			 * @returns {undefined}
			 */
			emitArgsAsArray: function emitArgsArray(eventName, argsArray) {
				if (RUNTIME_CHECKS) {
					if (typeof eventName !== 'string') {
						throw '"eventName" argument must be a string';
					}
					if (arguments.length > 1 && (!argsArray || argsArray.length === undefined)) {
						throw '"argsArray" must have a length property';
					}
				}

				if (!this.__private || !this.__private.listeners) { return; }

				var listenersForEvent = this.__private.listeners[eventName];
				if (!listenersForEvent) { return; }

				for (var i = 0, n = listenersForEvent.length; i < n; ++i) {
					listenersForEvent[i].apply(undefined, argsArray);
				}
			},

			/**
			 * Add an event listener function that will be called whenever the given event is emitted. Trying to add the exact
			 * same function twice till throw an error, as that is rarely ever the intention and a common source of errors.
			 * @arg {string} eventName - Identifier string for the event that is to be listened to.
			 * @arg {function} callback - The function that will be called when the event is emitted.
			 * @returns {undefined}
			 */
			addEventListener: function addEventListener(eventName, callback) {
				if (RUNTIME_CHECKS) {
					if (typeof eventName !== 'string') {
						throw '"eventName" argument must be a string';
					}
					if (typeof callback !== 'function') {
						throw '"callback" argument must be a function';
					}
				}

				this.__private || Object.defineProperty(this, '__private', { writable: true, value: {}, });
				var listeners = this.__private.listeners || (this.__private.listeners = {});
				var listenersForEvent = listeners[eventName] || (listeners[eventName] = []);

				if (RUNTIME_CHECKS && listenersForEvent.indexOf(callback) !== -1) {
					throw 'This listener has already been added (event: ' + eventName + ')';
				}

				listenersForEvent.push(callback);
			},

			/**
			 * Removes an event listener function. If the function was never a listener, do nothing.
			 * @arg {string} eventName - Identifier string for the event in question.
			 * @arg {function} [callback] - If not given, all event listeners to the provided eventName will be removed. If
			 *     given, only the given callback will be removed from the given eventName.
			 * @returns {undefined}
			 */
			removeEventListener: function removeEventListener(eventName, callback) {
				if (RUNTIME_CHECKS) {
					if (typeof eventName !== 'string') {
						throw '"eventName" argument must be a string';
					}
					if (arguments.length === 2 && typeof callback !== 'function') {
						throw '"callback" argument must be a function'; // Catch a common cause of errors
					}
				}

				// No listeners at all? We are done.
				if (!this.__private || !this.__private.listeners) { return; }

				var listenersForEvent = this.__private.listeners[eventName];
				if (!listenersForEvent) { return; } // No listeners for this event? We are done.

				if (callback) {
					var pos = listenersForEvent.indexOf(callback);
					if (pos === -1) { return; }
					listenersForEvent.splice(pos, 1);
				} else {
					listenersForEvent.length = 0;
				}
				listenersForEvent.length === 0 && (delete this.__private.listeners[eventName]);
			},

		};

		return EventEmitter;

	}

	// Expose, based on environment
	if (typeof define === 'function' && define.amd) { // AMD
		define(moduleFactory);
	} else if (typeof exports === 'object') { // Node, CommonJS-like
		module.exports = moduleFactory();
	} else { // Browser globals
		var bff = window.bff = window.bff || {};
		bff.eventEmitter = moduleFactory();
	}

}());
