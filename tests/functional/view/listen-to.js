define(function (require) {
	'use strict';

	var BaseView = require('bff/view');

	var View = BaseView.makeSubclass({

		constructor: function () {
			this.render();
			this.listenTo('input[type="text"]', 'focus', this.onFocus);
			this.listenTo('textarea', 'focus', this.onFocus);
			this.listenTo('input[type="text"]', 'blur', this.onBlur);
			this.listenTo('textarea', 'blur', this.onBlur);
			this.listenTo('#stop-text-input', 'click', this.stopListeningToTextInput);
			this.listenTo('#stop-focus', 'click', this.stopListeningToFocus);
			this.listenTo('#stop-all', 'click', this.stopListeningToAll);
		},

		getHtml: function () {
			return '<div>' +
				'<input type="text" id="text-input"></input>' +
				'<textarea id="textarea"></textarea>' +
				'<br>' +
				'<button id="stop-text-input">Stop text input</button>' +
				'<button id="stop-focus">Stop blur</button>' +
				'<button id="stop-all">Stop all</button>' +
			'</div>';
		},

		onBlur: function (ev) {
			ev.target.value = 'Blurred';
		},

		onFocus: function (ev) {
			ev.target.value = 'Focused';
		},

		stopListeningToTextInput: function () {
			this.stopListening('input[type="text"]');
		},

		stopListeningToFocus: function () {
			this.stopListening(undefined, 'focus');
		},

		stopListeningToAll: function () {
			this.stopListening('*');
		},

	});

	var view = new View();
	document.body.appendChild(view.el);

});
