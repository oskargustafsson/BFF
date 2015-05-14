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

  return {

    listenTo: function (eventEmitter, eventName, callback, context) {
      if (!eventEmitter.removeEventListener) {
        throw 'First argument is not an event emitter';
      }
      if (typeof eventName !== 'string') {
        throw 'Second argument is not a string';
      }
      if (typeof callback !== 'function') {
        throw 'Third argument must be a function'; // Catch a common cause of errors
      }

      this.__private || Object.defineProperty(this, '__private', { writable: true, value: {}, });
      var listeningTo = this.__private.listeningTo || (this.__private.listeningTo = {});
      var listeningToEvent = listeningTo[eventName] || (listeningTo[eventName] = []);

      callback = callback.bind(context || this);

      listeningToEvent.push({ callback: callback, emitter: eventEmitter });

      eventEmitter.addEventListener(eventName, callback);
    },

    stopListening: function (eventEmitter, eventName) {
      if ((eventEmitter || arguments.length === 1) && !(eventEmitter || {}).removeEventListener) {
        throw 'First argument is not an event emitter';
      }

      if (!this.__private || !this.__private.listeningTo) { return; } // Not listening to anything? We are done.

      var eventNames = eventName ? {} : this.__private.listeningTo;
      eventName && (eventNames[eventName] = undefined);

      for (eventName in eventNames) {
        var listeningToList = this.__private.listeningTo[eventName];
        if (!listeningToList) { continue; }
        filterList(listeningToList, eventName, eventEmitter);
        listeningToList.length || (this.__private.listeningTo[eventName] = undefined);
      }
    },

  };

});
