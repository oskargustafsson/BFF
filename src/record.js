define([
  './mixin',
  './event-emitter',
], function (
  mixin,
  eventEmitter
) {
  'use strict';

  function validateInput(val, propName, propSchema) {
    var type = typeof val;
    if (propSchema.type && !(type === propSchema.type || type === 'undefined')) {
      throw 'Property ' + propName + ' is of type ' + propSchema.type +
          ' and can not be assigned a value of type ' + type;
    }
    if (propSchema.forbiddenValues && propSchema.forbiddenValues.indexOf(val) !== -1) {
      throw 'Property ' + propName + ' is not allowed to be ' + val;
    }
  }

  function makeSetter(propName, propSchema) {
    var evName = 'change:' + propName;

    var nDependers = (propSchema.dependers || []).length;
    if (nDependers > 0) {
      var oldDependerValues = new Array(nDependers);
      var dependerEvents = new Array(nDependers);
      for (var i = 0; i < nDependers; ++i) {
        dependerEvents[i] = 'change:' + propSchema.dependers[i];
      }
    }

    // TODO: make two different setter functions (in outer scope) and select (+bind)
    // one of the depending of whether the propery has any dependers
    return function setter(val) {
      // If there is a custom setter, use it to transform the value
      propSchema.setter && (val = propSchema.setter.call(this, val));

      // Input validation
      validateInput(val, propName, propSchema);

      for (var i = 0; i < nDependers; ++i) {
        oldDependerValues[i] = this[propSchema.dependers[i]];
      }

      var oldVal = this[propName];
      this.__private.properties[propName] = val;
      var newVal = this[propName];

      if (newVal === oldVal) { return; }

      this.emit(evName, [ val, oldVal, this ]);

      for (i = 0; i < nDependers; ++i) {
        var depender = propSchema.dependers[i];
        var newDependerValue = this[depender];
        var oldDependerValue = oldDependerValues[i];
        newDependerValue === oldDependerValue ||
            this.emit(dependerEvents[i], [ newDependerValue, oldDependerValue, this ]);
      }
    };
  }

  function makeGetter(propName, propSchema) {
    return propSchema.getter ?
        function getter() { return propSchema.getter.call(this, this.__private.properties[propName]); } :
        function getter() { return this.__private.properties[propName]; };
  }

  function Record(schema, properties) {
    Object.defineProperty(this, '__private', { writable: true, value: {}, });
    this.__private.properties = {};

    properties = properties || {};
    schema = schema || {};

    var property, propertySchema;
    var propertiesUnion = {};

    // Set up dependers and remove dependencies
    for (property in schema) {
      propertySchema = schema[property] = schema[property] || {};

      if (!propertySchema.dependencies) { continue; }

      while (propertySchema.dependencies.length) {
        var dependency = propertySchema.dependencies.pop();
        var dependencySchema = schema[dependency] = schema[dependency] || {};
        dependencySchema.dependers = dependencySchema.dependers || [];
        dependencySchema.dependers.push(property);
      }
      delete propertySchema.dependencies;
    }

    for (property in schema) {
      propertySchema = schema[property];
      typeof propertySchema === 'string' && (propertySchema = schema[property] = { type: propertySchema });

      var descriptor = {
        enumerable: true,
      };
      if (propertySchema.getter !== false) {
        descriptor.get = makeGetter(property, propertySchema);
      }
      if (propertySchema.setter !== false) {
        descriptor.set = makeSetter(property, propertySchema);
      }
      Object.defineProperty(this, property, descriptor);

      propertiesUnion[property] = propertySchema.defaultValue;
    }

    // Disabled, for now
    // Object.preventExtensions(this);

    for (property in properties) {
      if (!schema.hasOwnProperty(property)) {
        throw 'Cannot assign undeclared property ' + property;
      }
      propertiesUnion[property] = properties[property];
    }

    // Silently assign initial values
    for (property in propertiesUnion) {
      var val = propertiesUnion[property];
      schema[property].setter && (val = schema[property].setter.call(this, val));
      validateInput(val, property, schema[property]);
      this.__private.properties[property] = val;
    }
  }

  // toJSON() actually returns an object, which is a bit misleading. For compatibility reasons.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON_behavior
  Record.prototype.toJSON = function () {
    return JSON.parse(this.toJSONString());
  };

  Record.prototype.toJSONString = Record.prototype.toString = function () {
    var obj = {};
    for (var property in this.__private.properties) {
      obj[property] = this[property];
    }
    return JSON.stringify(obj);
  };

  mixin(Record, eventEmitter);

  return Record;

});
