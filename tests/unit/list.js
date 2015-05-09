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
        var list1 = new List([ '3' ]);
        expect(list1.length).to.equal(1);
        expect(list1[0]).to.equal('3');

        var list2 = new List([ '3', 3 ]);
        expect(list2.length).to.equal(2);
        expect(list2[0]).to.equal('3');
        expect(list2[1]).to.equal(3);
      },

      '"push" method': {

        'is chainable': function () {
          var list = new List();
          expect(list.push(4)).to.equal(list);
        },

        'emits one itemAdded event per added item and one change:length event': function () {
          var list = new List([ 'a', 'b' ]);
          var itemAddedCallback = sinon.spy();
          var lengthChangedCallback = sinon.spy();

          list.addEventListener('itemAdded', itemAddedCallback);
          list.addEventListener('change:length', lengthChangedCallback);
          list.push('c');

          expect(list[2]).to.equal('c');
          expect(itemAddedCallback).to.have.been.calledOnce;
          expect(itemAddedCallback).to.have.been.calledWith('c', 2, list);
          expect(lengthChangedCallback).to.have.been.calledOnce;
          expect(lengthChangedCallback).to.have.been.calledWith(3, 2, list);

          list.push('d', 'e');

          expect(itemAddedCallback).to.have.been.calledThrice;
          expect(list[3]).to.equal('d');
          expect(itemAddedCallback).to.have.been.calledWith('d', 3, list);
          expect(list[4]).to.equal('e');
          expect(itemAddedCallback).to.have.been.calledWith('e', 4, list);
          expect(lengthChangedCallback).to.have.been.calledTwice
          expect(lengthChangedCallback).to.have.been.calledWith(5, 3, list);
        },

      },

      '"pop" method': {

        'mirrors Array.pop behavior': function () {
          var list = new List([ 'item1', 'item2' ]);

          expect(list.length).to.equal(2);
          expect(list.pop()).to.equal('item2');
          expect(list.length).to.equal(1);
          expect(list.pop()).to.equal('item1');
          expect(list.length).to.equal(0);
        },

        'emits an event when an item is removed': function () {
          var list = new List([ 'a', 'b' ]);
          var itemRemovedCallback = sinon.spy();

          list.addEventListener('itemRemoved', itemRemovedCallback);
          list.pop();

          expect(itemRemovedCallback).to.have.been.calledOnce;
          expect(itemRemovedCallback).to.have.been.calledWith('b', 1, list);

          list.pop();

          expect(itemRemovedCallback).to.have.been.calledTwice;
          expect(itemRemovedCallback).to.have.been.calledWith('a', 0, list);
        },

      },

      'emits events when an item is set': function () {
        var list = new List([ 'a', 'b' ]);
        var removedCallback = sinon.spy();
        var replacedCallback = sinon.spy();
        var addedCallback = sinon.spy();

        list.addEventListener('itemRemoved', removedCallback);
        list.addEventListener('itemReplaced', replacedCallback);
        list.addEventListener('itemAdded', addedCallback);
        list[0] = 'c';

        expect(list[0]).to.equal('c');
        expect(removedCallback).to.have.been.calledOnce;
        expect(removedCallback).to.have.been.calledWith('a', 0, list);
        expect(replacedCallback).to.have.been.calledOnce;
        expect(replacedCallback).to.have.been.calledWith('c', 'a', 0, list);
        expect(addedCallback).to.have.been.calledOnce;
        expect(addedCallback).to.have.been.calledWith('c', 0, list);

        list[1] = 'd';

        expect(list[1]).to.equal('d');
        expect(removedCallback).to.have.been.calledTwice;
        expect(removedCallback).to.have.been.calledWith('b', 1, list);
        expect(replacedCallback).to.have.been.calledTwice;
        expect(replacedCallback).to.have.been.calledWith('d', 'b', 1, list);
        expect(addedCallback).to.have.been.calledTwice;
        expect(addedCallback).to.have.been.calledWith('d', 1, list);
      },

      '"length" property': {

        'is read-only': function () {
          var list = new List([ 1, 2, 4 ]);
          expect(function () {
            list.length = 2;
          }).to.throw();
        },

      },

      '"first" property': {

        'can be read': function () {
          var list = new List([ 4, 5, 6 ]);
          expect(list.first).to.equal(4);
        },

        'can be set': function () {
          var list = new List([ 4, 5, 6 ]);
          list.first = 7;
          expect(list[0]).to.equal(7);
          expect(list.first).to.equal(7);
        },

      },

      '"last" property': {

        'can be read': function () {
          var list = new List([ 4, 5, 6 ]);
          expect(list.last).to.equal(6);
        },

        'can be set': function () {
          var list = new List([ 4, 5, 6 ]);
          list.last = 7;
          expect(list[2]).to.equal(7);
          expect(list.last).to.equal(7);
        },

      },

    };

  });

});
