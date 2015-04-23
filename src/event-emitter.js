define(function () {
  'use strict';

  function indexOf(array, callback) {
    var length = array.length;
    for (var i = 0; i < length; ++i) {
      if (array[i].callback === callback) { return i; }
    }
    return -1;
  }

  return {

    emit: function (eventName, eventArguments) {
      if (!this.__listeners) { return; }

      var listenersForEvent = this.__listeners[eventName];
      if (!listenersForEvent) { return; }

      var length = listenersForEvent.length;
      for (var i = 0; i < length; ++i) {
        var listener = listenersForEvent[i];
        listener.callback.apply(listener.context || this, eventArguments);
      }
    },

    addEventListener: function (eventName, callback, context) {
      if (typeof callback !== 'function') {
        throw 'Second argument must be a function'; // Catch a common cause of errors
      }

      var listeners = this.__listeners || (this.__listeners = {});
      var listenersForEvent = listeners[eventName] || (listeners[eventName] = []);

      if (indexOf(listenersForEvent, callback) !== -1) {
        throw 'This listener has already been added (event: ' + eventName + ')';
      }

      listenersForEvent.push({ callback: callback, context: context });
    },

    removeEventListener: function (eventName, callback) {
      if (arguments.length === 2 && typeof callback !== 'function') {
        throw 'Second argument must be a function'; // Catch a common cause of errors
      }

      if (!this.__listeners) { return; } // No listeners at all? We are done.

      var listenersForEvent = this.__listeners[eventName];
      if (!listenersForEvent) { return; } // No listeners for this event? We are done.

      if (callback) {
        var pos = indexOf(listenersForEvent, callback);
        if (pos === -1) { return; }
        listenersForEvent.splice(pos, 1);
        if (listenersForEvent.length === 0) {
          this.__listeners[eventName] = undefined;
        }
      } else {
        this.__listeners[eventName] = undefined;
      }
    },

  };

});
