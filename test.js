define([
  'model-constructor-factory'
], function (
  modelConstructorFactory
) {
  'use strict';

  var PlayerModel = modelConstructorFactory.create({
    name: undefined, // no restrictions on this attribute
    id: {
      type: 'number', // specifying a type will force a type check on set
    },
    race: {
      type: 'string',
      defaultValue: 'human',
    },
    color: {
      forbiddenValues: [ null, undefined ], // Forbidding undefined is like saying that this field is required
      defaultValue: 'green',
    },
    avatar: {
      getter: function () { return this.race + '.png'; },
      setter: false, // Will throw an error if trying to set.
    }
  });

  var player = new PlayerModel({
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

  player.race = 'Alien';  // Should work
  //player.race = 4;  // Should throw error

  // Test that forbidden values are working
  //player.color = undefined;

});
