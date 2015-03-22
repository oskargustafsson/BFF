(function () {
  'use strict';

  // Setting rootEl is required for DOM bindings to work (throw error otherwise), as we use event delegation
  // Can still do Model->Model bindings without rootEl
  var player = document.getElementById('#player');
  this.setRootEl(player); // Either a selector string or a DOM element

  // .bind() takes either a Model, DOMElement or a selector String
  this.bind(this.model, 'change:name', function (ev) {
    // Event always has properties: source
    // (and $source if they are DOM els and jQ/Zepto is present)
    // change:* events also has value and previousValue properties
    this.find('.name span').innerHTML = ev.value; // Alt: ev.source.name
  });
  this.bind('.name input', 'change', function (ev) {
    this.model.name = ev.target.value;
  });

  // Alternative syntax; pass two objects
  this.bind({ item: this.model, prop: 'name', ev: 'change:name' }, { item: '.name span', prop: 'innerHTML' });
  this.bind({ item: '.name input', prop: 'value', ev: 'change blur' }, { item: this.model, prop: 'name' });

  // Two way binding if both elements have an ev specified
  // Check for infinite looping somehow
  this.bind(
      { item: '.name input', prop: 'value', ev: 'change blur' },
      { item: this.model, prop: 'name', ev: 'change:name' });

})();
