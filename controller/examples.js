(function () {
  'use strict';

  // Setting rootEl is required for DOM bindings to work (throw error otherwise), as we use event delegation
  // Can still do Record->Record bindings without rootEl
  var player = document.getElementById('#player');
  this.setRootEl(player); // Either a selector string or a DOM element

  // .bind() takes either a Record, DOMElement or a selector String
  this.listenTo(this.record, 'change:name', function (ev) {
    // Event always has properties: target
    // (and $target if they are DOM els and jQ/Zepto is present)
    // change:* events also has value and previousValue properties
    // this.find is a shorthand for this.el.querySelector
    this.find('.name span').innerHTML = ev.value; // Alt: ev.target.name
  });
  this.listenTo('.name input', 'change', function (ev) {
    this.record.name = ev.target.value;
  });

  // Alternative syntax; pass two objects
  this.bind({ item: this.record, prop: 'name', ev: 'change:name' }, { item: '.name span', prop: 'innerHTML' });
  this.bind({ item: '.name input', prop: 'value', ev: 'change blur' }, { item: this.record, prop: 'name' });

  // Two way binding if both elements have an ev specified
  // Check for infinite looping somehow
  this.bind(
      { item: '.name input', prop: 'value', ev: 'change blur' },
      { item: this.record, prop: 'name', ev: 'change:name' });

})();
