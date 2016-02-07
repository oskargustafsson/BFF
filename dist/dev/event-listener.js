!function() {
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
      if (true && !eventEmitter.removeEventListener) {
        throw 'First argument is not an event emitter';
      }
      if (true && 'string' != typeof eventName) {
        throw 'Second argument is not a string';
      }
      if (true && 'function' != typeof callback) {
        throw 'Third argument must be a function';
      }
      self.__private || Object.defineProperty(self, '__private', {
        writable: true,
        value: {}
      });
      var listeningTo = self.__private.listeningTo || (self.__private.listeningTo = {});
      var listeningToEvent = listeningTo[eventName] || (listeningTo[eventName] = []);
      callback = callback.bind(context || self);
      listeningToEvent.push({
        callback: callback,
        emitter: eventEmitter
      });
      eventEmitter.addEventListener(eventName, callback, !!useCapture);
    }
    var EventListener = {
      listenTo: function(eventEmitters, eventNames, callback, context, useCapture) {
        if (true && !eventEmitters) {
          throw 'First argument must not be falsy';
        }
        eventEmitters = eventEmitters instanceof Array || 'undefined' != typeof NodeList && eventEmitters instanceof NodeList ? eventEmitters : [ eventEmitters ];
        eventNames = eventNames instanceof Array ? eventNames : [ eventNames ];
        for (var i = 0; i < eventEmitters.length; ++i) {
          for (var j = 0; j < eventNames.length; ++j) {
            setupListeners(this, eventEmitters[i], eventNames[j], callback, context, useCapture);
          }
        }
      },
      stopListening: function(eventEmitter, eventName) {
        if (true && (eventEmitter || 1 === arguments.length) && !(eventEmitter || {}).removeEventListener) {
          throw 'First argument is not an event emitter';
        }
        if (!this.__private || !this.__private.listeningTo) {
          return;
        }
        var eventNames = eventName ? {} : this.__private.listeningTo;
        eventName && (eventNames[eventName] = true);
        for (eventName in eventNames) {
          var listeningToList = this.__private.listeningTo[eventName];
          if (!listeningToList) {
            continue;
          }
          filterList(listeningToList, eventName, eventEmitter);
          listeningToList.length || delete this.__private.listeningTo[eventName];
        }
      }
    };
    return EventListener;
  }
  if ('function' == typeof define && define.amd) {
    define(moduleFactory);
  } else {
    if ('object' == typeof exports) {
      module.exports = moduleFactory();
    } else {
      var bff = window.bff = window.bff || {};
      bff.eventListener = moduleFactory();
    }
  }
}();