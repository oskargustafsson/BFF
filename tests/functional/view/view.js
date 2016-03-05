define([
	'intern!object',
	'intern/chai!assert',
	'require'
], function (registerSuite, assert, require) {
	'use strict';

	registerSuite({

		name: 'View',

		'can listenTo delegated DOM events': function () {
			return this.remote
				.setFindTimeout(10000)
				.get(require.toUrl('./view-listen-to.html'))
				.findByTagName('button')
				.getVisibleText()
				.then(function (text) {
					assert.ok(text !== 'Clicked', 'Expected button callback not to be triggered');
				})
				.click()
				.getVisibleText()
				.then(function (text) {
					assert.ok(text === 'Clicked', 'Expected button callback to be triggered');
				});
		}
	});
});
