define(function (require) {
	'use strict';

	var BaseView = require('bff/view');

	var View = BaseView.makeSubclass({

		constructor: function () {
			this.render();
			this.listenTo('button', 'click', this.onClick);
		},

		getHtml: function () {
			return '<div><button>Click me</button></div>';
		},

		onClick: function () {
			this.$('button').innerHTML = 'Clicked';
		}

	});

	var view = new View();
	document.body.appendChild(view.el);

});
