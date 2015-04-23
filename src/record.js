define([
  './mixin',
  './event-emitter',
], function (
  mixin,
  eventEmitter
) {
  'use strict';

  function makeSetter(record, propName, propSchema) {
    var evName = 'change:' + propName;

    function setter(val) {
      // If there is a custom setter, use it to transform the value
      propSchema.setter && (val = propSchema.setter(val));

      // Input validation
      if (record.runtimeChecks) {
        var type = typeof val;
        if (propSchema.type && !(type === propSchema.type || type === 'undefined')) {
          throw 'Property ' + propName + ' is of type ' + (typeof propSchema.type) +
              ' and can not be assigned a value of type ' + (typeof val);
        }
        if (propSchema.forbiddenValues && propSchema.forbiddenValues.indexOf(val) !== -1) {
          throw 'Property ' + propName + ' is not allowed to be ' + val;
        }
      }

      var oldVal = record[propName];
      if (val === oldVal) { return; }

      record.__properties[propName] = val;
      record.emit(evName, [ val, oldVal ]);
    }

    return setter;
  }

  function makeGetter(record, propName) {
    return function getter() { return record.__properties[propName]; };
  }

  function Record(schema, properties) {
    this.__properties = {};

    properties = properties || {};

    var property, propertySchema;
    for (property in schema) {
      propertySchema = schema[property] || {};

      var descriptor = {
        enumerable: true,
      };
      if (propertySchema.getter !== false) {
        descriptor.get = propertySchema.getter || makeGetter(this, property);
      }
      if (propertySchema.setter !== false) {
        descriptor.set = makeSetter(this, property, propertySchema);
      }
      Object.defineProperty(this, property, descriptor);
    }

    Object.preventExtensions(this);

    var propertiesUnion = {};
    for (property in schema) {
      var schemaInfo = schema[property] || {};
      if (schemaInfo.setter !== false) {
        propertiesUnion[property] = schemaInfo.defaultValue;
      }
    }
    for (property in properties) {
      propertiesUnion[property] = properties[property];
    }
    for (property in propertiesUnion) {
      this[property] = propertiesUnion[property];
    }
  }

  // toJSON() actually returns an object, which is a bit misleading. For compatibility reasons.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON_behavior
  Record.prototype.toJSON = Record.prototype.toObject = function () {
    return JSON.parse(this.toString());
  };

  Record.prototype.toJSONString = Record.prototype.toString = function () {
    return JSON.stringify(this.__properties);
  };

  mixin(Record, eventEmitter);

  return Record;

});
