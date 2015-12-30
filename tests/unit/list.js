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

  // TESTS
  // Can listen to item events (if they expose addEventListener & removeEventListener)
  // Can have properties, just like Records, including dependencies
  // List properties should trigger events when changed

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
          var schema = {
            nDone: {
              getter: function () {
                return this.reduce(function (nDone, item) {
                  return nDone + (item.done ? 1 : 0);
                }, 0);
              }
            }
          };
          var list = new List(schema, [
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
          var schema = {
            nDone: {
              getter: function () {
                return this.reduce(function (nDone, item) {
                  return nDone + (item.done ? 1 : 0);
                }, 0);
              },
              dependencies: [ 'length', 'item:done' ],
            }
          };
          var TodoItem = Record.bind(null, {
            id: 'number',
            done: 'boolean',
          });
          var list = new List(schema, [
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

          list.push({ id: 5, done: true });

          expect(nDoneChangedCallback).to.have.been.calledTwice;

          list.push({ id: 6, done: false });

          expect(nDoneChangedCallback).to.have.been.calledTwice;
          expect(nDoneChangedCallback).to.have.been.calledWith(2, 1, list);

          //list[0].done = true;

          // FAILS
          //expect(nDoneChangedCallback).to.have.been.calledThrice;
          //expect(nDoneChangedCallback).to.have.been.calledWith(3, 2, list);
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

        'is chainable': function () {
          var list = new List();
          expect(list.unshift(4)).to.equal(list);
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
