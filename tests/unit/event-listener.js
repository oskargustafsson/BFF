define(function (require) {
  'use strict';

  var registerSuite = require('intern!object');
  var chai = require('intern/chai!');
  var sinon = require('node_modules/sinon/pkg/sinon');
  var sinonChai = require('node_modules/sinon-chai/lib/sinon-chai');
  var expect = require('intern/chai!expect');

  var eventEmitter = require('src/event-emitter');
  var eventListener = require('src/event-listener');
  var extend = require('src/extend');

  chai.use(sinonChai);

  registerSuite(function () {

    return {

      name: 'Event Listener',

      'throws an error when trying to listen to something that is not an Event Emitter': function () {
        var listener = extend({}, eventListener);
        expect(function () {
          listener.listenTo({ notAnEventEmitter: true }, 'kwanzaa', function () {});
        }).to.throw();
      },

      'throws an error when listenTo is not getting an event name': function () {
        var emitter = extend({}, eventEmitter);
        var listener = extend({}, eventListener);
        var events = {
          easilyMisspelledEventName: 'kwanzaa'
        };
        expect(function () {
          listener.listenTo(emitter, events.eeeasilyMisspelledEventName, function () {});
        }).to.throw();
      },

      'throws an error when not getting a callback': function () {
        var emitter = extend({}, eventEmitter);
        var listener = extend({}, eventListener);
        var callbacks = {
          easilyMisspelledCallbackName: function () {},
        };
        expect(function () {
          listener.listenTo(emitter, 'kwanzaa', callbacks.eeeasilyMisspelledCallbackName);
        }).to.throw();
      },

      'can listen to events': function () {
        var emitter = extend({}, eventEmitter);
        var listener = extend({}, eventListener);
        var callback = sinon.spy();
        var callback2 = sinon.spy();

        listener.listenTo(emitter, 'kwanzaa', callback);
        listener.listenTo(emitter, 'kwanzaa', callback2);
        expect(listener.__private.listeningTo.kwanzaa.length).to.equal(2);

        emitter.emit('kwanzaa');
        expect(callback).to.have.been.calledOnce;
        expect(callback2).to.have.been.calledOnce;
      },

      'sets the listener as context for the callback': function () {
        var emitter = extend({}, eventEmitter);
        var listener = extend({}, eventListener);
        var callback = function () {
          expect(this).to.equal(listener);
        };

        listener.listenTo(emitter, 'kwanzaa', callback);
        emitter.emit('kwanzaa');
      },

      'sets the context for the callback, if a context is provided': function () {
        var emitter = extend({}, eventEmitter);
        var listener = extend({}, eventListener);
        var context = 3;
        var callback = function () {
          expect(this).to.equal(context);
        };

        listener.listenTo(emitter, 'kwanzaa', callback, context);
        emitter.emit('kwanzaa');
      },

      'throws an error when trying to stop listening to something that is not an Event Emitter': function () {
        var listener = extend({}, eventListener);
        var notAnEmitter = { notAnEventEmitter: true };
        expect(function () {
          listener.stopListening(notAnEmitter, 'kwanzaa');
        }).to.throw();
        expect(function () {
          listener.stopListening(notAnEmitter);
        }).to.throw();
      },

      'can stop listening to all emitters and events': function () {
        var emitter = extend({}, eventEmitter);
        var listener = extend({}, eventListener);
        var callback = sinon.spy();
        var callback2 = sinon.spy();

        listener.listenTo(emitter, 'kwanzaa', callback);
        listener.listenTo(emitter, 'kwanzaa', callback2);
        expect(listener.__private.listeningTo.kwanzaa.length).to.equal(2);

        listener.stopListening();

        emitter.emit('kwanzaa');

        expect(listener.__private.listeningTo.kwanzaa).to.equal(undefined);
        expect(callback).to.not.have.been.called;
        expect(callback2).to.not.have.been.called;
      },

      'can stop listening to a specific event': function () {
        var emitter1 = extend({}, eventEmitter);
        var emitter2 = extend({}, eventEmitter);
        var listener = extend({}, eventListener);
        var callback1 = sinon.spy();
        var callback2 = sinon.spy();
        var callback3 = sinon.spy();
        var callback4 = sinon.spy();

        listener.listenTo(emitter1, 'kwanzaa', callback1);
        listener.listenTo(emitter1, 'hanukkah', callback2);
        listener.listenTo(emitter2, 'kwanzaa', callback3);
        listener.listenTo(emitter2, 'hanukkah', callback4);
        expect(listener.__private.listeningTo.kwanzaa.length).to.equal(2);
        expect(listener.__private.listeningTo.hanukkah.length).to.equal(2);

        listener.stopListening(undefined, 'kwanzaa');

        emitter1.emit('kwanzaa');
        emitter1.emit('hanukkah');
        emitter2.emit('kwanzaa');
        emitter2.emit('hanukkah');

        expect(listener.__private.listeningTo.kwanzaa).to.equal(undefined);
        expect(listener.__private.listeningTo.hanukkah.length).to.equal(2);
        expect(callback1).to.not.have.been.called;
        expect(callback2).to.have.been.calledOnce;
        expect(callback3).to.not.have.been.called;
        expect(callback4).to.have.been.calledOnce;
      },

      'can stop listening to a specific emitter': function () {
        var emitter1 = extend({}, eventEmitter);
        var emitter2 = extend({}, eventEmitter);
        var listener = extend({}, eventListener);
        var callback1 = sinon.spy();
        var callback2 = sinon.spy();
        var callback3 = sinon.spy();
        var callback4 = sinon.spy();

        listener.listenTo(emitter1, 'kwanzaa', callback1);
        listener.listenTo(emitter1, 'hanukkah', callback2);
        listener.listenTo(emitter2, 'kwanzaa', callback3);
        listener.listenTo(emitter2, 'hanukkah', callback4);
        expect(listener.__private.listeningTo.kwanzaa.length).to.equal(2);
        expect(listener.__private.listeningTo.hanukkah.length).to.equal(2);

        listener.stopListening(emitter1);

        emitter1.emit('kwanzaa');
        emitter1.emit('hanukkah');
        emitter2.emit('kwanzaa');
        emitter2.emit('hanukkah');

        expect(listener.__private.listeningTo.kwanzaa.length).to.equal(1);
        expect(listener.__private.listeningTo.hanukkah.length).to.equal(1);
        expect(callback1).to.not.have.been.called;
        expect(callback2).to.not.have.been.called;
        expect(callback3).to.have.been.calledOnce;
        expect(callback4).to.have.been.calledOnce;
      },

      'can stop listening to a specific emitter and event': function () {
        var emitter1 = extend({}, eventEmitter);
        var emitter2 = extend({}, eventEmitter);
        var listener = extend({}, eventListener);
        var callback1 = sinon.spy();
        var callback2 = sinon.spy();
        var callback3 = sinon.spy();
        var callback4 = sinon.spy();

        listener.listenTo(emitter1, 'kwanzaa', callback1);
        listener.listenTo(emitter1, 'hanukkah', callback2);
        listener.listenTo(emitter2, 'kwanzaa', callback3);
        listener.listenTo(emitter2, 'hanukkah', callback4);
        expect(listener.__private.listeningTo.kwanzaa.length).to.equal(2);
        expect(listener.__private.listeningTo.hanukkah.length).to.equal(2);

        listener.stopListening(emitter1, 'kwanzaa');

        emitter1.emit('kwanzaa');
        emitter1.emit('hanukkah');
        emitter2.emit('kwanzaa');
        emitter2.emit('hanukkah');

        expect(listener.__private.listeningTo.kwanzaa.length).to.equal(1);
        expect(listener.__private.listeningTo.hanukkah.length).to.equal(2);
        expect(callback1).to.not.have.been.called;
        expect(callback2).to.have.been.calledOnce;
        expect(callback3).to.have.been.calledOnce;
        expect(callback4).to.have.been.calledOnce;
      },

    };

  });

});
