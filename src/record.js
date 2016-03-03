/* global RUNTIME_CHECKS, define */
(function () {
	'use strict';

	/**
	 * A [Record](https://en.wikipedia.org/wiki/Record_(computer_science) is the basic entity of the data layer. In difference to regular JS objects, it has a predefined set of properties. The properties are specified by "subclassing" the abstract Record constructor by calling `Record.withProperties(...)` and providing a properties schema. For more details, see {@link module:bff/record#withProperties}.
	 *
	 * The major advantages of using a predefined (i.e. known and finite) set of properties are:
	 * * Each property gets a custom setter, that emits a change event whenever the property value changes. The setter can also do types checks on the assigned value (which it does in dev. mode).
	 * * The record instances can be locked using Object.preventExtensions, with the nice effect that trying to assign a value to an undeclared property will throw an error.
	 *
	 * @exports bff/record
	 */
	function moduleFactory(extend, eventEmitter, eventListener) {

		var PRECHANGE_EVENT = 'prechange';
		var CHANGE_EVENT = 'change';

		function validateInput(val, propName, propSchema) {
			var type = typeof val;
			if ('type' in propSchema && propSchema.type.indexOf(type) === -1) {
				throw 'Property ' + propName + ' is of type ' + propSchema.type + ' and can not be assigned a value of type ' + type;
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

		/**
		 * Creates a new Record (subclass) with an optional set of initial values.
		 * @alias module:bff/record
		 * @constructor
		 * @mixes bff/event-emitter
		 * @mixes bff/event-listener
		 * @arg {Object|module:bff/record} [values] - An object containing initial values for the Record to be created.
		 */
		function Record(values) {
			if (RUNTIME_CHECKS && values !== undefined && typeof values !== 'object') {
				throw '"values" argument must be an object';
			}

			if (!this.__private) {
				throw 'Record is an abstract class, meant to be "subclassed" using Record.withProperties(schema)';
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

		/**
		 * Returns a newly created Object containing the Records's deep copied properties. The fact that this function returns an Object and not a strin is a bit misleading, but this naming convension is used for conformity reasons, see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON_behavior}
		 * @returns {Object}
		 */
		Record.prototype.toJSON = function () {
			var jsonObj = {};
			for (var propName in this.__private.values) {
				var val = this[propName];
				jsonObj[propName] = val instanceof Object ?
						(val.toJSON ? val.toJSON() : JSON.parse(JSON.stringify(val))) : val;
			}
			return jsonObj;
		};

		/**
		 * @returns {string} A human readable string representation of the Record.
		 */
		Record.prototype.toString = function () {
			return JSON.stringify(this, undefined, 2);
		};

		extend(Record.prototype, eventEmitter);
		extend(Record.prototype, eventListener);

		/**
		 * Creates a new Record constructor function, that will create Record instances with the property schema provided to this function. The various aspects of the property schema are described in detail below, but let's start with an example.
		 * ```javascript
		 * var Person = Record.withProperties({
		 *   firstName: 'string',
		 *   lastName: 'string',
		 *   fullName: {
		 *     setter: false,
		 *     getter: function () { return this.firstName + ' ' + this.lastName; },
		 *     dependencies: [ 'firstName', 'lastName' ],
		 *   },
		 *   age: {
		 *     type: [ 'number', undefined ],
		 *     defaultValue: 0,
		 *   },
		 *   someData: {},
		 * })
		 * ```
		 * Here we see a schema with five properties. The first two (_firstName_ and _lastName_) use a shorthand syntax to declare string properties. The _fullName_ property is a calculated property that depends on _firstName_ and _lastName_. The _age_ property is either a number or undefined (properties can't be undefined by default), with a default value of 0. Finally, the _someData_ property can be of any type.
		 * @func
		 * @static
		 * @arg {Object} schema - An object describing the properties that will be part of all new instances created by the returned constructor function. Each key/value pair describes a single property. Property descriptor objects can have the following properties:
		 * * _type_: A string or array of strings specifying the type of the property. If omitted, no type checking will be performed, otherwise types are checked by applying the typeof operator to the assigned value and then checking to see if the returned type string is part of the schema types.
		 * * _defaultValue_: An initial value that will be assigned to all new instances of this property upon creation.
		 * * _setter_: A function that will be called to transform the assigned value before it is stored on the property. Shouldn't have any side effects, as it might be called internally to determine when events should be triggered.
		 * * _getter_: A function that will be run to transform the read value before it is returned. Shouldn't have any side effects, as it might be called internally to determine when events should be triggered.
		 *
		 * All schema descriptor properties are optional. An empty schema descriptor can be replaced with any falsy value for the same effect, which means that:
		 * `someData: {}`, `someData: undefined`, `someData: null` and `someData: false` all declares a property named someData, which can hold any type of data.
		 *
		 * There is also a shorthand syntax for specifying typed properties, because it is such a common use case, e.g.:
		 * `aProp: 'string'` is equal to `aProp: { type: 'string' }` and e.g.
		 * `aProp: [ 'string', 'undefined' ]` is equal to `aProp: { type: [ 'string', 'undefined' ] }`
		 *
		 * @returns {function} New constructor function based on the provided schema.
		 */
		Record.withProperties = function (schema, dontPreventExtensions) {
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

				if (typeof propSchema === 'string' || propSchema instanceof Array) {
					propSchema = schema[propName] = { type: propSchema };
				}

				if ('type' in propSchema && !(propSchema.type instanceof Array)) {
					propSchema.type = [ propSchema.type ];
				}

				if (RUNTIME_CHECKS && propSchema.type) {
					for (var i = 0, n = propSchema.type.length; i < n; ++i) {
						if (typeof propSchema.type[i] !== 'string') {
							throw 'All property type identifiers must be strings; ' + propName + '\'s is not';
						}
					}
				}

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
