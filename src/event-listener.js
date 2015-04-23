define(function () {
  'use strict';

  function filterList(listeningToList, eventEmitter, callback) {
    if (!listeningToList) { return; }
    var length = listeningToList.length;
    for (var i = length - 1; i >= 0; --i) {
      var listeningTo = listeningToList[i];
      if ((!eventEmitter || listeningTo.emitter === eventEmitter) && (!callback || listeningTo.callback === callback)) {
        listeningToList.splice(i, 1);
      }
    }
  }

  return {

    listenTo: function (eventEmitter, eventName, callback, context) {
      if (typeof callback !== 'function') {
        throw 'Third argument must be a function'; // Catch a common cause of errors
      }

      var listeningTo = this.__listeningTo || Object.defineProperty(this, '__listeningTo', {});
      var listeningToEvent = listeningTo[eventName] || (listeningTo[eventName] = []);

      listeningToEvent.push({ callback: callback, emitter: eventEmitter });

      eventEmitter.addEventListener(eventName, callback, context || this);
    },

    stopListening: function (eventEmitter, eventName, callback) {
      if (arguments.length === 1 && !eventEmitter.emit) {
        throw 'First argument is not an event emitter';
      }
      if (arguments.length === 3 && typeof callback !== 'function') {
        throw 'Third argument must be a function';
      }

      if (!this.__listeningTo) { return; } // Not listening to anything? We are done.

      if (eventName) {
        filterList(this.__listeningTo[eventName], eventEmitter, callback);
      } else {
        for (eventName in this.__listeningTo) {
          filterList(this.__listeningTo[eventName], eventEmitter, callback);
        }
      }
    },

  };

});
