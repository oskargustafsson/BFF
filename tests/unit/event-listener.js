define(function (require) {
  'use strict';

  var registerSuite = require('intern!object');
  var chai = require('intern/chai!');
  var sinon = require('node_modules/sinon/pkg/sinon');
  var sinonChai = require('node_modules/sinon-chai/lib/sinon-chai');
  var expect = require('intern/chai!expect');

  var eventEmitter = require('src/event-emitter');
  var eventListener = require('src/event-listener');
  var mixin = require('src/mixin');

  chai.use(sinonChai);

  registerSuite(function () {

    return {

      name: 'Event Listener',

      'throws an error when trying to listen to something that is not an Event Emitter': function () {
        var listener = mixin({}, eventListener);
        expect(function () {
          listener.listenTo({ noAnEventEmitter: true }, 'kwanzaa', function () {});
        }).to.throw();
      },

      'can listen to events': function () {
        var emitter = mixin({}, eventEmitter);
        var listener = mixin({}, eventListener);
        var callback = sinon.spy();
        var callback2 = sinon.spy();

        listener.listenTo(emitter, 'kwanzaa', callback);
        listener.listenTo(emitter, 'kwanzaa', callback2);
        expect(listener.__listeningTo.kwanzaa.length).to.equal(2);

        emitter.emit('kwanzaa');
        expect(callback).have.been.calledOnce;
        expect(callback2).have.been.calledOnce;
      },

      'sets the listener as context for the callback': function () {
        var emitter = mixin({}, eventEmitter);
        var listener = mixin({}, eventListener);
        var callback = function () {
          expect(this).to.equal(listener);
        };

        listener.listenTo(emitter, 'kwanzaa', callback);
        emitter.emit('kwanzaa');
      },

      'sets the context for the callback, if a context is provided': function () {
        var emitter = mixin({}, eventEmitter);
        var listener = mixin({}, eventListener);
        var context = 3;
        var callback = function () {
          expect(this).to.equal(context);
        };

        listener.listenTo(emitter, 'kwanzaa', callback, context);
        emitter.emit('kwanzaa');
      },

    };

  });

});
