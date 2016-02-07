define(function (require) {
  'use strict';

  var registerSuite = require('intern!object');
  var chai = require('intern/chai!');
  var sinon = require('node_modules/sinon/pkg/sinon');
  var sinonChai = require('node_modules/sinon-chai/lib/sinon-chai');
  var expect = require('intern/chai!expect');

  var List = require('dist/dev/list');
  var Record = require('dist/dev/record');
  var extend = require('dist/dev/extend');
  var eventEmitter = require('dist/dev/event-emitter');

  chai.use(sinonChai);

  registerSuite(function () {

    return {

      name: 'List',

      'adds items passed to its constructor': function () {
        var list1 = new List([ '3' ]);
        expect(list1.length).to.equal(1);
        expect(list1[0]).to.equal('3');

        var list2 = new List([ '3', 3 ]);
        expect(list2.length).to.equal(2);
        expect(list2[0]).to.equal('3');
        expect(list2[1]).to.equal(3);
      },

      'accepts another List as a provider of items': function () {
        var list1 = new List(new List([ '3' ]));
        expect(list1.length).to.equal(1);
        expect(list1[0]).to.equal('3');

        var list2 = new List(new List([ '3', 3 ]));
        expect(list2.length).to.equal(2);
        expect(list2[0]).to.equal('3');
        expect(list2[1]).to.equal(3);
      },

      'schema': {

        'allows specifying properties with custom getters': function () {
          var MyList = List.withProperties({
            nDone: {
              getter: function () {
                return this.reduce(function (nDone, item) {
                  return nDone + (item.done ? 1 : 0);
                }, 0);
              }
            }
          });

          var list = new MyList([
            { id: 1, done: false },
            { id: 2, done: true },
            { id: 3, done: false },
          ]);

          expect(list.nDone).to.equal(1);

          list[2].done = true;

          expect(list.nDone).to.equal(2);
        },

        'throws an error if some attribute lacks a getter': function () {
          expect(function () {
            new List({
              nDone: {}
            });
          }).to.throw();
        },

        'throws an error if some attribute has a setter': function () {
          expect(function () {
            new List({
              nDone: {
                getter: function () {},
                setter: function () {},
              }
            });
          }).to.throw();
        },

        'allows you to specify dependencies': function () {
          var TodoItem = Record.withProperties({
            id: 'number',
            done: 'boolean',
          });

          var TodoItems = List.withProperties({
            nDone: {
              getter: function () {
                return this.reduce(function (nDone, item) {
                  return nDone + (item.done ? 1 : 0);
                }, 0);
              },
              dependencies: [ 'length', 'item:done' ],
            }
          });

          var list = new TodoItems([
            new TodoItem({ id: 1, done: false }),
            new TodoItem({ id: 2, done: true }),
            new TodoItem({ id: 3, done: false }),
            new TodoItem({ id: 4, done: true }),
          ]);
          var nDoneChangedCallback = sinon.spy();
          list.addEventListener('change:nDone', nDoneChangedCallback);

          list.pop();

          expect(nDoneChangedCallback).to.have.been.calledOnce;
          expect(nDoneChangedCallback).to.have.been.calledWith(1, 2, list);

          list.pop();

          expect(nDoneChangedCallback).to.have.been.calledOnce;

          list.push(new TodoItem({ id: 5, done: true }));

          expect(nDoneChangedCallback).to.have.been.calledTwice;

          list.push(new TodoItem({ id: 6, done: false }));

          expect(nDoneChangedCallback).to.have.been.calledTwice;
          expect(nDoneChangedCallback).to.have.been.calledWith(2, 1, list);

          list[0].done = true;

          expect(nDoneChangedCallback).to.have.been.calledThrice;
          expect(nDoneChangedCallback).to.have.been.calledWith(3, 2, list);
        },

      },

      'setting using [] syntax': {

        'emits "item:added", "item:replaced" and "item:removed" events': function () {
          var list = new List([ 'a', 'b' ]);
          var removedCallback = sinon.spy();
          var replacedCallback = sinon.spy();
          var addedCallback = sinon.spy();

          list.addEventListener('item:removed', removedCallback);
          list.addEventListener('item:replaced', replacedCallback);
          list.addEventListener('item:added', addedCallback);
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

        'triggers "added", "replaced" and "removed" events on items, if they are event emitters': function () {
          var emitterItem1 = extend({}, eventEmitter);
          var emitterItem2 = extend({}, eventEmitter);
          var list = new List([ emitterItem1, 'a' ]);

          var item1AddedCallback = sinon.spy();
          var item1RemovedCallback = sinon.spy();
          var item1ReplacedCallback = sinon.spy();
          var item2AddedCallback = sinon.spy();
          var item2RemovedCallback = sinon.spy();
          var item2ReplacedCallback = sinon.spy();

          var listItemRemovedCallback = sinon.spy();
          var listItemReplacedCallback = sinon.spy();
          var listItemAddedCallback = sinon.spy();

          emitterItem1.addEventListener('added', item1AddedCallback);
          emitterItem1.addEventListener('removed', item1RemovedCallback);
          emitterItem1.addEventListener('replaced', item1ReplacedCallback);
          emitterItem2.addEventListener('added', item2AddedCallback);
          emitterItem2.addEventListener('removed', item2RemovedCallback);
          emitterItem2.addEventListener('replaced', item2ReplacedCallback);
          list.addEventListener('item:removed', listItemRemovedCallback);
          list.addEventListener('item:replaced', listItemReplacedCallback);
          list.addEventListener('item:added', listItemAddedCallback);
          list[0] = emitterItem2;

          expect(item1RemovedCallback).to.have.been.calledOnce;
          expect(item1RemovedCallback).to.have.been.calledWith(emitterItem1, 0, list);
          expect(item1ReplacedCallback).to.have.been.calledOnce;
          expect(item1ReplacedCallback).to.have.been.calledWith(emitterItem2, emitterItem1, 0, list);
          expect(item2AddedCallback).to.have.been.calledOnce;
          expect(item2AddedCallback).to.have.been.calledWith(emitterItem2, 0, list);

          expect(listItemRemovedCallback).to.have.been.calledOnce;
          expect(listItemRemovedCallback).to.have.been.calledWith(emitterItem1, 0, list);
          expect(listItemReplacedCallback).to.have.been.calledOnce;
          expect(listItemReplacedCallback).to.have.been.calledWith(emitterItem2, emitterItem1, 0, list);
          expect(listItemAddedCallback).to.have.been.calledOnce;
          expect(listItemAddedCallback).to.have.been.calledWith(emitterItem2, 0, list);

          list[0] = emitterItem1;

          expect(item2RemovedCallback).to.have.been.calledOnce;
          expect(item2RemovedCallback).to.have.been.calledWith(emitterItem2, 0, list);
          expect(item2ReplacedCallback).to.have.been.calledOnce;
          expect(item2ReplacedCallback).to.have.been.calledWith(emitterItem1, emitterItem2, 0, list);
          expect(item1AddedCallback).to.have.been.calledOnce;
          expect(item1AddedCallback).to.have.been.calledWith(emitterItem1, 0, list);

          expect(listItemRemovedCallback).to.have.been.calledTwice;
          expect(listItemRemovedCallback).to.have.been.calledWith(emitterItem2, 0, list);
          expect(listItemReplacedCallback).to.have.been.calledTwice;
          expect(listItemReplacedCallback).to.have.been.calledWith(emitterItem1, emitterItem2, 0, list);
          expect(listItemAddedCallback).to.have.been.calledTwice;
          expect(listItemAddedCallback).to.have.been.calledWith(emitterItem1, 0, list);
        },

        'triggers the event listeners for the same event exactly once': function () {
          var list = new List();
          var eventListener1 = sinon.spy();
          var eventListener2 = sinon.spy();
          var item = extend({}, eventEmitter);

          list.addEventListener('item:added', eventListener1);
          list.addEventListener('item:added', eventListener2);
          list.push(item);

          expect(eventListener1).to.have.been.calledOnce;
          expect(eventListener2).to.have.been.calledOnce;
        },

      },

      'event proxying': {

        'reemits item events and prefixes them with "item:"': function () {
          var emitterItem1 = extend({}, eventEmitter);
          var emitterItem2 = extend({}, eventEmitter);
          var list = new List([ emitterItem1, emitterItem2 ]);
          var callback = sinon.spy();

          list.addEventListener('item:customEvent', callback);
          emitterItem1.emit('customEvent', 'arg1', 2, { a: 'b' });

          expect(callback).to.have.been.calledOnce;
          expect(callback).to.have.been.calledWith('arg1', 2, { a: 'b' });

          emitterItem2.emit('customEvent', 'arg2');

          expect(callback).to.have.been.calledTwice;
          expect(callback).to.have.been.calledWith('arg2');
        },

        'reemits item events for items added after List creation': function () {
          var emitterItem1 = extend({}, eventEmitter);
          var list = new List();
          var callback = sinon.spy();

          list.addEventListener('item:customEvent', callback);
          list.push(emitterItem1);

          emitterItem1.emit('customEvent', 'arg1', 2, { a: 'b' });

          expect(callback).to.have.been.calledOnce;
          expect(callback).to.have.been.calledWith('arg1', 2, { a: 'b' });
        },

        'stops reemitting events after an item has been removed and starts again if it is added again': function () {
          var emitterItem = extend({}, eventEmitter);
          var list = new List([ emitterItem ]);
          var callback = sinon.spy();

          list.addEventListener('item:customEvent', callback);
          emitterItem.emit('customEvent');

          expect(callback).to.have.been.calledOnce;

          list.pop();
          emitterItem.emit('customEvent');

          expect(callback).to.have.been.calledOnce;

          list.push(emitterItem);
          emitterItem.emit('customEvent');

          expect(callback).to.have.been.calledTwice;
        },

      },

      '"push" method': {

        'returns the new length of the list': function () {
          var list = new List([ 'a', 1 ]);
          expect(list.length).to.equal(2);
          expect(list.push('b', 2)).to.equal(4);
        },

        'appends the new items to the end of the list': function () {
          var list = new List([ 'a', 1 ]);
          expect(list[0]).to.equal('a');
          expect(list[1]).to.equal(1);
          list.push('b', 2);
          expect(list[0]).to.equal('a');
          expect(list[1]).to.equal(1);
          expect(list[2]).to.equal('b');
          expect(list[3]).to.equal(2);
        },

        'emits one itemAdded event per added item and one change:length event': function () {
          var list = new List([ 'a', 'b' ]);
          var itemAddedCallback = sinon.spy();
          var lengthChangedCallback = sinon.spy();

          list.addEventListener('item:added', itemAddedCallback);
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

      '"pushAll" method': {

        'returns the new length of the list': function () {
          var list = new List([ 'a', 1 ]);
          expect(list.length).to.equal(2);
          expect(list.pushAll([ 'b', 2 ])).to.equal(4);
        },

        'appends the new items to the end of the list': function () {
          var list = new List([ 'a', 1 ]);
          expect(list[0]).to.equal('a');
          expect(list[1]).to.equal(1);
          list.pushAll([ 'b', 2 ]);
          expect(list[0]).to.equal('a');
          expect(list[1]).to.equal(1);
          expect(list[2]).to.equal('b');
          expect(list[3]).to.equal(2);
        },

        'accepts a List as argument': function () {
          var list = new List([ 'a', 1 ]);
          expect(list.length).to.equal(2);
          expect(list.pushAll(new List([ 'b', 2 ]))).to.equal(4);
        },

        'emits one itemAdded event per added item and one change:length event': function () {
          var list = new List([ 'a', 'b' ]);
          var itemAddedCallback = sinon.spy();
          var lengthChangedCallback = sinon.spy();

          list.addEventListener('item:added', itemAddedCallback);
          list.addEventListener('change:length', lengthChangedCallback);
          list.pushAll([ 'c' ]);

          expect(list[2]).to.equal('c');
          expect(itemAddedCallback).to.have.been.calledOnce;
          expect(itemAddedCallback).to.have.been.calledWith('c', 2, list);
          expect(lengthChangedCallback).to.have.been.calledOnce;
          expect(lengthChangedCallback).to.have.been.calledWith(3, 2, list);

          list.pushAll([ 'd', 'e' ]);

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

        'returns the new length of the list': function () {
          var list = new List([ 'a', 1 ]);
          expect(list.length).to.equal(2);
          list.unshift('b');
          list.unshift(2);
          expect(list.length).to.equal(4);
        },

        'prepends items to the List': function () {
          var list = new List([ 'a', 1 ]);
          expect(list[0]).to.equal('a');
          expect(list[1]).to.equal(1);
          list.unshift('b', 2);
          expect(list[0]).to.equal('b');
          expect(list[1]).to.equal(2);
          expect(list[2]).to.equal('a');
          expect(list[3]).to.equal(1);
        },

        'emits one itemAdded event per added item and one change:length event': function () {
          var list = new List([ 'd', 'e' ]);
          var itemAddedCallback = sinon.spy();
          var lengthChangedCallback = sinon.spy();

          list.addEventListener('item:added', itemAddedCallback);
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

          list.addEventListener('item:removed', itemRemovedCallback);
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

        'does not emit events if no item has been removed': function () {
          var list = new List();
          var itemRemovedCallback = sinon.spy();
          var lengthChangedCallback = sinon.spy();

          list.addEventListener('item:removed', itemRemovedCallback);
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

          list.addEventListener('item:removed', itemRemovedCallback);
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

          list.addEventListener('item:removed', itemRemovedCallback);
          list.addEventListener('change:length', lengthChangedCallback);
          list.shift();

          expect(itemRemovedCallback).not.to.have.been.called;
          expect(lengthChangedCallback).not.to.have.been.called;
        },

      },

    '"splice" method': {

        'returns the removed items': function () {
          var list = new List([ 'a', 'b', 'c' ]);
          expect(list.splice(1, 2)).to.eql([ 'b', 'c' ]);
        },

        'mirrors Array.splice behavior': function () {
          var list = new List([ 'a', 'b', 'c', 'd' ]);

          list.splice(1, 2, 'e');
          expect(list.length).to.equal(3);
          expect(list[0]).to.equal('a');
          expect(list[1]).to.equal('e');
          expect(list[2]).to.equal('d');

          list.splice(-2, 999, 'f');
          expect(list.length).to.equal(2);
          expect(list[0]).to.equal('a');
          expect(list[1]).to.equal('f');
        },

        'emits events': function () {
          var list = new List([ 'a', 'b', 'c', 'd' ]);
          var itemRemovedCallback = sinon.spy();
          var itemAddedCallback = sinon.spy();
          var lengthChangedCallback = sinon.spy();

          list.addEventListener('item:removed', itemRemovedCallback);
          list.addEventListener('item:added', itemAddedCallback);
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

          list.addEventListener('item:removed', itemRemovedCallback);
          list.addEventListener('item:added', itemAddedCallback);
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

      '"every" method': {

        'returns true if all elements pass the predicate': function () {
          var list = new List([ true, true, true ]);
          var isAllTrue = list.every(function (item) {
            return !!item;
          });
          expect(isAllTrue).to.equal(true);
        },

        'returns false if some element does not pass the predicate': function () {
          var list = new List([ true, false, true ]);
          var isAllTrue = list.every(function (item) {
            return !!item;
          });
          expect(isAllTrue).to.equal(false);
        },

      },

      '"some" method': {

        'returns true if some element pass the predicate': function () {
          var list = new List([ true, false, false ]);
          var isAllTrue = list.some(function (item) {
            return !!item;
          });
          expect(isAllTrue).to.equal(true);
        },

        'returns false if all elements fails to pass the predicate': function () {
          var list = new List([ false, false, false ]);
          var isAllTrue = list.some(function (item) {
            return !!item;
          });
          expect(isAllTrue).to.equal(false);
        },

      },

      '"indexOf" method': {

        'mirrors Array.indexOf behavior': function () {
          var list = new List([ 'a', 'b', 'c' ]);
          expect(list.indexOf('b')).to.equal(1);
        },

      },

      '"lastIndexOf" method': {

        'mirrors Array.lastIndexOf behavior': function () {
          var list = new List([ 'a', 'b', 'c', 'b', 'c' ]);
          expect(list.lastIndexOf('b')).to.equal(3);
        },

      },

      '"join" method': {

        'mirrors Array.join behavior': function () {
          var list = new List([ 'a', 'b', 'c' ]);
          expect(list.join('-')).to.equal('a-b-c');
        },

      },

      '"reduce" method': {

        'mirrors Array.reduce behavior': function () {
          var list = new List([ 'a', 'b', 'c' ]);
          var aggregate = list.reduce(function (acc, item) {
            return acc + '-' + item;
          }, '');
          expect(aggregate).to.equal('-a-b-c');
        },

      },

      '"reduceRight" method': {

        'mirrors Array.reduceRight behavior': function () {
          var list = new List([ 'a', 'b', 'c' ]);
          var aggregate = list.reduceRight(function (acc, item) {
            return acc + '-' + item;
          }, '');
          expect(aggregate).to.equal('-c-b-a');
        },

      },

      '"sort" method': {

        'mirrors Array.sort behavior': function () {
          var list = new List([ 'c', 'b', 'a' ]);
          list.sort();
          expect(list[0]).to.equal('a');
          expect(list[1]).to.equal('b');
          expect(list[2]).to.equal('c');
        },

        // 'does not mess upp events after being sorted': function () {},

      },

      '"reverse" method': {

        'mirrors Array.reverse behavior': function () {
          var list = new List([ 'c', 'b', 'a' ]);
          list.reverse();
          expect(list[0]).to.equal('a');
          expect(list[1]).to.equal('b');
          expect(list[2]).to.equal('c');
        },

        // 'does not mess upp events after being reversed': function () {},

      },

      '"filter" method': {

        'mirrors Array.filter behavior': function () {
          var list = new List([ 'a', 'b', 'c' ]);
          var newList = list.filter(function (item) {
            return item !== 'b';
          });
          expect(newList.length).to.equal(2);
          expect(newList[0]).to.equal('a');
          expect(newList[1]).to.equal('c');
        },

      },

      '"concat" method': {

        'mirrors Array.concat behavior': function () {
          var list = new List([ 'a', 'b' ]);
          var array = [ 'c', 'd' ];
          var newList = list.concat(array);
          expect(newList.length).to.equal(4);
          expect(newList[0]).to.equal('a');
          expect(newList[1]).to.equal('b');
          expect(newList[2]).to.equal('c');
          expect(newList[3]).to.equal('d');
        },

        'works with Lists as well': function () {
          var list1 = new List([ 'a', 'b' ]);
          var list2 = new List([ 'c', 'd' ]);
          var newList = list1.concat(list2);
          expect(newList.length).to.equal(4);
          expect(newList[0]).to.equal('a');
          expect(newList[1]).to.equal('b');
          expect(newList[2]).to.equal('c');
          expect(newList[3]).to.equal('d');
        },

      },

      '"slice" method': {

        'mirrors Array.slice behavior': function () {
          var list = new List([ 'a', 'b', 'c', 'd' ]);
          var newList = list.slice(1, 3);
          expect(newList.length).to.equal(2);
          expect(newList[0]).to.equal('b');
          expect(newList[1]).to.equal('c');
        },

      },

      '"map" method': {

        'mirrors Array.map behavior': function () {
          var list = new List([ 'a', 'b', 'c' ]);
          var newList = list.map(function (item) {
            return item.charCodeAt(0);
          });
          expect(newList[0]).to.equal(97);
          expect(newList[1]).to.equal(98);
          expect(newList[2]).to.equal(99);
        },

      },

      '"mapMut" method': {

        'maps all the values of the List in place': function () {
          var list = new List([ 'a', 'b', 'c' ]);
          var newList = list.mapMut(function (item) {
            return item.charCodeAt(0);
          });
          expect(list).to.equal(newList);
          expect(newList[0]).to.equal(97);
          expect(newList[1]).to.equal(98);
          expect(newList[2]).to.equal(99);
        },

      },

      '"filterMut" method': {

        'filters all matching values of the list in place': function () {
          var list = new List([ 'a', 'b', 'c' ]);
          var newList = list.filterMut(function (item) {
            return item !== 'b';
          });
          expect(newList).to.equal(list);
          expect(newList.length).to.equal(2);
          expect(newList[0]).to.equal('a');
          expect(newList[1]).to.equal('c');
        },

      },

      '"remove" method': {

        'removes all instances of the item from the List': function () {
          var list = new List([ 'a', 'b', 'c', 'b' ]);
          list.remove('b');
          expect(list.length).to.equal(2);
          expect(list[0]).to.equal('a');
          expect(list[1]).to.equal('c');
        },

      },

      '"clear" method': {

        'removes all items from the List': function () {
          var list = new List([ 'a', 'b' ]);
          list.clear();
          expect(list.length).to.equal(0);
        },

      },

      '"sliceMut" method': {

        'removes all items except for those within the provided range': function () {
          var list = new List([ 'a', 'b', 'c', 'b' ]);
          list.sliceMut(1, 3);
          expect(list.length).to.equal(2);
          expect(list[0]).to.equal('b');
          expect(list[1]).to.equal('c');
        },

      },

      '"find" method': {

        'mirrors Array.find behavior': function () {
          var list = new List([ 'a', 'b', 'c' ]);
          var item = list.find(function (item) {
            return item === 'b';
          });
          expect(item).to.equal('b');
        },

      },

      '"findIndex" method': {

        'mirrors Array.findIndex behavior': function () {
          var list = new List([ 'a', 'b', 'c' ]);
          var item = list.findIndex(function (item) {
            return item === 'b';
          });
          expect(item).to.equal(1);
        },

      },

      '"includes" method': {

        'mirrors Array.includes behavior': function () {
          var list = new List([ 'a', 'b', 'c' ]);
          expect(list.includes('b')).to.equal(true);
          expect(list.includes('d')).to.equal(false);
        },

      },

      '"toArray" method': {

        'returns an Array containing all the items of the List': function () {
          var list = new List([ 'a', 'b' ]);
          var array = list.toArray();
          expect(array).not.to.equal(list);
          expect(array.length).to.equal(2);
          expect(array[0]).to.equal('a');
          expect(array[1]).to.equal('b');
        },

      },

      '"removeEventListener" method': {

        'removes event listeners': function () {
          var emitterItem = extend({}, eventEmitter);
          var list = new List([ emitterItem ]);
          var callback = sinon.spy();

          list.addEventListener('item:customEvent', callback);
          emitterItem.emit('customEvent');

          expect(callback).to.have.been.calledOnce;

          list.removeEventListener('item:customEvent');
          emitterItem.emit('customEvent');

          expect(callback).to.have.been.calledOnce;
        },

      },

      '"length" property': {

        /*'can be set to decrease the size of the array': function () {
          var list = new List([ 'a', 'b', 'c', 'd' ]);
          var lengthChangedCallback = sinon.spy();
          var itemRemovedCallback = sinon.spy();

          list.addEventListener('change:length', lengthChangedCallback);
          list.addEventListener('item:removed', itemRemovedCallback);
          list.length = 2;

          expect(lengthChangedCallback).to.have.been.calledOnce;
          expect(lengthChangedCallback).to.have.been.calledWith(2, 4, list);
          expect(itemRemovedCallback).to.have.been.calledTwice;
          expect(itemRemovedCallback).to.have.been.calledWith('c', 2, list);
          expect(itemRemovedCallback).to.have.been.calledWith('d', 3, list);
        },*/

      },

      '"first" property': {

        'can be read': function () {
          var list = new List([ 4, 5, 6 ]);
          expect(list.first).to.equal(4);
        },

        'can not be set': function () {
          var list = new List([ 4, 5, 6 ]);
          expect (function () {
            list.first = 7;
          }).to.throw();
        },

      },

      '"last" property': {

        'can be read': function () {
          var list = new List([ 4, 5, 6 ]);
          expect(list.last).to.equal(6);
        },

        'can be not set': function () {
          var list = new List([ 4, 5, 6 ]);
          expect (function () {
            list.last = 7;
          }).to.throw();
        },

      },

    };

  });

});
