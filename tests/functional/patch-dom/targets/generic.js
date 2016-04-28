define(function (require) {
	'use strict';

	var BaseView = require('bff/view');
	var patch = require('bff/patch-dom');

	var patchSourceEl = document.createElement('div');
	patchSourceEl.id = 'patch-target';

	var View = BaseView.makeSubclass({
		constructor: function () {
			this.render();
			this.listenTo('#do-patch', 'click', this.doPatch);
		},
		getHtml: function () {
			return '<div>' +
				'<input type="text" id="patch-source-text">' +
				'<button id="do-patch">Patch!</button>' +
				'<div id="patch-target"></div>' +
			'</div>';
		},
		doPatch: function () {
			patchSourceEl.innerHTML = this.$('#patch-source-text').value;
			patch(this.$('#patch-target'), patchSourceEl);
		},
	});

	var view = new View();
	document.body.appendChild(view.el);

});
