define(function (require) {
	'use strict';

	var BaseView = require('bff/view');

	var ChildView = BaseView.makeSubclass({
		constructor: function (i) {
			this.i = i;
			this.render();
			this.listenTo('.destroy', 'click', this.destroy);
		},
		getHtml: function () {
			return '<div class="child" data-i="' + this.i + '">' +
				'- CHILD ' + this.i + '<button class="destroy">Destroy</button>' +
			'</div>';
		},
	});

	var ParentView = BaseView.makeSubclass({
		constructor: function () {
			this.render();
			this.listenTo('#destroy-children', 'click', this.destroyChildren);
			this.listenTo(this.children, 'change:length', this.requestRender);
			this.addChild(new ChildView(0));
			this.addChild(new ChildView(1));
			this.addChild(new ChildView(2));
		},
		getHtml: function () {
			return '<div class="parent">' +
				'<button id="destroy-children">Destroy children</button>' +
				'<div class="child-count">' + this.children.length + '</div>' +
				'PARENT' +
			'</div>';
		},
	});

	var view = new ParentView();
	document.body.appendChild(view.el);

});
