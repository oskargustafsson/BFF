define(function (require) {
  'use strict';

  var registerSuite = require('intern!object');
  var chai = require('intern/chai!');
  var sinon = require('node_modules/sinon/pkg/sinon');
  var sinonChai = require('node_modules/sinon-chai/lib/sinon-chai');
  var expect = require('intern/chai!expect');
  var should = require('intern/chai!should');

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
      },

      'can not add the same listener twice': function () {
        var emitter = mixin({}, eventEmitter);
        var callback = function () {};
        emitter.addEventListener('kwanzaa', callback);
        expect(function () {
          emitter.addEventListener('kwanzaa', callback);
        }).to.throw();
      },

      'calls all callbacks registered to an event': function () {
        var emitter = mixin({}, eventEmitter);
        var callback = sinon.spy();
        emitter.addEventListener('kwanzaa', callback);
        emitter.emit('kwanzaa', [ 'firstArg', 'secondArg' ]);
        expect(callback).have.been.calledOnce;
        expect(callback).to.have.been.calledWith('firstArg', 'secondArg');
      },

    };

  });

});
