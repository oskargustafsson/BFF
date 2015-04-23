define(function (require) {
  'use strict';

  var registerSuite = require('intern!object');
  var expect = require('intern/chai!expect');
  var factory = require('src/record-constructor-factory');

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

        'can be read only': function () {
          Record = factory.create({
            MAX_LEVEL: {
              getter: function () { return 99; },
              setter: false,
            },
          });
          var record = new Record();
          expect(record.MAX_LEVEL).to.equal(99);
          expect(function () { record.MAX_LEVEL = 98; }).to.throw();
          expect(function () { new Record({ MAX_LEVEL: 98 }); }).to.throw();
        },

        'can be set only': function () {
          Record = factory.create({
            password: {
              getter: false,
            },
          });
          var record = new Record();
          record.password = 'bananahammock';
          expect(record.password).to.equal(undefined);
        },

        /*'setters': {},
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

        'throws an error when a forbidden value is passed to constructor': function () {
          Record = factory.create({
            race: { type: 'string', forbiddenValues: [ undefined, null, 'cow' ] },
          });
          expect(function () { new Record(); }).to.throw();
          expect(function () { new Record({ race: undefined }); }).to.throw();
          expect(function () { new Record({ race: null }); }).to.throw();
          expect(function () { new Record({ race: 'cow' }); }).to.throw();
          expect(new Record({ race: 'human' }).race).to.equal('human');
        },

        'throws an error when a forbidden value is assigned': function () {
          Record = factory.create({
            race: { type: 'string', forbiddenValues: [ undefined, null, 'cow' ] },
          });
          var record = new Record({ race: 'human' });
          expect(function () { delete record.race; }).to.throw();
          expect(function () { record.race = undefined; }).to.throw();
          expect(function () { record.race = null; }).to.throw();
          expect(function () { record.race = 'cow'; }).to.throw();
          expect(record.race).to.equal('human');
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

      //'emits an event when a value is changed'
      //'does not emit an event if the assigned value is identical to the current one'
      //'emits an event when a dependency causes the value to change'
      //'does not emit an event if a dependency is changed but does not cause the value to change'

      // To test:
      // Dependencies
      // Getters & setters (e.g. to lowercase)
      // Serialization (toObject, toJson, toString)

    };

  });

});
