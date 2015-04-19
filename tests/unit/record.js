define(function (require) {
  'use strict';

  var registerSuite = require('intern!object');
  var expect = require('intern/chai!expect');
  var factory = require('src/record/record-constructor-factory');

  registerSuite(function () {
    var Record;
    var record;

    return {

      name: 'Model',

      'setup': function () {
        Record = factory.create({
          name: undefined, // no restrictions on this property
          id: {
            type: 'number', // specifying a type will force a type check on set
          },
          color: {
            forbiddenValues: [ null, undefined ], // Forbidding undefined is like saying that this field is required
            defaultValue: 'green',
          },
          race: {
            type: 'string',
            defaultValue: 'human',
            setter: function (val) { return val.toLowerCase(); }
          },
          avatarUrl: {
            getter: function () { return 'assets/' + this.race + '_' + this.color + '.png'; },
            setter: false,
          },
        });
      },

      'default values are assigned': function () {
        record = new Record();
        expect(record.race).to.equal('human');
      },

      'default values can be overridden': function () {
        record = new Record({
          race: 'squirrel',
        });
        expect(record.race).to.equal('squirrel');
      },

    };
  });
});
