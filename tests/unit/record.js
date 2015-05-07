define(function (require) {
  'use strict';

  var registerSuite = require('intern!object');
  var expect = require('intern/chai!expect');
  var chai = require('intern/chai!');
  var sinon = require('node_modules/sinon/pkg/sinon');
  var sinonChai = require('node_modules/sinon-chai/lib/sinon-chai');

  var factory = require('src/record-constructor-factory');

  chai.use(sinonChai);

  registerSuite(function () {
    var Record;

    return {

      name: 'Record',

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

        'dependencies': {

          'causes events to be triggered on dependent properties': function () {
            Record = factory.create({
              firstName: { type: 'string', defaultValue: 'Boutros' },
              lastName: { type: 'string', defaultValue: 'Gali' },
              fullName: {
                setter: false,
                getter: function () {
                  return this.firstName + ' ' + this.lastName;
                },
                dependencies: [ 'firstName', 'lastName' ],
              },
            });
            var record = new Record();
            var callback = sinon.spy();

            expect(record.fullName).to.equal('Boutros Gali');

            record.addEventListener('change:fullName', callback);
            record.lastName = 'Boutros-Gali';

            expect(record.fullName).to.equal('Boutros Boutros-Gali');
            expect(callback).to.have.been.calledWith('Boutros Boutros-Gali', 'Boutros Gali', record);
          },

          'does not trigger an event if the dependent does not actually change': function () {
            Record = factory.create({
              firstName: { type: 'string', defaultValue: 'Boutros' },
              lastName: { type: 'string', defaultValue: 'boutros-gali' },
              fullName: {
                setter: false,
                getter: function () {
                  return (this.firstName + ' ' + this.lastName).toUpperCase();
                },
                dependencies: [ 'firstName', 'lastName' ],
              },
            });
            var record = new Record();
            var callback = sinon.spy();

            expect(record.fullName).to.equal('BOUTROS BOUTROS-GALI');

            record.addEventListener('change:fullName', callback);
            record.lastName = 'Boutros-Gali';

            expect(record.fullName).to.equal('BOUTROS BOUTROS-GALI');
            expect(callback).not.to.have.been.called;
          },

        },

        'getters': {

          'can be explicitly disabled': function () {
            // TODO: figure out what this would ever be used for...
            Record = factory.create({
              password: { getter: false, },
            });
            var record = new Record();
            record.password = 'bananahammock';
            expect(record.password).to.equal(undefined);
          },


          'are applied before a property value is returned': function () {
            Record = factory.create({
              date: {
                type: 'number', // Input type
                getter: function (value) {
                  return new Date(value);
                },
              },
            });
            var record = new Record({ date: 1431019735165 });
            expect(record.date.getMilliseconds()).to.equal(165);
          },

          'have access to other properties': function () {
            Record = factory.create({
              currencySymbol: 'string',
              amount: {
                type: 'number',
                getter: function (value) {
                  return value + ' ' + this.currencySymbol;
                },
              },
            });
            var record = new Record({
              currencySymbol: '€',
              amount: 8,
            });
            expect(record.amount).to.equal('8 €');
          },

          'can stop a change event from being triggered': function () {
            Record = factory.create({
              username: {
                type: 'string',
                defaultValue: '',
                getter: function (value) {
                  return value.toLowerCase();
                },
              },
            });
            var record = new Record({ username: 'Freudipus', });
            var callback = sinon.spy();

            record.addEventListener('change:username', callback);
            record.username = 'django';

            expect(callback).to.have.been.calledOnce;
            expect(callback).to.have.been.calledWith('django', 'freudipus', record);

            record.username = 'DjangO';

            expect(callback).to.have.been.calledOnce;
          },

        },

        'setters': {

          'can be explicitly disabled': function () {
            Record = factory.create({
              MAX_LEVEL: {
                getter: function () { return 99; },
                setter: false,
              },
            });
            var record = new Record();
            expect(record.MAX_LEVEL).to.equal(99);
            expect(function () { record.MAX_LEVEL = 98; }).to.throw();
          },

          'even if disabled, allows you to specify an initial value': function () {
            Record = factory.create({
              MAX_LEVEL: {
                defaultValue: 99,
                setter: false,
              },
            });
            var record = new Record();
            expect(record.MAX_LEVEL).to.equal(99);
            expect(function () { record.MAX_LEVEL = 98; }).to.throw();
          },

          'even if disabled, allows you to pass an initial value to the constructor': function () {
            Record = factory.create({
              MAX_LEVEL: {
                setter: false,
              },
            });
            var record = new Record({ MAX_LEVEL: 99 });
            expect(record.MAX_LEVEL).to.equal(99);
            expect(function () { record.MAX_LEVEL = 98; }).to.throw();
          },

          'are applied before a property is assigned': function () {

          },

        },

      },

      'type checking': {

        'throws an error if the passed value is of the wrong type': function () {
            Record = factory.create({
              race: { type: 'string', },
            });
            expect(new Record({ race: 'human' }).race).to.equal('human');
            expect(function () {
              new Record({ race: 4 });
            }).to.throw();
        },

        'throws an error if the passed value is of the wrong type (alt. syntax)': function () {
            Record = factory.create({
              race: 'string',
            });
            expect(new Record({ race: 'human' }).race).to.equal('human');
            expect(function () {
              new Record({ race: 4 });
            }).to.throw();
        },

        'allows values to be unset and undefined': function () {
            Record = factory.create({
              race: 'string',
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
