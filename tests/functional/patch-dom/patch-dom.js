define(function (require) {
	'use strict';

	var registerSuite = require('intern!object');
	var expect = require('intern/chai!expect');
	var chai = require('intern/chai!');
	var sinonChai = require('node_modules/sinon-chai/lib/sinon-chai');

	chai.use(sinonChai);

	registerSuite({

		name: 'Patch DOM',

		'can add elements to an empty element': function () {
			return this.remote
				.setFindTimeout(5000)
				.get(require.toUrl('../runner.html?test=patch-dom/targets/generic'))
				.findById('patch-source-text')
					.click()
					.type('<h1>Hello</h1>')
					.end()
				.findById('do-patch')
					.click()
					.end()
				.findById('patch-target')
					.findByTagName('h1')
						.getVisibleText()
						.then(function (text) {
							expect(text).to.equal('Hello');
						});
		},

	});
});
