define([
  './record'
], function (
  Record
) {
  'use strict';

  function RecordConstructorFactory() {}

  RecordConstructorFactory.prototype.create = function (schema) {

    Record.prototype.runtimeChecks = this.runtimeChecks;

    var Constructor = Record.bind(null, schema);

    return Constructor;

  };

  RecordConstructorFactory.prototype.runtimeChecks = true;

  return new RecordConstructorFactory(); // Singleton-ish

});
