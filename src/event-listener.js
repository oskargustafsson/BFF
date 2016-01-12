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

  function setupListeners(self, eventEmitter, eventName, callback, context, useCapture) {
    if (RUNTIME_CHECKS && !eventEmitter.removeEventListener) {
      throw 'First argument is not an event emitter';
    }
    if (RUNTIME_CHECKS && typeof eventName !== 'string') {
      throw 'Second argument is not a string';
    }
    if (RUNTIME_CHECKS && typeof callback !== 'function') {
      throw 'Third argument must be a function'; // Catch a common cause of errors
    }

    self.__private || Object.defineProperty(self, '__private', { writable: true, value: {}, });
    var listeningTo = self.__private.listeningTo || (self.__private.listeningTo = {});
    var listeningToEvent = listeningTo[eventName] || (listeningTo[eventName] = []);

    callback = callback.bind(context || self);

    listeningToEvent.push({ callback: callback, emitter: eventEmitter });

    eventEmitter.addEventListener(eventName, callback, !!useCapture);
  }

  /**
   * A mixin, providing event listening capabilities to a class. This is an inversion-of-control with regards to regular
   * event listening; the listener maintains a list of the events it is listening to. This allows the listener to remove
   * some or all its event listeners, for instance when it is disabled or destroyed and easily avoid leaking listeners.
   * Caveat: don't mix eventEmitter.removeEventListener and eventListener.stopListening throughout a project, as that
   * could result in memory leaks.
   * @exports bff/event-listener
   * @mixin
   */
  var EventListener = {

    /**
     * Start listening to an event on a specified event emitting object.
     * @arg {(Object|Array|NodeList)} eventEmitters - One or more event emitters that will be listened to.
     * @arg {string} eventName - Identifier string for the event that will be listented to.
     * @arg {function} callback - The function that will be called when the event is emitted.
     * @arg {any} [context] - The context with which the callback will be called (e.g. what "this" will be). Will
     *     default to the caller of .listenTo, if not provided.
     * @returns {undefined}
     */
    listenTo: function listenTo(eventEmitters, eventName, callback, context, useCapture) {
      if (RUNTIME_CHECKS && !eventEmitters) { throw 'First argument must not be falsy'; }
      // Convenience functionality that allows you to listen to all items in an Array or NodeList
      // BFF Lists have this kind of functionality built it, so don't handle that case here
      eventEmitters = eventEmitters instanceof Array ||
          (typeof NodeList !== 'undefined' && eventEmitters instanceof NodeList) ? eventEmitters : [ eventEmitters ];

      for (var i = 0; i < eventEmitters.length; ++i) {
        setupListeners(this, eventEmitters[i], eventName, callback, context, useCapture);
      }
    },

    /**
     * Stop listening to events. If no arguments are provided, the listener removes all its event listeners. Providing
     * any or both of the optional arguments will filter the list of event listeners removed.
     * @arg {Object} [eventEmitter] - If provided, only event listeners listening to the given event emitter will be
     *     removed.
     * @arg {string} [eventName] - If provided, only event listeners listening to the given event name will be removed.
     * @returns {undefined}
     */
    stopListening: function stopListening(eventEmitter, eventName) {
      if (RUNTIME_CHECKS && (eventEmitter || arguments.length === 1) && !(eventEmitter || {}).removeEventListener) {
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

  return EventListener;

});
