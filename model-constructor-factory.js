define([
  'model'
], function (
  Model
) {
  'use strict';

  function ModelConstructorFactory() {}

  ModelConstructorFactory.prototype.create = function (schema) {

    Model.prototype.runtimeChecks = this.runtimeChecks;

    var Constructor = Model.bind(null, schema);

    return Constructor;

  };

  ModelConstructorFactory.prototype.runtimeChecks = true;

  return new ModelConstructorFactory(); // Singleton-ish

});
