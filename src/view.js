/* global RUNTIME_CHECKS, define */
(function () {
	'use strict';

	/**
	 * Encapsulates typical MVC view functionality. Note that BFF lacks a separate controller module and it is not wrong put controller logic in BFF Views.
	 *
	 * The intended way to combine BFF Records/Lists and Views into some kind or MVC-like pattern is as follows:
	 * * Views listen to DOM events, and reacts to those by mutating data layer entities (such as models or lists of models)
	 * * Views also listen to data layer events and reacts to those, possibly by further mutating the data layer (i.e. controller logic), but most importantly by re-rendering themselves.
	 *
	 * Another way of describing the above is that the views should, besides listening to user generated events, always strive to visually represent the data layer as truthfully as possible. A powerful and simple approach to achieving this is to re-render the whole view whenever the data layer changes.
	 *
	 * The three major issues to deal with when re-rendering an entire view are:
	 * * _Loss of view state._ This is a generic problem, that thankfully has an easy solution; store all application state in the data layer. A typical way of doing this is to assign a view state model to views that are not stateless.
	 * * _Loss of event listeners_. The typical solution to this is event delegation, which is also the soliution that BFF Views provide. All event listeners are registered on the view's root element and as long as the root elements is not replaced, the event listeners will be unaffecte by a re-render.
	 * * _Visual flickering_. Replacing large chunks of the visual DOM may cause flickering. BFF Views work around this issue by using an approach similar to that of React, namely by differentially updating the DOM. This means doing an offline diff and then only updating the parts of the DOM that have actually changed.
	 * @exports bff/view
	 */
	function moduleFactory(extend, eventEmitter, eventListener, patch, List) {

		var HTML_PARSER_EL = document.createElement('div');

		var elMatchesSelector = document.body.matches ?
				function (el, selectorStr) { return el.matches(selectorStr); } :
				function (el, selectorStr) { return el.msMatchesSelector(selectorStr); };

		var myRequestAnimationFrame = window.requestAnimationFrame ?
				window.requestAnimationFrame.bind(window) :
				function (callback) { setTimeout(callback, 1000 / 60); };

		/**
		 * Creates a new View instance.
		 * @constructor
		 * @mixes module:bff/event-emitter
		 * @mixes module:bff/event-listener
		 * @alias module:bff/view
		 */
		function View() {
			Object.defineProperty(this, '__private', { writable: true, value: {}, });

			this.__private.isRenderRequested = false;

			var delegates = this.__private.eventDelegates = {};
			this.__private.onDelegatedEvent = function onDelegatedEvent(ev) {
				var delegatesForEvent = delegates[ev.type];
				var el = ev.target;
				for (var selectorStr in delegatesForEvent) {
					if (!elMatchesSelector(el, selectorStr)) { continue; }
					var delegatesForEventAndSelector = delegatesForEvent[selectorStr];
					for (var i = 0, n = delegatesForEventAndSelector.length; i < n; ++i) {
						delegatesForEventAndSelector[i](ev);
					}
				}
			};

			/**
			 * The root DOM element of the view. The default implementation of {@link module:bff/view#render} assigns to and updates this element. Delegated event listeners, created by calling {@link module:bff/view#listenTo} are attached to this element.
			 * Replacing the current element with another will clear all currently delegated event listeners - it is usually a better approach update the element (using e.g. {@link module:bff/patch-dom}) instead of replacing it.
			 * @instance
			 * @member {HTMLElement|undefined} el
			 */
			Object.defineProperty(this, 'el', {
				enumerable: true,
				get: function () { return this.__private.el; },
				set: function (el) {
					this.stopListening('*');
					this.__private.el = el;
				}
			});

			this.__private.childViews = new List();
			this.listenTo(this.__private.childViews, 'item:destroyed', function (childView) {
				this.__private.childViews.remove(childView);
			});

			/**
			 * A list of this view's child views. Initially empty.
			 * @instance
			 * @member {module:bff/list} children
			 */
			Object.defineProperty(this, 'children', {
				enumerable: true,
				get: function () { return this.__private.childViews; },
			});
		}

		extend(View.prototype, eventEmitter);
		extend(View.prototype, eventListener);

		extend(View.prototype, {

			/**
			 * Destroys a view instance by removing its children, stop listening to all events and finally removing itself from the DOM.
			 * @instance
			 */
			destroy: function () {
				this.destroyChildren();
				this.stopListening();
				this.el && this.el.parentNode && this.el.parentNode.removeChild(this.el);
				this.emit('destroyed', this);
			},

			/**
			 * Returns an HTML string representation of the view in its current state. Its is used by the default implementation of `render()`, where its return value is parsed and becomes the view's DOM representation.
			 * @instance
			 */
			getHtml: function () {
				return this.template ? this.template(this) : '';
			},

			/**
			 * Creates a DOM element representation of the view, based on the HTML string returned by the getHtml() function and then assigns it to the view's `el` property. If the view already has an `el`, it will be patched instead of replaced, so that delegated event listeners will be preserved.
			 * @instance
			 * @arg {Object} [patchOptions] - Options object forwarded to the `patch()` function, in case it is called.
			 */
			render: function (patchOptions) {
				if (RUNTIME_CHECKS) {
					if (arguments.length >= 1 && typeof patchOptions !== 'object') {
						throw '"patchOptions" argument must be an object';
					}
				}

				var htmlStr = this.getHtml();
				if (!htmlStr) {
					return;
				}

				var newEl = this.parseHtml(htmlStr);
				this.doPatch || newEl.setAttribute('patch-ignore', '');

				if (this.el) {
					patch(this.el, newEl, patchOptions);
				} else {
					this.el = newEl;
				}
			},

			/**
			 * Requests an animation frame, in which `render()` is called. Can be called several times during a tick witout any performance penalty.
			 * @instance
			 */
			requestRender: function () {
				if (this.__private.isRenderRequested) { return; }
				this.__private.isRenderRequested = true;

				var self = this;
				myRequestAnimationFrame(function () {
					self.__private.isRenderRequested = false;
					self.render();
				});
			},

			/**
			 * Helper function that parses an HTML string into an HTMLElement hierarchy and returns the first element in the NodeList, unless the returnAll flag is true, in which case the whole node list is returned.
			 * @instance
			 * @arg {string} htmlString - The string to be parsed
			 * @arg {boolean} returnAll - If true will return all top level elements
			 */
			parseHtml: function (htmlString, returnAll) {
				if (RUNTIME_CHECKS) {
					if (typeof htmlString !== 'string') {
						throw '"htmlString" argument must be a string';
					}
					if (arguments.length > 1 && typeof returnAll !== 'boolean') {
						throw '"returnAll" argument must be a boolean value';
					}
				}

				HTML_PARSER_EL.innerHTML = htmlString;

				if (RUNTIME_CHECKS && !returnAll && HTML_PARSER_EL.children.length > 1) {
					throw 'The parsed HTML contains more than one root element.' +
						'Specify returnAll = true to return all of them';
				}

				var ret = returnAll ? HTML_PARSER_EL.children : HTML_PARSER_EL.firstChild;
				while (HTML_PARSER_EL.firstChild) {
					HTML_PARSER_EL.removeChild(HTML_PARSER_EL.firstChild);
				}
				return ret;
			},

			/**
			 * Scoped query selector, that only queries this view's DOM subtree.
			 * @instance
			 * @arg {string} queryString - CSS selector string
			 */
			$: function (queryString) {
				if (RUNTIME_CHECKS && typeof queryString !== 'string') {
					throw '"queryString" argument must be a string';
				}

				return this.el.querySelector(queryString);
			},

			/**
			 * Helper function that forces the view's root element to be repainted. Useful when re-triggering CSS animations.
			 * @instance
			 * @arg {HTMLElement} [el] Element that will be forced to repaint. If not specified, will default to the view's root element.
			 * @returns {number} Useless/arbitrary value, but the function needs to return it to prevent browser JS optimizations from interfering with the forced repaint.
			 */
			forceRepaint: function (el) {
				if (RUNTIME_CHECKS && arguments.length > 0 && !(el instanceof HTMLElement)) {
					throw '"el" argument must be an HTMLElement';
				}
				return (el || this.el).offsetHeight;
			},

			/**
			 * Adds another view as a child to the view. A child view will be automatically added to this view's root element and destroyed whenever its parent view is destroyed.
			 * @instance
			 * @arg {module:bff/view} childView - The view that will be added to the list of this view's children.
			 * @arg {HTMLElement|boolean} [optional] - An element to which the child view's root element will be appended. If not specified, it will be appended to this view's root element. Can also be `false`, in which case the child view will not be appended to anything.
			 */
			addChild: function (childView, el) {
				if (RUNTIME_CHECKS) {
					if (!(childView instanceof View)) {
						throw '"childView" argument must be a BFF View';
					}
					if (arguments.length > 1 && !(el === false || el instanceof HTMLElement)) {
						throw '"el" argument must be an HTMLElement or the boolean value false';
					}
				}

				this.__private.childViews.push(childView);
				el !== false && (el || this.el).appendChild(childView.el);
				return childView;
			},

			/**
			 * Destroy all child views of this view.
			 * @instance
			 */
			destroyChildren: function () {
				// Iterate backwards because the list might shrink while being iterated
				for (var i = this.__private.childViews.length - 1; i >= 0; --i) {
					this.__private.childViews[i].destroy();
				}
			},

			/**
			 * Augments {@link bff/event-listener#listenTo} with functionality for listening to delegated DOM events, by specifying a CSS selector string instead of an event emitter. The actual listener will implicitly be registered on this view's root element. Not the the "mouseenter" and "mouseleave" events does not bubble, so they might not behave as expected - "mouseover" and "mouseout" events on the other hand do bubble.
			 * @instance
			 * @arg {string|Object|Array|NodeList} selectorStr - The CSS selector string that will be used to filter all events bubbling up to the listener. If anything other than a string passed, the original listenTo implementation will be used.
			 * @arg {string|Array} eventName - One or more string identifiers for events that will be listented to.
			 * @arg {function} callback - The function that will be called when the event is emitted.
			 * @arg {any} [context] - The context with which the callback will be called (i.e. what "this" will be).
			 *     Will default to the caller of .listenTo, if not provided.
			 */
			listenTo: function (selectorStr, eventName, callback, context, useCapture) {
				if (typeof selectorStr !== 'string') {
					eventListener.listenTo.apply(this, arguments);
					return;
				}

				if (eventName instanceof Array && eventName.length > 0) {
					this.listenTo(selectorStr, eventName.pop(), callback, context, useCapture);
					this.listenTo(selectorStr, eventName, callback, context, useCapture);
					return;
				}

				if (RUNTIME_CHECKS) {
					if (typeof eventName !== 'string') {
						throw '"eventName" argument must be a string';
					}
					if (typeof callback !== 'function') {
						throw '"callback" argument must be a function';
					}
					if (arguments.length > 4 && typeof useCapture !== 'boolean') {
						throw '"useCapture" argument must be a boolean value';
					}
				}

				var delegates = this.__private.eventDelegates;
				var delegatesForEvent = delegates[eventName];
				if (!delegatesForEvent) {
					delegatesForEvent = (delegates[eventName] = {});
					useCapture = useCapture || eventName === 'blur' || eventName === 'focus';
					eventListener.listenTo.call(this, this.el, eventName, this.__private.onDelegatedEvent, undefined, useCapture);
				}
				delegatesForEvent[selectorStr] = delegatesForEvent[selectorStr] || [];
				delegatesForEvent[selectorStr].push(callback.bind(context || this));
			},

			/**
			 * Augments {@link bff/event-listener#stopListening} with functionality for stop listening to delegated DOM events.
			 * @instance
			 * @arg {string|Object} [selectorStr] - If provided, only delegated event callbacks for the given selector string will be removed. The special wildcard value `*` means _any_ selector. If anything other than a string passed, the original stopListening implementation will be used.
			 * @arg {string} [eventName] - If provided, only callbacks attached to the given event name will be removed.
			 */
			stopListening: function (selectorStr, eventName) {
				if (typeof selectorStr !== 'string') {
					eventListener.stopListening.apply(this, arguments);
					if (selectorStr !== undefined) { return; }
				}

				if (RUNTIME_CHECKS && arguments.length > 1 && typeof eventName !== 'string') {
					throw '"eventName" argument must be a string';
				}

				var eventDelegates = this.__private.eventDelegates;
				// No event name means all event names
				var eventNames = eventName !== undefined ? [ eventName ] : Object.keys(eventDelegates);

				for (var i = 0, n = eventNames.length; i < n; ++i) {
					eventName = eventNames[i];

					var delegatesForEvent = eventDelegates[eventName];
					if (!delegatesForEvent) { continue; }

					if (selectorStr && selectorStr !== '*') {
						delete delegatesForEvent[selectorStr];
					} else {
						// If no selector string has been specified, remove all event delegates for the event name
						eventDelegates[eventName] = {};
					}

					if (Object.keys(eventDelegates[eventName]).length === 0) {
						delete this.__private.eventDelegates[eventName];
						eventListener.stopListening.call(this, this.el, eventName);
					}
				}
			},

			/**
			 * @instance
			 * @returns {string} A human readable representation of the View, containing valuable debugging information.
			 */
			toString: function () {
				return JSON.stringify({
					'element': this.el && {
						type: '<' + this.el.nodeName + '>',
						children: this.el.childNodes.length,
					},
					'child views': this.__private.childViews.length,
					'event listeners': Object.keys(this.__private.listeningTo),
					'delegated events': Object.keys(this.__private.eventDelegates),
				}, undefined, 2);
			},

		}, 'useSource');

		/**
		 * Creates a subclass constructor function, that will create view instances with the properties (typically functions) provded to this function.
		 * @static
		 * @arg {Object} properties - The properties with which the View subclass' prototype will be extended.
		 * @returns {function}
		 */
		View.makeSubclass = function (properties) {
			if (RUNTIME_CHECKS && typeof properties !== 'object') {
				throw '"properties" argument must be an object';
			}

			var customConstructor = properties.constructor;

			var Constructor = function () {
				View.apply(this, arguments);
				customConstructor && customConstructor.apply(this, arguments);
			};
			delete properties.constructor;

			Constructor.prototype = Object.create(View.prototype);
			properties && extend(Constructor.prototype, properties);
			Constructor.prototype.constructor = Constructor;

			return Constructor;
		};

		return View;

	}

	// Expose, based on environment
	if (typeof define === 'function' && define.amd) { // AMD
		define([ './extend', './event-emitter', './event-listener', './patch-dom', './list' ], moduleFactory);
	} else if (typeof exports === 'object') { // Node, CommonJS-like
		module.exports = moduleFactory(require('./extend'), require('./event-emitter'), require('./event-listener'),
				require('./patch-dom'), require('./list'));
	} else { // Browser globals
		var bff = window.bff = window.bff || {};
		bff.View = moduleFactory(bff.extend, bff.eventEmitter, bff.eventListener, bff.patchDom, bff.List);
	}

}());
