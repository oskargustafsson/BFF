define([
  './extend',
  './event-emitter',
  './event-listener',
], function (
  extend,
  eventEmitter,
  eventListener
) {
  'use strict';

  var PRECHANGE_EVENT = 'prechange';
  var CHANGE_EVENT = 'change';

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
    var MY_PRECHANGE_EVENT = PRECHANGE_EVENT + ':' + propName;
    var MY_CHANGE_EVENT = CHANGE_EVENT + ':' + propName;

    // TODO: make two different setter functions (in outer scope) and select (+bind)
    // one of the depending of whether the propery has any dependers
    return function setter(val) {
      // If there is a custom setter, use it to transform the value
      propSchema.setter && (val = propSchema.setter.call(this, val));

      // Input validation
      RUNTIME_CHECKS && validateInput(val, propName, propSchema);

      var oldVal = this[propName];

      this.emit(PRECHANGE_EVENT, propName, oldVal, this);
      this.emit(MY_PRECHANGE_EVENT, oldVal, this);

      this.__private.values[propName] = val;

      // If the value change did not affect the public value, we don't trigger any change events
      if (this[propName] === oldVal) { return; }

      var newVal = this[propName];
      this.emit(CHANGE_EVENT, propName, newVal, oldVal, this);
      this.emit(MY_CHANGE_EVENT, newVal, oldVal, this);
    };
  }

  function makeGetter(propName, propSchema) {
    return propSchema.getter ?
        function getter() { return propSchema.getter.call(this, this.__private.values[propName]); } :
        function getter() { return this.__private.values[propName]; };
  }

  function Record(schema, values, options) {
    this.__private || Object.defineProperty(this, '__private', { writable: true, value: {}, });
    this.__private.values = {};
    this.__private.previousValues = {};

    values = values || {};
    schema = schema || {};
    options = options || {};

    if (RUNTIME_CHECKS) { // Guarantee that we don't mess with the arguments, they may be reused by the caller
      Object.preventExtensions(schema);
      Object.preventExtensions(values);
      Object.preventExtensions(options);
    }

    var propName, propertySchema, i;
    var propertiesUnion = {};

    var onPreChangeEvent = function (propName) {
      var oldVal = this.__private.previousValues[propName] = this[propName];

      this.emit(PRECHANGE_EVENT, propName, oldVal, this);
      this.emit(PRECHANGE_EVENT + ':' + propName, oldVal, this);
    };
    var onChangeEvent = function (propName) {
      var oldVal = this.__private.previousValues[propName];
      var newVal = this[propName];

      // If the value change did not affect the public value, we don't trigger any change events
      if (newVal === oldVal) { return; }

      this.emit(CHANGE_EVENT, propName, newVal, oldVal, this);
      this.emit(CHANGE_EVENT + ':' + propName, newVal, oldVal, this);
    };

    for (propName in schema) {
      propertySchema = schema[propName] = schema[propName] || {};

      if (!propertySchema.dependencies) { continue; }

      for (i = 0; i < propertySchema.dependencies.length; ++i) {
        var dependencyPropName = propertySchema.dependencies[i];
        this.listenTo(this, PRECHANGE_EVENT + ':' + dependencyPropName, onPreChangeEvent.bind(this, propName));
        this.listenTo(this, CHANGE_EVENT + ':' + dependencyPropName, onChangeEvent.bind(this, propName));
      }
    }

    var props = {};
    for (propName in schema) {
      propertySchema = schema[propName];
      typeof propertySchema === 'string' && (propertySchema = schema[propName] = { type: propertySchema });

      props[propName] = {
        enumerable: true,
        get: propertySchema.getter === false ? undefined : makeGetter(propName, propertySchema),
        set: propertySchema.setter === false ? undefined : makeSetter(propName, propertySchema),
      };

      propertiesUnion[propName] = propertySchema.defaultValue;
    }
    Object.defineProperties(this, props);

    options.allowExtensions || Object.preventExtensions(this);

    for (propName in values) {
      if (RUNTIME_CHECKS && !schema.hasOwnProperty(propName)) {
        throw 'Cannot assign undeclared property ' + propName;
      }
      propertiesUnion[propName] = values[propName];
    }

    // Silently assign initial values
    for (propName in propertiesUnion) {
      var val = propertiesUnion[propName];
      schema[propName].setter && (val = schema[propName].setter.call(this, val));
      RUNTIME_CHECKS && validateInput(val, propName, schema[propName]);
      this.__private.values[propName] = val;
    }
  }

  // toJSON() actually returns an object, which is a bit misleading. For compatibility reasons.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON_behavior
  Record.prototype.toJSON = function toJSON() {
    return JSON.parse(this.toJSONString());
  };

  Record.prototype.toJSONString = Record.prototype.toString = function toString() {
    var keys = Object.keys(this);
    var obj = {};
    for (var i = 0; i < keys.length; ++i) {
      var propName = keys[i];
      obj[propName] = this[propName];
    }
    return JSON.stringify(obj);
  };

  Record.prototype.bindSchema = function bindSchema(schema) {
    return Record.bind(null, schema);
  };

  extend(Record.prototype, eventEmitter);
  extend(Record.prototype, eventListener);

  return Record;

});
