define(function () {
  'use strict';

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

  function listenTo(self, eventEmitter, eventName, callback, context) {
    if (!eventEmitter.removeEventListener) {
      throw 'First argument is not an event emitter';
    }
    if (typeof eventName !== 'string') {
      throw 'Second argument is not a string';
    }
    if (typeof callback !== 'function') {
      throw 'Third argument must be a function'; // Catch a common cause of errors
    }

    self.__private || Object.defineProperty(self, '__private', { writable: true, value: {}, });
    var listeningTo = self.__private.listeningTo || (self.__private.listeningTo = {});
    var listeningToEvent = listeningTo[eventName] || (listeningTo[eventName] = []);

    callback = callback.bind(context || self);

    listeningToEvent.push({ callback: callback, emitter: eventEmitter });

    eventEmitter.addEventListener(eventName, callback);
  }

  return {

    listenTo: function (eventEmitters, eventName, callback, context) {
      // Convenience functionality that allows you to listen to all items in an Array or NodeList
      // BFF Lists have this kind of functionality built it, so don't handle that case here
      eventEmitters = eventEmitters instanceof Array || eventEmitters instanceof NodeList ?
          eventEmitters : [ eventEmitters ];

      for (var i = 0; i < eventEmitters.length; ++i) {
        listenTo(this, eventEmitters[i], eventName, callback, context);
      }
    },

    stopListening: function (eventEmitter, eventName) {
      if ((eventEmitter || arguments.length === 1) && !(eventEmitter || {}).removeEventListener) {
        throw 'First argument is not an event emitter';
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

});
