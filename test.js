define([
  'model-constructor-factory'
], function (
  modelConstructorFactory
) {
  'use strict';

  var PlayerModel = modelConstructorFactory.create({
    name: undefined, // this is the same as { type: undefined }, i.e. any type
    id: {
      type: Number, // specifying a type will force a type check on set
      required: true, // constructor check
    },
    race: {
      type: String,
      notNull: true,
      notUndefined: true,
    },
    avatar: {
      getter: function () { return this.race + '.png'; },
      setter: false, // Will throw an error if trying to set.
    }
  });

  var player = new PlayerModel({
    name: 'Oskar',
    id: 1337,
    race: 'Human',
  });

  //player.asd = 'asdf'; // TODO write unit test for this

  player.on('change:name', function (newName, oldName) {
    console.log('oldName', oldName, 'newName', newName);
  });

  player.name = 'Bob';

  console.log(player.name);

});
