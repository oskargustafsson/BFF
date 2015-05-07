define(function (require) {
  'use strict';

  var registerSuite = require('intern!object');
  var chai = require('intern/chai!');
  var sinon = require('node_modules/sinon/pkg/sinon');
  var sinonChai = require('node_modules/sinon-chai/lib/sinon-chai');
  var expect = require('intern/chai!expect');

  var List = require('src/list');

  chai.use(sinonChai);

  // TESTS
  // Can listen to item events (if they expose addEventListener & removeEventListener)
  // Can have properties, just like Records, including dependencies
  // List properties should trigger events when changed

  registerSuite(function () {

    return {

      name: 'List',

      'adds elements passed to its constructor': function () {
        var list1 = new List('3');
        expect(list1.length).to.equal(1);
        expect(list1[0]).to.equal('3');

        var list2 = new List('3', 3);
        expect(list2.length).to.equal(2);
        expect(list2[0]).to.equal('3');
        expect(list2[1]).to.equal(3);
      },

      '"push" method': {

        'is chainable': function () {
          var list = new List();
          expect(list.push(4)).to.equal(list);
        },

        'emits one event per added item': function () {
          var list = new List('a', 'b');
          var spy = sinon.spy();

          list.addEventListener('itemAdded', spy);
          list.push('c');

          expect(list[2]).to.equal('c');
          expect(spy).to.have.been.calledOnce;
          expect(spy).to.have.been.calledWith('c', 2, list);

          list.push('d', 'e');

          expect(spy).to.have.been.calledThrice;
          expect(list[3]).to.equal('d');
          expect(spy).to.have.been.calledWith('d', 3, list);
          expect(list[4]).to.equal('e');
          expect(spy).to.have.been.calledWith('e', 4, list);
        },

      },


      'emits an event when an item is set': function () {
        var list = new List('a', 'b');
        var spy = sinon.spy();

        list.addEventListener('itemChanged', spy);
        list[0] = 'c';

        expect(list[0]).to.equal('c');
        expect(spy).to.have.been.calledOnce;
        expect(spy).to.have.been.calledWith('c', 'a', 0, list);

        list[1] = 'd';

        expect(list[1]).to.equal('d');
        expect(spy).to.have.been.calledTwice;
        expect(spy).to.have.been.calledWith('d', 'b', 1, list);
      },

      '"length" property': {

        'triggers a change:length event whenever it is changed': function () {
          var list = new List();
          var spy = sinon.spy();

          list.addEventListener('change:length', spy);
          list.push('a');

          expect(spy).to.have.been.calledOnce;
          expect(spy).to.have.been.calledWith(1, 0, list);

          list.push('b');

          expect(spy).to.have.been.calledTwice;
          expect(spy).to.have.been.calledWith(2, 1, list);
        },

      },

      '"first" property': {

        'can be read': function () {
          var list = new List(4, 5, 6);
          expect(list.first).to.equal(4);
        },

        'can be set': function () {
          var list = new List(4, 5, 6);
          list.first = 7;
          expect(list[0]).to.equal(7);
          expect(list.first).to.equal(7);
        },

      },

      '"last" property': {

        'can be read': function () {
          var list = new List(4, 5, 6);
          expect(list.last).to.equal(6);
        },

        'can be set': function () {
          var list = new List(4, 5, 6);
          list.last = 7;
          expect(list[2]).to.equal(7);
          expect(list.last).to.equal(7);
        },

      },

    };

  });

});
