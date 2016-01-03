define([
  './extend',
  './event-listener',
  './list',
], function (
  extend,
  eventListener,
  List
) {
  'use strict';

  var HTML_PARSER_EL = document.createElement('div');

  function View() {
    this.children = new List();
    this.listenTo(this.children, 'item:removed', this.onChildRemoved);
  }

  extend(View.prototype, eventListener);

  extend(View.prototype, {

    destroy: function () {
      this.removeChildren();
      this.stopListening();
      this.el && this.el.parentNode && this.el.parentNode.removeChild(this.el);
    },

    makeSubclass: function (properties) {
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

    parseHtml: function (htmlString, returnAll) {
      HTML_PARSER_EL.innerHTML = htmlString;
      return returnAll ? HTML_PARSER_EL.children : HTML_PARSER_EL.firstChild;
    },

    $: function (queryString) {
      return this.el.querySelector(queryString);
    },

    forceRepaint: function (el) {
      return (el || this.el).offsetHeight;
    },

    addChild: function (childView, el) {
      this.children.push(childView);
      el && el.appendChild(childView.el);
      return childView;
    },

    removeChild: function (childView) {
      this.children.remove(childView);
      return childView;
    },

    removeChildren: function () {
      this.children.clear();
    },

    onChildRemoved: function (childView) {
      childView.destroy();
    },

  });

  return View;

});
