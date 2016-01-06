define(function (require) {
  'use strict';

  var registerSuite = require('intern!object');
  var expect = require('intern/chai!expect');
  var chai = require('intern/chai!');
  var sinon = require('node_modules/sinon/pkg/sinon');
  var sinonChai = require('node_modules/sinon-chai/lib/sinon-chai');

  var Record = require('dist/dev/record');

  var recordFactory = function (schema) { return Record.bind(null, schema); };

  chai.use(sinonChai);

  registerSuite(function () {
    var Record;

    return {

      name: 'Record',

      'properties': {

        'can be declared without any additional information and set in the constructor': function () {
          Record = recordFactory({ race: undefined });
          expect(new Record({ race: 'human' }).race).to.equal('human');
        },

        'can be set after creation': function () {
          Record = recordFactory({ race: undefined });
          var record = new Record();
          expect(record.race).to.equal(undefined);
          record.race = 'human';
          expect(record.race).to.equal('human');
        },

        'are enumerable, and nothing else is': function () {
          Record = recordFactory({ prop1: undefined, prop2: undefined });
          var record = new Record({ prop1: 'a' });
          expect(Object.keys(record)).to.contain('prop1');
          expect(Object.keys(record)).to.contain('prop2');
          expect(Object.keys(record).length).to.equal(2);
        },

        /* this functionality is disabled, for now
        'can not be set unless declared': function () {
          Record = recordFactory();
          expect(function () { new Record({ race: 'human' }); }).to.throw();
          expect(function () {
            var record = new Record();
            record.race = 'human';
          }).to.throw();
        },*/

        'triggers "prechange" and "change" events when a property is changed': function () {
          Record = recordFactory({ race: undefined, name: undefined });
          var record = new Record();
          var prechangeCallback = sinon.spy();
          var prechangeRaceCallback = sinon.spy();
          var changeCallback = sinon.spy();
          var changeNameCallback = sinon.spy();

          record.addEventListener('prechange', prechangeCallback);
          record.addEventListener('prechange:race', prechangeRaceCallback);
          record.addEventListener('change', changeCallback);
          record.addEventListener('change:race', changeNameCallback);
          record.race = 'human';

          expect(prechangeCallback).to.have.been.calledOnce;
          expect(prechangeCallback).to.have.been.calledWith('race', undefined, record);
          expect(prechangeRaceCallback).to.have.been.calledOnce;
          expect(prechangeRaceCallback).to.have.been.calledWith(undefined, record);
          expect(changeCallback).to.have.been.calledOnce;
          expect(changeCallback).to.have.been.calledWith('race', 'human', undefined, record);
          expect(changeNameCallback).to.have.been.calledOnce;
          expect(changeNameCallback).to.have.been.calledWith('human', undefined, record);

          expect(prechangeCallback).to.have.been.calledBefore(changeCallback);
          expect(prechangeCallback).to.have.been.calledBefore(changeNameCallback);
          expect(prechangeRaceCallback).to.have.been.calledBefore(changeCallback);
          expect(prechangeRaceCallback).to.have.been.calledBefore(changeNameCallback);

          record.race = 'dancer';

          expect(prechangeCallback).to.have.been.calledTwice;
          expect(prechangeCallback).to.have.been.calledWith('race', 'human', record);
          expect(prechangeRaceCallback).to.have.been.calledTwice;
          expect(prechangeRaceCallback).to.have.been.calledWith('human', record);
          expect(changeCallback).to.have.been.calledTwice;
          expect(changeCallback).to.have.been.calledWith('race', 'dancer', 'human', record);
          expect(changeNameCallback).to.have.been.calledTwice;
          expect(changeNameCallback).to.have.been.calledWith('dancer', 'human', record);

          record.name = 'bob';

          expect(prechangeCallback).to.have.been.calledThrice;
          expect(prechangeCallback).to.have.been.calledWith('name', undefined, record);
          expect(prechangeRaceCallback).to.have.been.calledTwice;
          expect(changeCallback).to.have.been.calledThrice;
          expect(changeCallback).to.have.been.calledWith('name', 'bob', undefined, record);
          expect(changeNameCallback).to.have.been.calledTwice;
        },

        'does not trigger change events if the assigned value is equal to the current': function () {
          Record = recordFactory({
            race: { defaultValue: 'human', },
          });
          var record = new Record();
          var prechangeCallback = sinon.spy();
          var changeCallback = sinon.spy();

          record.addEventListener('prechange:race', prechangeCallback);
          record.addEventListener('change:race', changeCallback);
          record.race = 'human';

          expect(prechangeCallback).to.have.been.calledOnce;
          expect(changeCallback).not.to.have.been.called;

          record.race = 'human';

          expect(prechangeCallback).to.have.been.calledTwice;
          expect(changeCallback).not.to.have.been.called;
        },

        'dependencies': {

          'causes "prechange" and "change" events to be triggered on dependent properties': function () {
            Record = recordFactory({
              firstName: { type: 'string', defaultValue: 'Boutros' },
              lastName: { type: 'string', defaultValue: 'Ghali' },
              fullName: {
                setter: false,
                getter: function () {
                  return this.firstName + ' ' + this.lastName;
                },
                dependencies: [ 'firstName', 'lastName' ],
              },
            });
            var record = new Record();
            var prechangeCallback = sinon.spy();
            var fullNamePrechangeCallback = sinon.spy();
            var changeCallback = sinon.spy();
            var fullNameChangeCallback = sinon.spy();

            expect(record.fullName).to.equal('Boutros Ghali');

            record.addEventListener('prechange', prechangeCallback);
            record.addEventListener('prechange:fullName', fullNamePrechangeCallback);
            record.addEventListener('change', changeCallback);
            record.addEventListener('change:fullName', fullNameChangeCallback);
            record.lastName = 'Boutros-Ghali';

            expect(record.fullName).to.equal('Boutros Boutros-Ghali');
            expect(prechangeCallback).to.have.been.calledTwice;
            expect(prechangeCallback).to.have.been.calledWith('lastName', 'Ghali', record);
            expect(prechangeCallback).to.have.been.calledWith(
                'fullName', 'Boutros Ghali', record);
            expect(fullNamePrechangeCallback).to.have.been.calledOnce;
            expect(fullNamePrechangeCallback).to.have.been.calledWith('Boutros Ghali', record);
            expect(changeCallback).to.have.been.calledTwice;
            expect(changeCallback).to.have.been.calledWith('lastName', 'Boutros-Ghali', 'Ghali', record);
            expect(changeCallback).to.have.been.calledWith(
                'fullName', 'Boutros Boutros-Ghali', 'Boutros Ghali', record);
            expect(fullNameChangeCallback).to.have.been.calledOnce;
            expect(fullNameChangeCallback).to.have.been.calledWith('Boutros Boutros-Ghali', 'Boutros Ghali', record);

            record.firstName = 'Boutros Boutros';

            expect(record.fullName).to.equal('Boutros Boutros Boutros-Ghali');
            expect(prechangeCallback).to.have.callCount(4);
            expect(prechangeCallback).to.have.been.calledWith('firstName', 'Boutros', record);
            expect(prechangeCallback).to.have.been.calledWith('fullName', 'Boutros Boutros-Ghali', record);
            expect(fullNamePrechangeCallback).to.have.been.calledTwice;
            expect(fullNamePrechangeCallback).to.have.been.calledWith('Boutros Boutros-Ghali', record);
            expect(changeCallback).to.have.callCount(4);
            expect(changeCallback).to.have.been.calledWith('firstName', 'Boutros Boutros', 'Boutros', record);
            expect(changeCallback).to.have.been.calledWith(
                'fullName', 'Boutros Boutros Boutros-Ghali', 'Boutros Boutros-Ghali', record);
            expect(fullNameChangeCallback).to.have.been.calledTwice;
            expect(fullNameChangeCallback).to.have.been.calledWith(
                'Boutros Boutros Boutros-Ghali', 'Boutros Boutros-Ghali', record);
          },

          'does not trigger change events if the dependent does not actually change': function () {
            Record = recordFactory({
              firstName: { type: 'string', defaultValue: 'Boutros' },
              lastName: { type: 'string', defaultValue: 'boutros-ghali' },
              fullName: {
                setter: false,
                getter: function () {
                  return (this.firstName + ' ' + this.lastName).toUpperCase();
                },
                dependencies: [ 'firstName', 'lastName' ],
              },
            });
            var record = new Record();
            var prechangeCallback = sinon.spy();
            var changeCallback = sinon.spy();

            expect(record.fullName).to.equal('BOUTROS BOUTROS-GHALI');

            record.addEventListener('prechange:fullName', prechangeCallback);
            record.addEventListener('change:fullName', changeCallback);
            record.lastName = 'Boutros-Ghali';

            expect(record.fullName).to.equal('BOUTROS BOUTROS-GHALI');
            expect(prechangeCallback).to.have.been.calledOnce;
            expect(changeCallback).not.to.have.been.called;
          },

        },

        'second-level dependencies': {

          'emits "prechange" and "change" event when a property in its dependency chain is changed': function  () {
            Record = recordFactory({
              first: { type: 'string', defaultValue: 'a' },
              second: {
                setter: false,
                getter: function () {
                  return this.first + this.first;
                },
                dependencies: [ 'first' ],
              },
              third: {
                setter: false,
                getter: function () {
                  return this.second + this.second;
                },
                dependencies: [ 'second' ],
              },
            });
            var record = new Record();
            expect(record.first).to.equal('a');
            expect(record.second).to.equal('aa');
            expect(record.third).to.equal('aaaa');

            var prechangeCallback = sinon.spy();
            var firstPrechangeCallback = sinon.spy();
            var secondPrechangeCallback = sinon.spy();
            var thirdPrechangeCallback = sinon.spy();
            var changeCallback = sinon.spy();
            var firstChangeCallback = sinon.spy();
            var secondChangeCallback = sinon.spy();
            var thirdChangeCallback = sinon.spy();

            record.addEventListener('prechange', prechangeCallback);
            record.addEventListener('prechange:first', firstPrechangeCallback);
            record.addEventListener('prechange:second', secondPrechangeCallback);
            record.addEventListener('prechange:third', thirdPrechangeCallback);
            record.addEventListener('change', changeCallback);
            record.addEventListener('change:first', firstChangeCallback);
            record.addEventListener('change:second', secondChangeCallback);
            record.addEventListener('change:third', thirdChangeCallback);
            record.first = 'b';

            expect(record.first).to.equal('b');
            expect(record.second).to.equal('bb');
            expect(record.third).to.equal('bbbb');

            expect(prechangeCallback).to.have.been.calledThrice;
            expect(prechangeCallback).to.have.been.calledWith('first', 'a', record);
            expect(prechangeCallback).to.have.been.calledWith('second', 'aa', record);
            expect(prechangeCallback).to.have.been.calledWith('third', 'aaaa', record);

            expect(firstPrechangeCallback).to.have.been.calledOnce;
            expect(firstPrechangeCallback).to.have.been.calledWith('a', record);
            expect(secondPrechangeCallback).to.have.been.calledOnce;
            expect(secondPrechangeCallback).to.have.been.calledWith('aa', record);
            expect(thirdPrechangeCallback).to.have.been.calledOnce;
            expect(thirdPrechangeCallback).to.have.been.calledWith('aaaa', record);

            expect(changeCallback).to.have.been.calledThrice;
            expect(changeCallback).to.have.been.calledWith('first', 'b', 'a', record);
            expect(changeCallback).to.have.been.calledWith('second', 'bb', 'aa', record);
            expect(changeCallback).to.have.been.calledWith('third', 'bbbb', 'aaaa', record);

            expect(firstChangeCallback).to.have.been.calledOnce;
            expect(firstChangeCallback).to.have.been.calledWith('b', 'a', record);
            expect(secondChangeCallback).to.have.been.calledOnce;
            expect(secondChangeCallback).to.have.been.calledWith('bb', 'aa', record);
            expect(thirdChangeCallback).to.have.been.calledOnce;
            expect(thirdChangeCallback).to.have.been.calledWith('bbbb', 'aaaa', record);
          },

        },

        'getters': {

          'can be explicitly disabled': function () {
            // TODO: figure out what this would ever be used for...
            Record = recordFactory({
              password: { getter: false, },
            });
            var record = new Record();
            record.password = 'bananahammock';
            expect(record.password).to.equal(undefined);
          },

          'are applied before a property value is returned': function () {
            Record = recordFactory({
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
            Record = recordFactory({
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
            Record = recordFactory({
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
            Record = recordFactory({
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
            Record = recordFactory({
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
            Record = recordFactory({
              MAX_LEVEL: {
                setter: false,
              },
            });
            var record = new Record({ MAX_LEVEL: 99 });
            expect(record.MAX_LEVEL).to.equal(99);
            expect(function () { record.MAX_LEVEL = 98; }).to.throw();
          },

          'are applied before a property value is assigned': function () {
            Record = recordFactory({
              date: {
                type: 'object', // Stored type
                setter: function (value) {
                  return new Date(value);
                },
              },
            });
            var record = new Record({ date: 1431019735165 });
            expect(record.date.getMilliseconds()).to.equal(165);
          },

          'have access to other properties': function () {
            Record = recordFactory({
              currencySymbol: 'string',
              amount: {
                type: 'string',
                setter: function (value) {
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
            Record = recordFactory({
              username: {
                type: 'string',
                defaultValue: '',
                setter: function (value) {
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

      },

      'type checking': {

        'throws an error if the passed value is of the wrong type': function () {
            Record = recordFactory({
              race: { type: 'string', },
            });
            expect(new Record({ race: 'human' }).race).to.equal('human');
            expect(function () {
              new Record({ race: 4 });
            }).to.throw();
        },

        'throws an error if the passed value is of the wrong type (alt. syntax)': function () {
            Record = recordFactory({
              race: 'string',
            });
            expect(new Record({ race: 'human' }).race).to.equal('human');
            expect(function () {
              new Record({ race: 4 });
            }).to.throw();
        },

        'allows values to be unset and undefined': function () {
            Record = recordFactory({
              race: 'string',
            });
            expect(new Record().race).to.equal(undefined);
            expect(new Record({ race: undefined }).race).to.equal(undefined);
        },

      },

      'forbidden value checking': {

        'throws an error when a forbidden value is passed to constructor': function () {
          Record = recordFactory({
            race: { type: 'string', forbiddenValues: [ undefined, null, 'cow' ] },
          });
          expect(function () { new Record(); }).to.throw();
          expect(function () { new Record({ race: undefined }); }).to.throw();
          expect(function () { new Record({ race: null }); }).to.throw();
          expect(function () { new Record({ race: 'cow' }); }).to.throw();
          expect(new Record({ race: 'human' }).race).to.equal('human');
        },

        'throws an error when a forbidden value is assigned': function () {
          Record = recordFactory({
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
          Record = recordFactory({
            race: { defaultValue: 'human', },
          });
          expect(new Record().race).to.equal('human');
        },

        'can be overridden': function () {
          Record = recordFactory({
            race: { defaultValue: 'human', },
          });
          expect(new Record({ race: 'squirrel' }).race).to.equal('squirrel');
        },

        'throws an error when the wrong type is passed': function () {
          Record = recordFactory({
            race: { type: 'number', defaultValue: 'human', },
          });
          expect(function () { new Record(); }).to.throw();
        },

        'does not throw an error when the specified type is passed': function () {
          Record = recordFactory({
            race: { type: 'string', defaultValue: 'human', },
          });
          expect(new Record().race).to.equal('human');
        },

      },

      '"toJSON" method returns a plain object representation of the record': function () {
        Record = recordFactory({
          firstName: 'string',
          lastName: 'string',
          fullName: {
            type: 'string',
            setter: false,
            getter: function () {
              return this.firstName + ' ' + this.lastName;
            },
          },
          age: 'number',
        });
        var record = new Record({
          firstName: 'Boutros',
          lastName: 'Boutros-Ghali',
          age: 46,
        });

        var jsonObj = record.toJSON();

        expect(Object.keys(jsonObj).length).to.equal(4);
        expect(jsonObj.firstName).to.equal('Boutros');
        expect(jsonObj.lastName).to.equal('Boutros-Ghali');
        expect(jsonObj.fullName).to.equal('Boutros Boutros-Ghali');
        expect(jsonObj.age).to.equal(46);

        expect(jsonObj.firstName).to.equal(record.firstName);
        expect(jsonObj.lastName).to.equal(record.lastName);
        expect(jsonObj.fullName).to.equal(record.fullName);
        expect(jsonObj.age).to.equal(record.age);
      },

      '"toString" method returns a string containing all properties and their respective values': function () {
        Record = recordFactory({
          firstName: 'string',
          lastName: 'string',
          fullName: {
            type: 'string',
            setter: false,
            getter: function () {
              return this.firstName + ' ' + this.lastName;
            },
          },
          age: 'number',
        });
        var record = new Record({
          firstName: 'Donky',
          lastName: 'Kong',
          age: 4,
        });

        var str = record.toString();

        expect(str).to.contain('firstName');
        expect(str).to.contain('Donky');
        expect(str).to.contain('lastName');
        expect(str).to.contain('Kong');
        expect(str).to.contain('fullName');
        expect(str).to.contain('Donky Kong');
        expect(str).to.contain('age');
        expect(str).to.contain('4');
      },

      '"toJSONString" method to return a valid JSON string representation of the record': function () {
        Record = recordFactory({
          firstName: 'string',
          lastName: 'string',
          fullName: {
            type: 'string',
            setter: false,
            getter: function () {
              return this.firstName + ' ' + this.lastName;
            },
          },
          age: 'number',
        });
        var record = new Record({
          firstName: 'Donky',
          lastName: 'Kong',
          age: 4,
        });

        var jsonStr = record.toJSONString();

        var parsedObj = JSON.parse(jsonStr);

        expect(parsedObj).to.deep.equal(record.toJSON());
        expect(parsedObj).to.deep.equal(JSON.parse(JSON.stringify(parsedObj)));
      },

    };

  });

});
