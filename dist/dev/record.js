!function() {
  'use strict';
  function moduleFactory(extend, eventEmitter, eventListener) {
    function validateInput(val, propName, propSchema) {
      var type = typeof val;
      if (propSchema.type && type !== propSchema.type && (!propSchema.allowedValues || -1 === propSchema.allowedValues.indexOf(val))) {
        throw 'Property ' + propName + ' is of type ' + propSchema.type + ' and can not be assigned a value of type ' + type + '. You can add an "allowedValues" array to the schema to allow specific values';
      }
      if (propSchema.forbiddenValues && -1 !== propSchema.forbiddenValues.indexOf(val)) {
        throw 'Property ' + propName + ' is not allowed to be ' + val;
      }
    }
    function makeSetter(propName, propSchema) {
      var MY_PRECHANGE_EVENT = PRECHANGE_EVENT + ':' + propName;
      var MY_CHANGE_EVENT = CHANGE_EVENT + ':' + propName;
      return function(val) {
        propSchema.setter && (val = propSchema.setter.call(this, val));
        var oldVal = this[propName];
        this.emit(PRECHANGE_EVENT, propName, oldVal, this);
        this.emit(MY_PRECHANGE_EVENT, oldVal, this);
        this.__private.values[propName] = val;
        if (this[propName] === oldVal) {
          return;
        }
        var newVal = this[propName];
        this.emit(CHANGE_EVENT, propName, newVal, oldVal, this);
        this.emit(MY_CHANGE_EVENT, newVal, oldVal, this);
        true && validateInput(newVal, propName, propSchema);
      };
    }
    function makeGetter(propName, propSchema) {
      return propSchema.getter ? function() {
        return propSchema.getter.call(this, this.__private.values[propName]);
      } : function() {
        return this.__private.values[propName];
      };
    }
    function Record(values) {
      if (!this.__private) {
        throw 'Record an abstract class, meant to be "subclassed" using Record.withProperties(schema)';
      }
      this.__private.values = {};
      this.__private.previousValues = {};
      var schema = this.__private.schema;
      var propsUnion = {};
      for (var propName in schema) {
        propsUnion[propName] = schema[propName].defaultValue;
      }
      for (propName in values) {
        if (true && !schema.hasOwnProperty(propName)) {
          throw 'Cannot assign undeclared property ' + propName;
        }
        propsUnion[propName] = values[propName];
      }
      for (propName in propsUnion) {
        var val = propsUnion[propName];
        schema[propName].setter && (val = schema[propName].setter.call(this, val));
        this.__private.values[propName] = val;
        true && validateInput(this[propName], propName, schema[propName]);
      }
      var onPreChangeEvent = function(propName) {
        var oldVal = this.__private.previousValues[propName] = this[propName];
        this.emit(PRECHANGE_EVENT, propName, oldVal, this);
        this.emit(PRECHANGE_EVENT + ':' + propName, oldVal, this);
      };
      var onChangeEvent = function(propName) {
        var oldVal = this.__private.previousValues[propName];
        var newVal = this[propName];
        if (newVal === oldVal) {
          return;
        }
        this.emit(CHANGE_EVENT, propName, newVal, oldVal, this);
        this.emit(CHANGE_EVENT + ':' + propName, newVal, oldVal, this);
      };
      for (propName in schema) {
        var propSchema = schema[propName];
        if (!propSchema.dependencies) {
          continue;
        }
        for (var i = 0; i < propSchema.dependencies.length; ++i) {
          var dependencyPropName = propSchema.dependencies[i];
          this.listenTo(this, PRECHANGE_EVENT + ':' + dependencyPropName, onPreChangeEvent.bind(this, propName));
          this.listenTo(this, CHANGE_EVENT + ':' + dependencyPropName, onChangeEvent.bind(this, propName));
        }
      }
    }
    var PRECHANGE_EVENT = 'prechange';
    var CHANGE_EVENT = 'change';
    Record.prototype.toJSON = function() {
      var obj = {};
      for (var propName in this.__private.values) {
        obj[propName] = this[propName];
      }
      return obj;
    };
    Record.prototype.toString = function() {
      return JSON.stringify(this);
    };
    extend(Record.prototype, eventEmitter);
    extend(Record.prototype, eventListener);
    Record.withProperties = function(schema, dontPreventExtensions) {
      var RecordSubclass = function(values) {
        this.__private || Object.defineProperty(this, '__private', {
          writable: true,
          value: {}
        });
        this.__private.schema = schema;
        Record.call(this, values);
        dontPreventExtensions || Object.preventExtensions(this);
      };
      RecordSubclass.prototype = Object.create(Record.prototype);
      RecordSubclass.prototype.constructor = RecordSubclass;
      var props = {};
      for (var propName in schema) {
        var propSchema = schema[propName] = schema[propName] || {};
        'string' == typeof propSchema && (propSchema = schema[propName] = {
          type: propSchema
        });
        props[propName] = {
          enumerable: true,
          get: false === propSchema.getter ? void 0 : makeGetter(propName, propSchema),
          set: false === propSchema.setter ? void 0 : makeSetter(propName, propSchema)
        };
      }
      Object.defineProperties(RecordSubclass.prototype, props);
      return RecordSubclass;
    };
    return Record;
  }
  if ('function' == typeof define && define.amd) {
    define([ './extend', './event-emitter', './event-listener' ], moduleFactory);
  } else {
    if ('object' == typeof exports) {
      module.exports = moduleFactory(require('./extend'), require('./event-emitter'), require('./event-listener'));
    } else {
      var bff = window.bff = window.bff || {};
      bff.Record = moduleFactory(bff.extend, bff.eventEmitter, bff.eventListener);
    }
  }
}();