define([], function () {
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

      record.properties[propName] = val;
      record.callbacks[evName] && record.emit(evName, [ val, oldVal ]);
    }

    return setter;
  }

  function makeGetter(record, propName) {
    return function getter() { return record.properties[propName]; };
  }

  function Record(schema, properties) {
    this.properties = {}; // TODO: make private
    this.callbacks = {}; // TODO: make private

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
      propertiesUnion[property] = (schema[property] || {}).defaultValue;
    }
    for (property in properties) {
      propertiesUnion[property] = properties[property];
    }
    for (property in propertiesUnion) {
      this[property] = propertiesUnion[property];
    }
  }

  Record.prototype.toPlainObject = function () {
    return JSON.parse(this.toString());
  };

  Record.prototype.toString = function () {
    return JSON.stringify(this.properties);
  };

  // TODO: Mix these in
  Record.prototype.emit = function emit(evName, args) {
    var cbs = this.callbacks[evName];
    cbs.forEach(function (cb) {
      cb.apply(this, args);
    });
  };

  Record.prototype.on = function (evName, callback) {
    this.callbacks[evName] || (this.callbacks[evName] = []);
    this.callbacks[evName].push(callback);
  };

  Record.prototype.off = function (evName, callback) {
    if (typeof callback === 'function') {
      var cbs = this.callbacks[evName];
      var pos = cbs.indexOf(callback);
      if (pos === -1) { throw 'No such callback'; }
      cbs.splice(pos, 1);
    } else {
      delete this.callbacks[evName];
    }
  };

  return Record;

});
