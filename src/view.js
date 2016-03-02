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
	function moduleFactory(extend, eventListener, patch, List) {

		var HTML_PARSER_EL = document.createElement('div');

		/**
		 * Creates a new View instance.
		 * @constructor
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
				for (var selector in delegatesForEvent) {
					if (!el.matches(selector)) { continue; } // TODO: IE9 support (msMatchesSelector)
					var delegatesForEventAndSelector = delegatesForEvent[selector];
					for (var i = 0, n = delegatesForEventAndSelector.length; i < n; ++i) {
						//console.log(ev.type, selector, ev.target);
						delegatesForEventAndSelector[i](ev);
					}
				}
			};

			this.__private.childViews = new List();
			this.listenTo(this.__private.childViews, 'item:removed', function (childView) { childView.destroy(); });
		}

		extend(View.prototype, eventListener);

		extend(View.prototype, {

			/**
			 * @instance
			 * Destroys a view instance by removing its children, stop listening to all events and finally removing itself from the DOM.
			 */
			destroy: function destroy() {
				this.removeChildren();
				this.stopListening();
				this.el && this.el.parentNode && this.el.parentNode.removeChild(this.el);
			},

			/**
			 * Creates a subclass constructor function, that will create view instances with the properties (typically functions) provded to this function.
			 * TODO: move this to View.makeSubclass
			 * @instance
			 * @arg {object} properties - The properties with which the View subclass' prototype will be extended.
			 * @returns {function}
			 */
			makeSubclass: function makeSubclass(properties) {
				if (RUNTIME_CHECKS && typeof properties !== 'object') {
					throw '"properties" argument must be an object';
				}

				var superclass = this;
				var customConstructor = properties.constructor;

				var Constructor = function SubClassConstructor() {
					superclass.constructor.apply(this, arguments);
					customConstructor && customConstructor.apply(this, arguments);
				};
				delete properties.constructor;

				Constructor.prototype = Object.create(this);
				properties && extend(Constructor.prototype, properties);
				Constructor.prototype.constructor = Constructor;

				return Constructor;
			},

			/**
			 * Creates a DOM representation of the view, based on the HTML string returned by the getHtml() function and then assigns it to the view's `el` property. If the view already has an `el`, it will be patched instead of replaced, so that delegated event listeners will be preserved.
			 * @instance
			 * @arg {Object} [patchOptions] - Options object forwarded to the `patch()` function, in case it is called.
			 */
			render: function render(patchOptions) {
				if (RUNTIME_CHECKS) {
					if (!this.getHtml) {
						throw 'You must implement getHtml() in order to use render()';
					}
					if (arguments.length > 1 && typeof patchOptions !== 'object') {
						throw '"patchOptions" argument must be an object';
					}
				}

				var newEl = this.parseHtml(this.getHtml());
				this.doPatch || newEl.setAttribute('patch-ignore', '');

				if (this.el) {
					patch(this.el, newEl, patchOptions);
				} else {
					this.el = newEl;
				}
			},

			/**
			 * @instance
			 * Requests an animation frame, in which `render()` is called. Can be called several times during a tick witout any performance penalty.
			 */
			requestRender: function requestRender() {
				if (this.__private.isRenderRequested) { return; }
				this.__private.isRenderRequested = true;

				var self = this;
				requestAnimationFrame(function () {
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
			parseHtml: function parseHtml(htmlString, returnAll) {
				if (RUNTIME_CHECKS) {
					if (typeof htmlString !== 'string') {
						throw '"htmlString" argument must be a string';
					}
					if (arguments.length > 1 && typeof returnAll !== 'boolean') {
						throw '"returnAll" argument must be a boolean value';
					}
				}

				HTML_PARSER_EL.innerHTML = htmlString;
				return returnAll ? HTML_PARSER_EL.childNodes : HTML_PARSER_EL.firstChild;
			},

			/**
			 * Scoped query selector, that only queries this view's DOM subtree.
			 * @instance
			 * @arg {string} queryString - CSS selector string
			 */
			$: function $(queryString) {
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
			forceRepaint: function forceRepaint(el) {
				if (RUNTIME_CHECKS && arguments.length > 0 && !(el instanceof HTMLElement)) {
					throw '"el" argument must be an HTMLElement';
				}
				return (el || this.el).offsetHeight;
			},

			/**
			 * Adds another view as a child to the view. A child view will be automatically added to this view's root element and destroyed whenever its parent view is destroyed.
			 * @instance
			 * @arg {module:bff/view} childView - The view that will be added to the list of this view's children.
			 * @arg {HTMLElement} [optional] - An element to which the child view's root element will be appended. If not specified, it will be appended to this view's root element.
			 */
			addChild: function addChild(childView, el) {
				if (RUNTIME_CHECKS) {
					if (!(childView instanceof View)) {
						throw '"childView" argument must be a BFF View';
					}
					if (arguments.length > 1 && !(el instanceof HTMLElement)) {
						throw '"el" argument must be an HTMLElement';
					}
				}

				this.__private.childViews.push(childView);
				el = el || this.el;
				el && el.appendChild(childView.el);
				return childView;
			},

			/**
			 * Removes a specified view from this view's list of child views and destroy the view.
			 * @instance
			 * @arg {module:bff/view} childView - The view to remove.
			 */
			removeChild: function removeChild(childView) {
				if (RUNTIME_CHECKS && !(childView instanceof View)) {
					throw '"childView" argument must be a BFF View';
				}

				this.__private.childViews.remove(childView);
				return childView;
			},

			/**
			 * Removes a specified view from this view's list of child views and destroy the view.
			 * @instance
			 * @arg {module:bff/view} childView - The view to remove.
			 */
			removeChildren: function removeChildren() {
				this.__private.childViews.clear();
			},

			// Based on https://github.com/ftlabs/ftdomdelegate/blob/master/lib/delegate.js
			listenTo: function listenTo(selectorStr, eventName, callback, context, useCapture) {

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
				var firstTimeListeningToEvent = false;
				if (!delegatesForEvent) {
					delegatesForEvent = (delegates[eventName] = {});
					firstTimeListeningToEvent = true;
					useCapture = useCapture || eventName === 'blur' || eventName === 'focus';
					eventListener.listenTo.call(this, this.el, eventName, this.__private.onDelegatedEvent, undefined, useCapture);
				}
				delegatesForEvent[selectorStr] = delegatesForEvent[selectorStr] || [];
				delegatesForEvent[selectorStr].push(callback.bind(context || this));
			},

			stopListening: function stopListening(selectorStr, eventName) {
				if (typeof selectorStr !== 'string') {
					eventListener.stopListening.apply(this, arguments);
					return;
				}

				if (RUNTIME_CHECKS && arguments.length > 1 && typeof eventName !== 'string') {
					throw '"eventName" argument must be a string';
				}

				var delegatesForEvent = this.__private.eventDelegates[eventName];
				if (!delegatesForEvent) { return; }

				delete delegatesForEvent[selectorStr];
				if (Object.keys(delegatesForEvent).length === 0) {
					delete this.__private.eventDelegates[eventName];
					eventListener.stopListening.call(this, this.el, eventName);
				}
			},

		}, 'useSource');

		return View;

	}

	// Expose, based on environment
	if (typeof define === 'function' && define.amd) { // AMD
		define([ './extend', './event-listener', './patch-dom', './list' ], moduleFactory);
	} else if (typeof exports === 'object') { // Node, CommonJS-like
		module.exports = moduleFactory(
				require('./extend'), require('./event-listener'), require('./patch-dom'), require('./list'));
	} else { // Browser globals
		var bff = window.bff = window.bff || {};
		bff.View = moduleFactory(bff.extend, bff.eventListener, bff.patchDom, bff.List);
	}

}());
