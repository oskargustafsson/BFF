define(function (require) {
  'use strict';

  var registerSuite = require('intern!object');
  var chai = require('intern/chai!');
  var sinon = require('node_modules/sinon/pkg/sinon');
  var sinonChai = require('node_modules/sinon-chai/lib/sinon-chai');
  var expect = require('intern/chai!expect');

  var List = require('src/list');

  chai.use(sinonChai);

  registerSuite(function () {

    return {

      name: 'List',

      'inherits from Array': function () {
        var list = new List();

        expect(list instanceof Array).to.equal(true);
      },

      'takes the same constructor args as an array': function () {
          var list1 = new List(3);
          expect(list1.length).to.equal(3);
          expect(list1[0]).to.equal(undefined);
          expect(list1[1]).to.equal(undefined);
          expect(list1[2]).to.equal(undefined);

          var list2 = new List('3');
          expect(list2.length).to.equal(1);
          expect(list2[0]).to.equal('3');

          var list3 = new List('3', 3);
          expect(list3.length).to.equal(2);
          expect(list3[0]).to.equal('3');
          expect(list3[1]).to.equal(3);
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

      }

    };

  });

});
