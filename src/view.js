define([
  './extend',
  './event-listener',
  './dom-patcher',
  './list',
], function (
  extend,
  eventListener,
  patch,
  List
) {
  'use strict';

  var HTML_PARSER_EL = document.createElement('div');

  function View() {
    Object.defineProperty(this, '__private', { writable: true, value: {}, });

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

    this.children = new List();
    this.listenTo(this.children, 'item:removed', this.onChildRemoved);
  }

  extend(View.prototype, eventListener);

  extend(View.prototype, {

    destroy: function destroy() {
      this.removeChildren();
      this.stopListening();
      this.el && this.el.parentNode && this.el.parentNode.removeChild(this.el);
    },

    makeSubclass: function makeSubclass(properties) {
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

    render: function render(patchOptions) {
      if (RUNTIME_CHECKS && !this.getHtml) { throw 'You must implement getHtml() in order to use render()'; }

      var newEl = this.parseHtml(this.getHtml());
      if (this.el) {
        patch(this.el, newEl, patchOptions);
      } else {
        this.el = newEl;
      }
    },

    parseHtml: function parseHtml(htmlString, returnAll) {
      HTML_PARSER_EL.innerHTML = htmlString;
      return returnAll ? HTML_PARSER_EL.children : HTML_PARSER_EL.firstChild;
    },

    $: function $(queryString) {
      return this.el.querySelector(queryString);
    },

    forceRepaint: function forceRepaint(el) {
      return (el || this.el).offsetHeight;
    },

    addChild: function addChild(childView, el) {
      this.children.push(childView);
      el = el || this.el;
      el && el.appendChild(childView.el);
      return childView;
    },

    removeChild: function removeChild(childView) {
      this.children.remove(childView);
      return childView;
    },

    removeChildren: function removeChildren() {
      this.children.clear();
    },

    onChildRemoved: function onChildRemoved(childView) {
      childView.destroy();
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

});
