define([
  'model'
], function (
  Model
) {
  'use strict';

  function ModelConstructorFactory() {}

  ModelConstructorFactory.prototype.create = function (schema) {

    var Constructor = Model.bind(null, schema);

    return Constructor;

  };

  return new ModelConstructorFactory(); // Singleton-ish

});
