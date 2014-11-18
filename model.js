define([], function () {
  'use strict';

  function makeSetter(self, attrName) {

    var evName = 'change:' + attrName;

    function setter(val) {
      if (self.callbacks[evName]) {
        var oldVal = self[attrName];
        self.attributes[attrName] = val;
        self.emit(evName, [ val, oldVal ]);
      } else {
        self.attributes[attrName] = val;
      }
    }

    return setter;
  }

  function makeGetter(self, attrName) {

    function getter() { return self.attributes[attrName]; }

    return getter;

  }

  function Model(schema, attributes) {
    this.attributes = {}; // TODO: make private
    this.callbacks = {}; // TODO: make private

    attributes = attributes || {};

    for (var property in schema) {
      Object.defineProperty(this, property, {
        enumerable: true,
        set: makeSetter(this, property),
        get: makeGetter(this, property)
      });
      attributes.hasOwnProperty(property) && (this.attributes[property] = attributes[property]);
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
