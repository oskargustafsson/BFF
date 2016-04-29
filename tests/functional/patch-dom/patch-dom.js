define(function (require) {
	'use strict';

	var registerSuite = require('intern!object');
	var expect = require('intern/chai!expect');
	var chai = require('intern/chai!');
	var sinonChai = require('node_modules/sinon-chai/lib/sinon-chai');

	chai.use(sinonChai);

	registerSuite({

		name: 'Patch DOM',

		'beforeEach': function () {
			this.remote.setFindTimeout(5000);
		},

		'can add, replace and remove attributes': function () {
			return this.remote
				.get(require.toUrl('../runner.html?test=patch-dom/targets/generic'))
				.findById('patch-target-text')
					.type('<div class="target-class-1 target-class-2" target-unique="true"></div>')
					.end()
				.findById('update-target')
					.click()
					.end()
				.findById('patch-target')
					.findByTagName('div')
						.getAttribute('class')
						.then(function (classStr) {
							expect(classStr).to.equal('target-class-1 target-class-2');
						})
						.getAttribute('target-unique')
						.then(function (attrValue) {
							expect(attrValue).to.equal('true');
						})
						.end()
					.end()
				.findById('patch-source-text')
					.type('<div class="source-class-1" source-unique="true"></div>')
					.end()
				.findById('do-patch')
					.click()
					.end()
				.findById('patch-target')
					.findByTagName('div')
						.getAttribute('class')
						.then(function (classStr) {
							expect(classStr).to.equal('source-class-1');
						})
						.getAttribute('target-unique')
						.then(function (attrValue) {
							expect(attrValue).to.equal(null);
						})
						.getAttribute('source-unique')
						.then(function (attrValue) {
							expect(attrValue).to.equal('true');
						});
		},

		/*'can add elements to an empty element': function () {
			return this.remote
				.get(require.toUrl('../runner.html?test=patch-dom/targets/generic'))
				.findById('patch-source-text')
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
		},*/

	});
});
