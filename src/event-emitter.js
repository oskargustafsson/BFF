define(function () {
  'use strict';

  return {

    emit: function (eventName, eventArguments) {
      if (typeof eventName !== 'string') {
        throw '"eventName" argument must be a string';
      }

      if (!this.__private) { return; }
      if (!this.__private.listeners) { return; }

      var listenersForEvent = this.__private.listeners[eventName];
      if (!listenersForEvent) { return; }

      var length = listenersForEvent.length;
      for (var i = 0; i < length; ++i) {
        listenersForEvent[i].apply(null, eventArguments);
      }
    },

    addEventListener: function (eventName, callback) {
      if (typeof eventName !== 'string') {
        throw '"eventName" argument must be a string';
      }
      if (typeof callback !== 'function') {
        throw '"callback" argument must be a function'; // Catch a common cause of errors
      }

      this.__private || Object.defineProperty(this, '__private', { writable: true, value: {}, });
      var listeners = this.__private.listeners || (this.__private.listeners = {});
      var listenersForEvent = listeners[eventName] || (listeners[eventName] = []);

      if (listenersForEvent.indexOf(callback) !== -1) {
        throw 'This listener has already been added (event: ' + eventName + ')';
      }

      listenersForEvent.push(callback);
    },

    removeEventListener: function (eventName, callback) {
      if (typeof eventName !== 'string') {
        throw '"eventName" argument must be a string';
      }
      if (arguments.length === 2 && typeof callback !== 'function') {
        throw '"callback" argument must be a function'; // Catch a common cause of errors
      }

      if (!this.__private) { return; } // No listeners at all? We are done.
      if (!this.__private.listeners) { return; }

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

});
