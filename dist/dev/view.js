!function() {
  'use strict';
  function moduleFactory(extend, eventListener, patch, List) {
    function View() {
      Object.defineProperty(this, '__private', {
        writable: true,
        value: {}
      });
      this.__private.isRenderRequested = false;
      var delegates = this.__private.eventDelegates = {};
      this.__private.onDelegatedEvent = function(ev) {
        var delegatesForEvent = delegates[ev.type];
        var el = ev.target;
        for (var selector in delegatesForEvent) {
          if (!el.matches(selector)) {
            continue;
          }
          var delegatesForEventAndSelector = delegatesForEvent[selector];
          for (var i = 0, n = delegatesForEventAndSelector.length; n > i; ++i) {
            delegatesForEventAndSelector[i](ev);
          }
        }
      };
      this.__private.childViews = new List();
      this.listenTo(this.__private.childViews, 'item:removed', this.onChildRemoved);
    }
    var HTML_PARSER_EL = document.createElement('div');
    extend(View.prototype, eventListener);
    extend(View.prototype, {
      destroy: function() {
        this.removeChildren();
        this.stopListening();
        this.el && this.el.parentNode && this.el.parentNode.removeChild(this.el);
      },
      makeSubclass: function(properties) {
        var superclass = this;
        var customConstructor = properties.constructor;
        var Constructor = function() {
          superclass.constructor.apply(this, arguments);
          customConstructor && customConstructor.apply(this, arguments);
        };
        delete properties.constructor;
        Constructor.prototype = Object.create(this);
        properties && extend(Constructor.prototype, properties);
        Constructor.prototype.constructor = Constructor;
        return Constructor;
      },
      render: function(patchOptions) {
        if (true && !this.getHtml) {
          throw 'You must implement getHtml() in order to use render()';
        }
        var newEl = this.parseHtml(this.getHtml());
        this.doPatch || newEl.setAttribute('patch-ignore', '');
        if (this.el) {
          patch(this.el, newEl, patchOptions);
        } else {
          this.el = newEl;
        }
      },
      requestRender: function() {
        if (this.__private.isRenderRequested) {
          return;
        }
        this.__private.isRenderRequested = true;
        var self = this;
        var renderArgs = arguments;
        requestAnimationFrame(function() {
          self.__private.isRenderRequested = false;
          self.render.apply(self, renderArgs);
        });
      },
      parseHtml: function(htmlString, returnAll) {
        HTML_PARSER_EL.innerHTML = htmlString;
        return returnAll ? HTML_PARSER_EL.childNodes : HTML_PARSER_EL.firstChild;
      },
      $: function(queryString) {
        return this.el.querySelector(queryString);
      },
      forceRepaint: function(el) {
        return (el || this.el).offsetHeight;
      },
      addChild: function(childView, el) {
        this.__private.childViews.push(childView);
        el = el || this.el;
        el && el.appendChild(childView.el);
        return childView;
      },
      removeChild: function(childView) {
        this.__private.childViews.remove(childView);
        return childView;
      },
      removeChildren: function() {
        this.__private.childViews.clear();
      },
      onChildRemoved: function(childView) {
        childView.destroy();
      },
      listenTo: function(selectorStr, eventName, callback, context, useCapture) {
        if ('string' != typeof selectorStr) {
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
          delegatesForEvent = delegates[eventName] = {};
          firstTimeListeningToEvent = true;
          useCapture = useCapture || 'blur' === eventName || 'focus' === eventName;
          eventListener.listenTo.call(this, this.el, eventName, this.__private.onDelegatedEvent, void 0, useCapture);
        }
        delegatesForEvent[selectorStr] = delegatesForEvent[selectorStr] || [];
        delegatesForEvent[selectorStr].push(callback.bind(context || this));
      },
      stopListening: function(selectorStr, eventName) {
        if ('string' != typeof selectorStr) {
          eventListener.stopListening.apply(this, arguments);
          return;
        }
        var delegatesForEvent = this.__private.eventDelegates[eventName];
        if (!delegatesForEvent) {
          return;
        }
        delete delegatesForEvent[selectorStr];
        if (0 === Object.keys(delegatesForEvent).length) {
          delete this.__private.eventDelegates[eventName];
          eventListener.stopListening.call(this, this.el, eventName);
        }
      }
    }, 'useSource');
    return View;
  }
  if ('function' == typeof define && define.amd) {
    define([ './extend', './event-listener', './patch-dom', './list' ], moduleFactory);
  } else {
    if ('object' == typeof exports) {
      module.exports = moduleFactory(require('./extend'), require('./event-listener'), require('./patch-dom'), require('./list'));
    } else {
      var bff = window.bff = window.bff || {};
      bff.View = moduleFactory(bff.extend, bff.eventListener, bff.patchDom, bff.List);
    }
  }
}();