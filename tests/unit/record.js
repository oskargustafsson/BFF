define(function (require) {
  'use strict';

  var registerSuite = require('intern!object');
  var expect = require('intern/chai!expect');
  var factory = require('src/record/record-constructor-factory');

  registerSuite(function () {
    var Record;

    return {

      name: 'Model',

      'properties': {

        'can be declared without any additional information and set in the constructor': function () {
          Record = factory.create({ race: undefined });
          expect(new Record({ race: 'human' }).race).to.equal('human');
        },

        'can be after creation': function () {
          Record = factory.create({ race: undefined });
          var record = new Record();
          expect(record.race).to.equal(undefined);
          record.race = 'human';
          expect(record.race).to.equal('human');
        },

        'can not be set unless declared': function () {
          Record = factory.create();
          expect(function () { new Record({ race: 'human' }); }).to.throw();
          expect(function () {
            var record = new Record();
            record.race = 'human';
          }).to.throw();
        },

        /*'can be read only': function () {
        },

        'can be set only': function () {
        },

        'setters': {},
        'getters': {},*/

      },

      'type checking': {

        'throws an error if the passed value is of the wrong type': function () {
            Record = factory.create({
              race: { type: 'string', },
            });
            expect(new Record({ race: 'human' }).race).to.equal('human');
            expect(function () { new Record({ race: 4 }); }).to.throw();
        },

        'allows values to be unset and undefined': function () {
            Record = factory.create({
              race: { type: 'string', },
            });
            expect(new Record().race).to.equal(undefined);
            expect(new Record({ race: undefined }).race).to.equal(undefined);
        },

      },

      'forbidden value checking': {

        'throws an error when a forbidden value is passed': function () {
          Record = factory.create({
            race: { type: 'string', forbiddenValues: [ undefined, null ] },
          });
          expect(function () { new Record(); }).to.throw();
          expect(function () { new Record({ race: undefined }); }).to.throw();
          expect(function () { new Record({ race: null }); }).to.throw();
          expect(new Record({ race: 'human' }).race).to.equal('human');
        },

      },

      'default values': {

        'are assigned': function () {
          Record = factory.create({
            race: { defaultValue: 'human', },
          });
          expect(new Record().race).to.equal('human');
        },

        'can be overridden': function () {
          Record = factory.create({
            race: { defaultValue: 'human', },
          });
          expect(new Record({ race: 'squirrel' }).race).to.equal('squirrel');
        },

        'throws an error when the wrong type is passed': function () {
          Record = factory.create({
            race: { type: 'number', defaultValue: 'human', },
          });
          expect(function () { new Record(); }).to.throw();
        },

        'does not throw an error when the specified type is passed': function () {
          Record = factory.create({
            race: { type: 'string', defaultValue: 'human', },
          });
          expect(new Record().race).to.equal('human');
        },

      },

    };

  });

});
