/* global RUNTIME_CHECKS, define */
(function () {
	'use strict';

	function moduleFactory(extend, eventEmitter, eventListener) {

		var PRECHANGE_EVENT = 'prechange';
		var CHANGE_EVENT = 'change';

		function validateInput(val, propName, propSchema) {
			var type = typeof val;
			if (propSchema.type && type !== propSchema.type &&
					(!propSchema.allowedValues || propSchema.allowedValues.indexOf(val) === -1)) {
				throw 'Property ' + propName + ' is of type ' + propSchema.type + ' and can not be assigned a value of type ' +
						type + '. You can add an "allowedValues" array to the schema to allow specific values';
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

				var oldVal = this[propName];

				this.emit(PRECHANGE_EVENT, propName, oldVal, this);
				this.emit(MY_PRECHANGE_EVENT, oldVal, this);

				this.__private.values[propName] = val;

				// If the value change did not affect the public value, we don't trigger any change events
				if (this[propName] === oldVal) { return; }

				var newVal = this[propName];
				this.emit(CHANGE_EVENT, propName, newVal, oldVal, this);
				this.emit(MY_CHANGE_EVENT, newVal, oldVal, this);

				// Input validation, after setters and getters has been applied
				RUNTIME_CHECKS && validateInput(newVal, propName, propSchema);
			};
		}

		function makeGetter(propName, propSchema) {
			return propSchema.getter ?
					function getter() { return propSchema.getter.call(this, this.__private.values[propName]); } :
					function getter() { return this.__private.values[propName]; };
		}

		function Record(values) {
			if (RUNTIME_CHECKS && values !== undefined && typeof values !== 'object') {
				throw '"values" argument must be an object';
			}

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
				if (RUNTIME_CHECKS && !schema.hasOwnProperty(propName)) {
					throw 'Cannot assign undeclared property ' + propName;
				}
				propsUnion[propName] = values[propName];
			}
			// Silently assign initial values
			for (propName in propsUnion) {
				var val = propsUnion[propName];
				schema[propName].setter && (val = schema[propName].setter.call(this, val));
				this.__private.values[propName] = val;
				RUNTIME_CHECKS && validateInput(this[propName], propName, schema[propName]);
			}

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
				var propSchema = schema[propName];

				if (!propSchema.dependencies) { continue; }

				for (var i = 0; i < propSchema.dependencies.length; ++i) {
					var dependencyPropName = propSchema.dependencies[i];
					this.listenTo(this, PRECHANGE_EVENT + ':' + dependencyPropName, onPreChangeEvent.bind(this, propName));
					this.listenTo(this, CHANGE_EVENT + ':' + dependencyPropName, onChangeEvent.bind(this, propName));
				}
			}
		}

		// toJSON() actually returns an object, which is a bit misleading. For compatibility reasons.
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON_behavior
		Record.prototype.toJSON = function toJSON() {
			var jsonObj = {};
			for (var propName in this.__private.values) {
				var val = this[propName];
				jsonObj[propName] = val instanceof Object ?
						(val.toJSON ? val.toJSON() : JSON.parse(JSON.stringify(val))) : val;
			}
			return jsonObj;
		};

		// Override, to get nicer prints
		Record.prototype.toString = function toString() {
			return JSON.stringify(this);
		};

		extend(Record.prototype, eventEmitter);
		extend(Record.prototype, eventListener);

		Record.withProperties = function withProperties(schema, dontPreventExtensions) {
			if (RUNTIME_CHECKS) {
				if (typeof schema !== 'object') {
					throw '"schema" argument must be an object';
				}
				if (arguments.length > 1 && typeof dontPreventExtensions !== 'boolean') {
					throw '"dontPreventExtensions" must be a boolean value';
				}
			}

			var RecordSubclass = function RecordSubclass(values) {
				this.__private || Object.defineProperty(this, '__private', { writable: true, value: {}, });
				this.__private.schema = schema;
				Record.call(this, values);
				dontPreventExtensions || Object.preventExtensions(this);
			};

			RecordSubclass.prototype = Object.create(Record.prototype);
			RecordSubclass.prototype.constructor = RecordSubclass;

			var props = {};
			for (var propName in schema) {
				var propSchema = schema[propName] = schema[propName] || {};

				typeof propSchema === 'string' && (propSchema = schema[propName] = { type: propSchema });

				props[propName] = {
					enumerable: true,
					get: propSchema.getter === false ? undefined : makeGetter(propName, propSchema),
					set: propSchema.setter === false ? undefined : makeSetter(propName, propSchema),
				};
			}
			Object.defineProperties(RecordSubclass.prototype, props);
			return RecordSubclass;
		};

		return Record;

	}

	// Expose, based on environment
	if (typeof define === 'function' && define.amd) { // AMD
		define([ './extend', './event-emitter', './event-listener' ], moduleFactory);
	} else if (typeof exports === 'object') { // Node, CommonJS-like
		module.exports = moduleFactory(require('./extend'), require('./event-emitter'), require('./event-listener'));
	} else { // Browser globals
		var bff = window.bff = window.bff || {};
		bff.Record = moduleFactory(bff.extend, bff.eventEmitter, bff.eventListener);
	}

}());
