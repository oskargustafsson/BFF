define([], function () {
  'use strict';

  function makeSetter(model, propName, propSchema) {

    var evName = 'change:' + propName;

    function setter(val) {
      // Input validation
      // TODO: make it possible to disable this
      if (propSchema.type && typeof val !== propSchema.type) {
        throw 'Property ' + propName + ' is of type ' + (typeof propSchema.type) +
            ' and can not be assigned a value of type ' + (typeof val);
      }
      if (propSchema.forbiddenValues && propSchema.forbiddenValues.indexOf(val) !== -1) {
        throw 'Property ' + propName + ' is not allowed to be ' + val;
      }

      // Set value and emit event
      if (model.callbacks[evName]) {
        var oldVal = model[propName];
        model.properties[propName] = val;
        model.emit(evName, [ val, oldVal ]);
      } else {
        model.properties[propName] = val;
      }
    }

    return setter;
  }

  function makeGetter(model, propName) {

    function getter() { return model.properties[propName]; }

    return getter;

  }

  function Model(schema, properties) {
    this.properties = {}; // TODO: make private
    this.callbacks = {}; // TODO: make private

    properties = properties || {};

    for (var property in schema) {
      var propertySchema = schema[property] || {};
      Object.defineProperty(this, property, {
        enumerable: true,
        set: makeSetter(this, property, propertySchema),
        get: makeGetter(this, property, propertySchema),
      });
      this[property] = properties.hasOwnProperty(property) ? properties[property] : propertySchema.defaultValue;
    }

    Object.preventExtensions(this);
  }

  // Mix these in
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
