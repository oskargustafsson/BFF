define([
  'record/record-constructor-factory'
], function (
  recordConstructorFactory
) {
  'use strict';

  var PlayerRecord = recordConstructorFactory.create({
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

  var player = new PlayerRecord({
    name: 'Oskar',
    id: 1337,
    //color: 'green',
  });

  //player.asd = 'asdf'; // TODO write unit test for this

  // Test that events are emitted

  player.on('change:name', function (newName, oldName) {
    console.log('oldName', oldName, 'newName', newName);
  });

  player.name = 'Bob';

  console.log(player.name);

  // Test that type checking is working
  player.race = 'alien';  // Should work
  //player.race = 4;  // Should throw error

  // Test that forbidden values are working
  //player.color = undefined;

  // Test that you can't set a value on a property whose setter is explicitly defined as false
  //player.avatarUrl = 'wat';

  // Test that the setter actually transforms the value
  player.race = 'HuMaN';

  // Test that the Record can be serialized
  console.log(player + '');
  console.log(player.toPlainObject());

});
