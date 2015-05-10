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
          expect(lengthChangedCallback).to.have.been.calledTwice;
          expect(lengthChangedCallback).to.have.been.calledWith(5, 3, list);
        },

      },

      '"unshift" method': {

        'is chainable': function () {
          var list = new List();
          expect(list.unshift(4)).to.equal(list);
        },

        'emits one itemAdded event per added item and one change:length event': function () {
          var list = new List([ 'd', 'e' ]);
          var itemAddedCallback = sinon.spy();
          var lengthChangedCallback = sinon.spy();

          list.addEventListener('itemAdded', itemAddedCallback);
          list.addEventListener('change:length', lengthChangedCallback);
          list.unshift('c');

          expect(list[0]).to.equal('c');
          expect(itemAddedCallback).to.have.been.calledOnce;
          expect(itemAddedCallback).to.have.been.calledWith('c', 0, list);
          expect(lengthChangedCallback).to.have.been.calledOnce;
          expect(lengthChangedCallback).to.have.been.calledWith(3, 2, list);

          list.unshift('a', 'b');

          expect(itemAddedCallback).to.have.been.calledThrice;
          expect(list[0]).to.equal('a');
          expect(itemAddedCallback).to.have.been.calledWith('a', 0, list);
          expect(list[1]).to.equal('b');
          expect(itemAddedCallback).to.have.been.calledWith('b', 1, list);
          expect(lengthChangedCallback).to.have.been.calledTwice;
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

        'emits events': function () {
          var list = new List([ 'a', 'b' ]);
          var itemRemovedCallback = sinon.spy();
          var lengthChangedCallback = sinon.spy();

          list.addEventListener('itemRemoved', itemRemovedCallback);
          list.addEventListener('change:length', lengthChangedCallback);
          list.pop();

          expect(itemRemovedCallback).to.have.been.calledOnce;
          expect(itemRemovedCallback).to.have.been.calledWith('b', 1, list);
          expect(lengthChangedCallback).to.have.been.calledOnce;
          expect(lengthChangedCallback).to.have.been.calledWith(1, 2, list);

          list.pop();

          expect(itemRemovedCallback).to.have.been.calledTwice;
          expect(itemRemovedCallback).to.have.been.calledWith('a', 0, list);
          expect(lengthChangedCallback).to.have.been.calledTwice;
          expect(lengthChangedCallback).to.have.been.calledWith(0, 1, list);
        },

        'does not emit events if no element has been removed': function () {
          var list = new List();
          var itemRemovedCallback = sinon.spy();
          var lengthChangedCallback = sinon.spy();

          list.addEventListener('itemRemoved', itemRemovedCallback);
          list.addEventListener('change:length', lengthChangedCallback);
          list.pop();

          expect(itemRemovedCallback).not.to.have.been.called;
          expect(lengthChangedCallback).not.to.have.been.called;
        },

      },

    '"shift" method': {

        'mirrors Array.shift behavior': function () {
          var list = new List([ 'item1', 'item2' ]);

          expect(list.length).to.equal(2);
          expect(list.shift()).to.equal('item1');
          expect(list.length).to.equal(1);
          expect(list.shift()).to.equal('item2');
          expect(list.length).to.equal(0);
        },

        'emits events': function () {
          var list = new List([ 'a', 'b' ]);
          var itemRemovedCallback = sinon.spy();
          var lengthChangedCallback = sinon.spy();

          list.addEventListener('itemRemoved', itemRemovedCallback);
          list.addEventListener('change:length', lengthChangedCallback);
          list.shift();

          expect(itemRemovedCallback).to.have.been.calledOnce;
          expect(itemRemovedCallback).to.have.been.calledWith('a', 0, list);
          expect(lengthChangedCallback).to.have.been.calledOnce;
          expect(lengthChangedCallback).to.have.been.calledWith(1, 2, list);

          list.shift();

          expect(itemRemovedCallback).to.have.been.calledTwice;
          expect(itemRemovedCallback).to.have.been.calledWith('b', 0, list);
          expect(lengthChangedCallback).to.have.been.calledTwice;
          expect(lengthChangedCallback).to.have.been.calledWith(0, 1, list);
        },

        'does not emit events if no element has been removed': function () {
          var list = new List();
          var itemRemovedCallback = sinon.spy();
          var lengthChangedCallback = sinon.spy();

          list.addEventListener('itemRemoved', itemRemovedCallback);
          list.addEventListener('change:length', lengthChangedCallback);
          list.shift();

          expect(itemRemovedCallback).not.to.have.been.called;
          expect(lengthChangedCallback).not.to.have.been.called;
        },

      },

    '"splice" method': {

        'is chainable': function () {
          var list = new List([ 'a', 'b' ]);
          expect(list.splice(0, 1)).to.equal(list);
        },

        'mirrors Array.shift behavior': function () {
          var list = new List([ 'a', 'b', 'c', 'd' ]);

          list.splice(1, 2, 'd');
          expect(list.length).to.equal(3);
          expect(list[0]).to.equal('a');
          expect(list[1]).to.equal('d');
          expect(list[2]).to.equal('d');
        },

        'emits events': function () {
          var list = new List([ 'a', 'b', 'c', 'd' ]);
          var itemRemovedCallback = sinon.spy();
          var itemAddedCallback = sinon.spy();
          var lengthChangedCallback = sinon.spy();

          list.addEventListener('itemRemoved', itemRemovedCallback);
          list.addEventListener('itemAdded', itemAddedCallback);
          list.addEventListener('change:length', lengthChangedCallback);
          list.splice(1, 2, 'x', 'y', 'z');

          expect(list.length).to.equal(5);
          expect(list[0]).to.equal('a');
          expect(list[1]).to.equal('x');
          expect(list[2]).to.equal('y');
          expect(list[3]).to.equal('z');
          expect(list[4]).to.equal('d');

          expect(itemRemovedCallback).to.have.been.calledTwice;
          expect(itemRemovedCallback).to.have.been.calledWith('b', 1, list);
          expect(itemRemovedCallback).to.have.been.calledWith('c', 2, list);
          expect(itemAddedCallback).to.have.been.calledThrice;
          expect(itemAddedCallback).to.have.been.calledWith('x', 1, list);
          expect(itemAddedCallback).to.have.been.calledWith('y', 2, list);
          expect(itemAddedCallback).to.have.been.calledWith('z', 3, list);
          expect(lengthChangedCallback).to.have.been.calledOnce;
          expect(lengthChangedCallback).to.have.been.calledWith(5, 4, list);
        },

        'does not emit events if nothing changed': function () {
          var list = new List([ 'a', 'b', 'c', 'd' ]);
          var itemRemovedCallback = sinon.spy();
          var itemAddedCallback = sinon.spy();
          var lengthChangedCallback = sinon.spy();

          list.addEventListener('itemRemoved', itemRemovedCallback);
          list.addEventListener('itemAdded', itemAddedCallback);
          list.addEventListener('change:length', lengthChangedCallback);
          list.splice(0, 0);

          expect(itemRemovedCallback).not.to.have.been.called;
          expect(itemAddedCallback).not.to.have.been.called;
          expect(lengthChangedCallback).not.to.have.been.called;

          list.splice(0, 1);

          expect(itemRemovedCallback).to.have.been.calledOnce;
          expect(itemAddedCallback).not.to.have.been.called;
          expect(lengthChangedCallback).to.have.been.calledOnce;

          list.splice(0, 0, 'x');

          expect(itemRemovedCallback).to.have.been.calledOnce;
          expect(itemAddedCallback).to.have.been.calledOnce;
          expect(lengthChangedCallback).to.have.been.calledTwice;

          list.splice(0, 1, 'y');

          expect(itemRemovedCallback).to.have.been.calledTwice;
          expect(itemAddedCallback).to.have.been.calledTwice;
          expect(lengthChangedCallback).to.have.been.calledTwice;
        },

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
