define([], function () {
  'use strict';

  function makeSetter(model, propName, propSchema) {
    var evName = 'change:' + propName;

    function setter(val) {
      // If there is a custom setter, use it to transform the value
      propSchema.setter && (val = propSchema.setter(val));

      // Input validation
      if (model.runtimeChecks) {
        var type = typeof val;
        if (propSchema.type && !(type === propSchema.type || type === 'undefined')) {
          throw 'Property ' + propName + ' is of type ' + (typeof propSchema.type) +
              ' and can not be assigned a value of type ' + (typeof val);
        }
        if (propSchema.forbiddenValues && propSchema.forbiddenValues.indexOf(val) !== -1) {
          throw 'Property ' + propName + ' is not allowed to be ' + val;
        }
      }

      var oldVal = model[propName];
      if (val === oldVal) { return; }

      model.properties[propName] = val;
      model.callbacks[evName] && model.emit(evName, [ val, oldVal ]);
    }

    return setter;
  }

  function makeGetter(model, propName) {
    return function getter() { return model.properties[propName]; };
  }

  function Model(schema, properties) {
    this.properties = {}; // TODO: make private
    this.callbacks = {}; // TODO: make private

    properties = properties || {};

    for (var property in schema) {
      var propertySchema = schema[property] || {};

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

      if (propertySchema.setter !== false) {
        this[property] = properties.hasOwnProperty(property) ? properties[property] : propertySchema.defaultValue;
      }
    }

    Object.preventExtensions(this);
  }

  Model.prototype.toPlainObject = function () {
    return JSON.parse(this.toString());
  };

  Model.prototype.toString = function () {
    return JSON.stringify(this.properties);
  };

  // TODO: Mix these in
  Model.prototype.emit = function emit(evName, args) {
    var cbs = this.callbacks[evName];
    cbs.forEach(function (cb) {
      cb.apply(this, args);
    });
  };

  Model.prototype.on = function (evName, callback) {
    this.callbacks[evName] || (this.callbacks[evName] = []);
    this.callbacks[evName].push(callback);
  };

  Model.prototype.off = function (evName, callback) {
    if (typeof callback === 'function') {
      var cbs = this.callbacks[evName];
      var pos = cbs.indexOf(callback);
      if (pos === -1) { throw 'No such callback'; }
      cbs.splice(pos, 1);
    } else {
      delete this.callbacks[evName];
    }
  };

  return Model;

});
