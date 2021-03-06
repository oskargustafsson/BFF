!function() {
  'use strict';
  function moduleFactory(extend, eventEmitter, eventListener) {
    function isPlainishObject(val) {
      return val instanceof Object && val.constructor && !Array.isArray(val) && !val.call && !val.apply;
    }
    function validateInput(val, propName, propSchema) {
      if (true && !('type' in propSchema)) {
        throw 'propSchema is missing a "type" property';
      }
      var isValueOk = false;
      for (var i = 0, n = propSchema.type.length; i < n; ++i) {
        var anOkType = propSchema.type[i];
        if (anOkType === ANY_TYPE) {
          isValueOk = true;
          break;
        } else {
          if (void 0 === anOkType) {
            if (void 0 === val) {
              isValueOk = true;
              break;
            }
          } else {
            if (null === anOkType) {
              if (null === val) {
                isValueOk = true;
                break;
              }
            } else {
              if (anOkType === String) {
                if ('string' == typeof val) {
                  isValueOk = true;
                  break;
                }
              } else {
                if (anOkType === Number) {
                  if ('number' == typeof val) {
                    isValueOk = true;
                    break;
                  }
                } else {
                  if (anOkType === Boolean) {
                    if ('boolean' == typeof val) {
                      isValueOk = true;
                      break;
                    }
                  } else {
                    if (anOkType === Symbol) {
                      if ('symbol' == typeof val) {
                        isValueOk = true;
                        break;
                      }
                    } else {
                      if (val instanceof anOkType) {
                        isValueOk = true;
                        break;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (!isValueOk) {
        var typeNames = propSchema.type.map(function(aType) {
          return aType instanceof Function ? aType.name : typeof aType;
        });
        throw 'Property ' + propName + ' must be of type [' + typeNames.join(', ') + '], it can not be assigned a value of type ' + typeof val;
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
      if (true) {
        if (void 0 !== values && 'object' != typeof values) {
          throw '"values" argument must be an object';
        }
        if (!this.__private) {
          throw 'Record is an abstract class, meant to be "subclassed" using Record.withProperties(schema)';
        }
      }
      this.__private.values = {};
      this.__private.previousValues = {};
      var schema = this.__private.schema;
      var propsUnion = {};
      var propSchema, i;
      for (var propName in schema) {
        propSchema = schema[propName];
        var defaultValue = propSchema.defaultValue;
        var propSchemaTypes = propSchema.type;
        if (defaultValue instanceof Function) {
          var canTypeBeFunction = false;
          for (i = 0; i < propSchemaTypes.length; i++) {
            if (propSchemaTypes[i] === Function) {
              canTypeBeFunction = true;
              break;
            }
          }
          if (!canTypeBeFunction) {
            defaultValue = defaultValue();
          }
        }
        propsUnion[propName] = defaultValue;
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
        propSchema = schema[propName];
        if (!propSchema.dependencies) {
          continue;
        }
        for (i = 0; i < propSchema.dependencies.length; ++i) {
          var dependencyPropName = propSchema.dependencies[i];
          this.listenTo(this, PRECHANGE_EVENT + ':' + dependencyPropName, onPreChangeEvent.bind(this, propName));
          this.listenTo(this, CHANGE_EVENT + ':' + dependencyPropName, onChangeEvent.bind(this, propName));
        }
      }
    }
    var PRECHANGE_EVENT = 'prechange';
    var CHANGE_EVENT = 'change';
    var ANY_TYPE = 'undefined' == typeof Symbol ? Object.freeze({}) : Symbol('ANY_TYPE');
    Record.prototype.toJSON = function() {
      var jsonObj = {};
      for (var propName in this.__private.values) {
        var val = this[propName];
        jsonObj[propName] = val instanceof Object ? val.toJSON ? val.toJSON() : JSON.parse(JSON.stringify(val)) : val;
      }
      return jsonObj;
    };
    Record.prototype.toString = function() {
      return JSON.stringify(this, void 0, 2);
    };
    extend(Record.prototype, eventEmitter);
    extend(Record.prototype, eventListener);
    Record.withProperties = function(schema, dontPreventExtensions) {
      if (true) {
        if ('object' != typeof schema) {
          throw '"schema" argument must be an object';
        }
        if (arguments.length > 1 && 'boolean' != typeof dontPreventExtensions) {
          throw '"dontPreventExtensions" must be a boolean value';
        }
      }
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
        if (!isPlainishObject(propSchema)) {
          propSchema = schema[propName] = {
            type: propSchema
          };
        }
        if (!('type' in propSchema)) {
          propSchema.type = [ ANY_TYPE ];
        }
        if (!(propSchema.type instanceof Array)) {
          propSchema.type = [ propSchema.type ];
        }
        if (true) {
          for (var i = 0, n = propSchema.type.length; i < n; ++i) {
            var type = propSchema.type[i];
            if (type instanceof Function || type === ANY_TYPE || null === type || void 0 === type) {
              continue;
            }
            throw 'All property type identifiers must be constructor functions, or null, or undefined - ' + propName + ' is not';
          }
        }
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