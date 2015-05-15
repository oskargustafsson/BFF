define([
  './mixin',
  './event-emitter',
  './event-listener',
], function (
  mixin,
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
    var MY_PRECHANGE_EVENT = 'prechange:' + propName;
    var MY_CHANGE_EVENT = 'change:' + propName;

    // TODO: make two different setter functions (in outer scope) and select (+bind)
    // one of the depending of whether the propery has any dependers
    return function setter(canonicalVal) {
      // If there is a custom setter, use it to transform the value
      propSchema.setter && (canonicalVal = propSchema.setter.call(this, canonicalVal));

      // Input validation
      validateInput(canonicalVal, propName, propSchema);

      // Do a "dry-run" to test if the value would actually change
      var oldVal = this[propName];
      var oldCanonicalVal = this.__private.values[propName];
      this.__private.values[propName] = canonicalVal;

      // If the value change did not affect the public value, we don't trigger any events
      if (this[propName] === oldVal) { return; }

      // Switch the value back and do things for real
      this.__private.values[propName] = oldCanonicalVal;

      this.emit(PRECHANGE_EVENT, [ propName, oldVal, propName, canonicalVal, this ]);
      this.emit(MY_PRECHANGE_EVENT, [ oldVal, propName, canonicalVal, this ]);

      this.__private.values[propName] = canonicalVal;

      var newVal = this[propName];
      this.emit(CHANGE_EVENT, [ propName, newVal, oldVal, this ]);
      this.emit(MY_CHANGE_EVENT, [ newVal, oldVal, this ]);
    };
  }

  function makeGetter(propName, propSchema) {
    return propSchema.getter ?
        function getter() { return propSchema.getter.call(this, this.__private.values[propName]); } :
        function getter() { return this.__private.values[propName]; };
  }

  var triggerDependerPrechangeEvents = function (dependerPropNames, currentVal, triggeringPropName, canonicalVal) {
    for (var i = 0; i < dependerPropNames.length; ++i) {
      var propName = dependerPropNames[i];
      // Do a "dry-run" to test if the value would actually change
      var oldVal = this.__private.previousValues[propName] = this[propName];

      var oldCanonicalTriggeringPropVal = this.__private.values[triggeringPropName];
      this.__private.values[triggeringPropName] = canonicalVal;

      // If the value change did not affect the depender's public value, we don't trigger any events
      var noChange = this[propName] === oldVal;

      this.__private.values[triggeringPropName] = oldCanonicalTriggeringPropVal;

      if (noChange) { continue; }

      this.emit(PRECHANGE_EVENT, [ propName, oldVal, triggeringPropName, canonicalVal, this ]);
      this.emit(PRECHANGE_EVENT + ':' + propName, [ oldVal, triggeringPropName, canonicalVal, this ]); // TODO: optimize
    }
  };

  var triggerDependerChangeEvents = function (dependerPropNames) {
    for (var i = 0; i < dependerPropNames.length; ++i) {
      var propName = dependerPropNames[i];
      var prevValue = this.__private.previousValues[propName];
      var value = this[propName];

      if (value === prevValue) { continue; }

      this.emit(CHANGE_EVENT, [ propName, value, prevValue, this ]);
      this.emit(CHANGE_EVENT + ':' + propName, [ value, prevValue, this ]); // TODO: optimize
    }
  };

  function Record(schema, values) {
    Object.defineProperty(this, '__private', { writable: true, value: {}, });
    this.__private.values = {};
    this.__private.previousValues = {};

    values = values || {};
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

      if (propertySchema.dependers) {
        this.listenTo(this, 'prechange:' + property,
            triggerDependerPrechangeEvents.bind(this, propertySchema.dependers));
        this.listenTo(this, 'change:' + property,
            triggerDependerChangeEvents.bind(this, propertySchema.dependers));
      }

      propertiesUnion[property] = propertySchema.defaultValue;
    }

    // Disabled, for now
    // Object.preventExtensions(this);

    for (property in values) {
      if (!schema.hasOwnProperty(property)) {
        throw 'Cannot assign undeclared property ' + property;
      }
      propertiesUnion[property] = values[property];
    }

    // Silently assign initial values
    for (property in propertiesUnion) {
      var val = propertiesUnion[property];
      schema[property].setter && (val = schema[property].setter.call(this, val));
      validateInput(val, property, schema[property]);
      this.__private.values[property] = val;
    }
  }

  // toJSON() actually returns an object, which is a bit misleading. For compatibility reasons.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON_behavior
  Record.prototype.toJSON = function () {
    return JSON.parse(this.toJSONString());
  };

  Record.prototype.toJSONString = Record.prototype.toString = function () {
    var obj = {};
    for (var property in this.__private.values) {
      obj[property] = this[property];
    }
    return JSON.stringify(obj);
  };

  mixin(Record, eventEmitter);
  mixin(Record, eventListener);

  return Record;

});
