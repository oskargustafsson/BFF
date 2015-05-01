define(function () {
  'use strict';

  function filterList(listeningToList, eventName, eventEmitter) {
    if (!listeningToList) { return; }

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
      if (typeof callback !== 'function') {
        throw 'Third argument must be a function'; // Catch a common cause of errors
      }

      var listeningTo = this.__listeningTo || (this.__listeningTo = {});
      var listeningToEvent = listeningTo[eventName] || (listeningTo[eventName] = []);

      callback = callback.bind(context || this);

      listeningToEvent.push({ callback: callback, emitter: eventEmitter });

      eventEmitter.addEventListener(eventName, callback);
    },

    stopListening: function (eventEmitter, eventName) {
      if (arguments.length === 1 && !eventEmitter.removeEventListener) {
        throw 'First argument is not an event emitter';
      }

      if (!this.__listeningTo) { return; } // Not listening to anything? We are done.

      if (eventName) {
        filterList(this.__listeningTo[eventName], eventName, eventEmitter);
      } else {
        for (eventName in this.__listeningTo) {
          filterList(this.__listeningTo[eventName], eventName, eventEmitter);
        }
      }
    },

  };

});
