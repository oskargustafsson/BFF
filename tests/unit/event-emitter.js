define(function (require) {
  'use strict';

  var registerSuite = require('intern!object');
  var chai = require('intern/chai!');
  var sinon = require('node_modules/sinon/pkg/sinon');
  var sinonChai = require('node_modules/sinon-chai/lib/sinon-chai');
  var expect = require('intern/chai!expect');

  var eventEmitter = require('src/event-emitter');
  var mixin = require('src/mixin');

  chai.use(sinonChai);

  registerSuite(function () {

    return {

      name: 'Event emitter',

      'can add listeners': function () {
        var emitter = mixin({}, eventEmitter);
        emitter.addEventListener('kwanzaa', function () {});
        emitter.addEventListener('kwanzaa', function () {});
        expect(emitter.__listeners.kwanzaa.length).to.equal(2);
      },

      'can not add the same listener twice': function () {
        var emitter = mixin({}, eventEmitter);
        var callback = function () {};
        emitter.addEventListener('kwanzaa', callback);
        expect(function () {
          emitter.addEventListener('kwanzaa', callback);
        }).to.throw();
      },

      'can remove all event listeners': function () {
        var emitter = mixin({}, eventEmitter);
        var callback = sinon.spy();
        var callback2 = sinon.spy();

        emitter.addEventListener('kwanzaa', callback);
        emitter.addEventListener('kwanzaa', callback2);
        expect(emitter.__listeners.kwanzaa.length).to.equal(2);

        emitter.emit('kwanzaa');
        expect(callback).have.been.calledOnce;
        expect(callback2).have.been.calledOnce;

        emitter.removeEventListener('kwanzaa');
        expect(emitter.__listeners.kwanzaa).to.equal(undefined);

        emitter.emit('kwanzaa');
        expect(callback).have.been.calledOnce;
        expect(callback2).have.been.calledOnce;
      },

      'can remove a specific event listener': function () {
        var emitter = mixin({}, eventEmitter);
        var callback = sinon.spy();
        var callback2 = sinon.spy();

        emitter.addEventListener('kwanzaa', callback);
        emitter.addEventListener('kwanzaa', callback2);

        emitter.emit('kwanzaa');
        expect(callback).have.been.calledOnce;
        expect(callback2).have.been.calledOnce;

        emitter.removeEventListener('kwanzaa', callback);
        expect(emitter.__listeners.kwanzaa.length).to.equal(1);

        emitter.emit('kwanzaa');
        expect(callback).have.been.calledOnce;
        expect(callback2).have.been.calledTwice;
      },

      'calls all callbacks registered to an event': function () {
        var emitter = mixin({}, eventEmitter);

        var callback = sinon.spy();
        var callback2 = sinon.spy();

        emitter.addEventListener('kwanzaa', callback);
        emitter.addEventListener('kwanzaa', callback2);

        emitter.emit('kwanzaa', [ 'firstArg', 'secondArg' ]);

        expect(callback).have.been.calledOnce;
        expect(callback).to.have.been.calledWith('firstArg', 'secondArg');

        expect(callback2).have.been.calledOnce;
        expect(callback2).to.have.been.calledWith('firstArg', 'secondArg');
      },

      'calls callbacks in the order they were registered': function () {
        var emitter = mixin({}, eventEmitter);

        var callback = sinon.spy();
        var callback2 = sinon.spy();

        emitter.addEventListener('kwanzaa', callback);
        emitter.addEventListener('kwanzaa', callback2);

        emitter.emit('kwanzaa');

        expect(callback).to.have.been.calledBefore(callback2);

        emitter.removeEventListener('kwanzaa', callback);
        emitter.addEventListener('kwanzaa', callback);

        emitter.emit('kwanzaa');

        expect(callback2).to.have.been.calledBefore(callback);
      },

    };

  });

});
