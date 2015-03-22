define([], function () {
  'use strict';

  function makeSetter(model, attrName, attr) {

    var evName = 'change:' + attrName;

    function setter(val) {
      // Input validation
      // TODO: make it possible to disable this
      if (attr.type && typeof val !== attr.type) {
        throw 'Attribute ' + attrName + ' is of type ' + (typeof attr.type) +
            ' and can not be assigned a value of type ' + (typeof val);
      }
      if (attr.forbiddenValues && attr.forbiddenValues.indexOf(val) !== -1) {
        throw 'Attribute ' + attrName + ' is not allowed to be ' + val;
      }

      // Set value and emit event
      if (model.callbacks[evName]) {
        var oldVal = model[attrName];
        model.attributes[attrName] = val;
        model.emit(evName, [ val, oldVal ]);
      } else {
        model.attributes[attrName] = val;
      }
    }

    return setter;
  }

  function makeGetter(model, attrName) {

    function getter() { return model.attributes[attrName]; }

    return getter;

  }

  function Model(schema, attributes) {
    this.attributes = {}; // TODO: make private
    this.callbacks = {}; // TODO: make private

    attributes = attributes || {};

    for (var property in schema) {
      var propertySchema = schema[property] || {};
      Object.defineProperty(this, property, {
        enumerable: true,
        set: makeSetter(this, property, propertySchema),
        get: makeGetter(this, property, propertySchema),
      });
      //attributes.hasOwnProperty(property) && (this.attributes[property] = attributes[property]);
      this[property] = attributes.hasOwnProperty(property) ? attributes[property] : propertySchema.defaultValue;
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
