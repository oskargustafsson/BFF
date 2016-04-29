define(function (require) {
	'use strict';

	var BaseView = require('bff/view');
	var patch = require('bff/patch-dom');

	var patchSourceEl = document.createElement('div');
	patchSourceEl.id = 'patch-target';

	var View = BaseView.makeSubclass({
		constructor: function () {
			this.render();
			this.listenTo('#update-target', 'click', this.updateTarget);
			this.listenTo('#do-patch', 'click', this.doPatch);
		},
		getHtml: function () {
			return '<div>' +
				'<input type="text" id="patch-source-text">' +
				'<input type="text" id="patch-target-text">' +
				'<button id="update-target">Update target</button>' +
				'<button id="do-patch">Patch!</button>' +
				'<div id="patch-target"></div>' +
			'</div>';
		},
		updateTarget: function () {
			this.$('#patch-target').innerHTML = this.$('#patch-target-text').value;
			this.$('#patch-target-text').value = '';
		},
		doPatch: function () {
			patchSourceEl.innerHTML = this.$('#patch-source-text').value;
			this.$('#patch-source-text').value = '';
			patch(this.$('#patch-target'), patchSourceEl);
		},
	});

	var view = new View();
	document.body.appendChild(view.el);

});
