!function() {
  'use strict';
  function moduleFactory() {
    var EventEmitter = {
      emit: function(eventName) {
        if (true && 'string' != typeof eventName) {
          throw '"eventName" argument must be a string';
        }
        if (!this.__private || !this.__private.listeners) {
          return;
        }
        var listenersForEvent = this.__private.listeners[eventName];
        if (!listenersForEvent) {
          return;
        }
        for (var i = 0, n = listenersForEvent.length; n > i; ++i) {
          var listener = listenersForEvent[i];
          listener.call.apply(listener, arguments);
        }
      },
      addEventListener: function(eventName, callback) {
        if (true && 'string' != typeof eventName) {
          throw '"eventName" argument must be a string';
        }
        if (true && 'function' != typeof callback) {
          throw '"callback" argument must be a function';
        }
        this.__private || Object.defineProperty(this, '__private', {
          writable: true,
          value: {}
        });
        var listeners = this.__private.listeners || (this.__private.listeners = {});
        var listenersForEvent = listeners[eventName] || (listeners[eventName] = []);
        if (true && -1 !== listenersForEvent.indexOf(callback)) {
          throw 'This listener has already been added (event: ' + eventName + ')';
        }
        listenersForEvent.push(callback);
      },
      removeEventListener: function(eventName, callback) {
        if (true && 'string' != typeof eventName) {
          throw '"eventName" argument must be a string';
        }
        if (true && 2 === arguments.length && 'function' != typeof callback) {
          throw '"callback" argument must be a function';
        }
        if (!this.__private || !this.__private.listeners) {
          return;
        }
        var listenersForEvent = this.__private.listeners[eventName];
        if (!listenersForEvent) {
          return;
        }
        if (callback) {
          var pos = listenersForEvent.indexOf(callback);
          if (-1 === pos) {
            return;
          }
          listenersForEvent.splice(pos, 1);
        } else {
          listenersForEvent.length = 0;
        }
        0 === listenersForEvent.length && delete this.__private.listeners[eventName];
      }
    };
    return EventEmitter;
  }
  if ('function' == typeof define && define.amd) {
    define(moduleFactory);
  } else {
    if ('object' == typeof exports) {
      module.exports = moduleFactory();
    } else {
      var bff = window.bff = window.bff || {};
      bff.eventEmitter = moduleFactory();
    }
  }
}();