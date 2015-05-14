define([
  './record'
], function (
  Record
) {
  'use strict';

  function RecordConstructorFactory() {}

  RecordConstructorFactory.prototype.create = function (schema) {
    return Record.bind(null, schema);
  };

  return new RecordConstructorFactory(); // Singleton-ish

});
