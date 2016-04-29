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

		'can add elements to an empty element': function () {
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

		'can set "checked" property on checkbox <input> elements': function () {
			return this.remote
				.get(require.toUrl('../runner.html?test=patch-dom/targets/generic'))
				.findById('patch-target-text')
					.type('<input type="checkbox">')
					.end()
				.findById('update-target')
					.click()
					.end()
				.findById('patch-target')
					.findByTagName('input')
						.getAttribute('checked')
						.then(function (attrValue) {
							expect(attrValue).to.equal(null);
						})
						.getProperty('checked')
						.then(function (propValue) {
							expect(propValue).to.equal(false);
						})
						.end()
					.end()
				// Patch to checked
				.findById('patch-source-text')
					.type('<input type="checkbox" checked>')
					.end()
				.findById('do-patch')
					.click()
					.end()
				.findById('patch-target')
					.findByTagName('input')
						.getAttribute('checked')
						.then(function (attrValue) {
							expect(attrValue).to.equal('');
						})
						.getProperty('checked')
						.then(function (propValue) {
							expect(propValue).to.equal(true);
						})
						.end()
					.end()
				// Patch back to unchecked
				.findById('patch-source-text')
					.type('<input type="checkbox">')
					.end()
				.findById('do-patch')
					.click()
					.end()
				.findById('patch-target')
					.findByTagName('input')
						.getAttribute('checked')
						.then(function (attrValue) {
							expect(attrValue).to.equal(null);
						})
						.getProperty('checked')
						.then(function (propValue) {
							expect(propValue).to.equal(false);
						});
		},

		'can set "value" variable on <input> elements': function () {
			return this.remote
				.get(require.toUrl('../runner.html?test=patch-dom/targets/generic'))
				.findById('patch-target-text')
					.type('<input type="text">')
					.end()
				.findById('update-target')
					.click()
					.end()
				.findById('patch-target')
					.findByTagName('input')
						.getAttribute('value')
						.then(function (attrValue) {
							expect(attrValue).to.equal(null);
						})
						.getProperty('value')
						.then(function (propValue) {
							expect(propValue).to.equal('');
						})
						.end()
					.end()
				// Patch text input text
				.findById('patch-source-text')
					.type('<input type="text" value="Hello">')
					.end()
				.findById('do-patch')
					.click()
					.end()
				.findById('patch-target')
					.findByTagName('input')
						.getAttribute('value')
						.then(function (attrValue) {
							expect(attrValue).to.equal('Hello');
						})
						.getProperty('value')
						.then(function (propValue) {
							expect(propValue).to.equal('Hello');
						})
						.end()
					.end()
				// Patch back to empty
				.findById('patch-source-text')
					.type('<input type="text">')
					.end()
				.findById('do-patch')
					.click()
					.end()
				.findById('patch-target')
					.findByTagName('input')
						.getAttribute('value')
						.then(function (attrValue) {
							expect(attrValue).to.equal(null);
						})
						.getProperty('value')
						.then(function (propValue) {
							expect(propValue).to.equal('');
						});
		},

		'can set "selected" variable': function () {
			return this.remote
				.get(require.toUrl('../runner.html?test=patch-dom/targets/generic'))
				.findById('patch-target-text')
					.type('<select><option></option><option></option></select>')
					.end()
				.findById('update-target')
					.click()
					.end()
				.findById('patch-target')
					.findByCssSelector('select option:first-child')
						.getAttribute('selected')
						.then(function (attrValue) {
							expect(attrValue).to.equal(null);
						})
						.getProperty('selected')
						.then(function (propValue) {
							expect(propValue).to.equal(true); // First child is default selected
						})
						.end()
					.findByCssSelector('select option:last-child')
						.getAttribute('selected')
						.then(function (attrValue) {
							expect(attrValue).to.equal(null);
						})
						.getProperty('selected')
						.then(function (propValue) {
							expect(propValue).to.equal(false);
						})
						.end()
					.end()
				// Patch second option
				.findById('patch-source-text')
					.type('<select><option></option><option selected></option></select>')
					.end()
				.findById('do-patch')
					.click()
					.end()
				.findById('patch-target')
					.findByCssSelector('select option:first-child')
						.getAttribute('selected')
						.then(function (attrValue) {
							expect(attrValue).to.equal(null);
						})
						.getProperty('selected')
						.then(function (propValue) {
							expect(propValue).to.equal(false);
						})
						.end()
					.findByCssSelector('select option:last-child')
						.getAttribute('selected')
						.then(function (attrValue) {
							expect(attrValue).to.equal('');
						})
						.getProperty('selected')
						.then(function (propValue) {
							expect(propValue).to.equal(true);
						})
						.end()
					.end()
				// Patch back to initial state
				.findById('patch-source-text')
					.type('<select><option></option><option></option></select>')
					.end()
				.findById('do-patch')
					.click()
					.end()
				.findById('patch-target')
					.findByCssSelector('select option:first-child')
						.getAttribute('selected')
						.then(function (attrValue) {
							expect(attrValue).to.equal(null);
						})
						.getProperty('selected')
						.then(function (propValue) {
							expect(propValue).to.equal(true); // First child is default selected
						})
						.end()
					.findByCssSelector('select option:last-child')
						.getAttribute('selected')
						.then(function (attrValue) {
							expect(attrValue).to.equal(null);
						})
						.getProperty('selected')
						.then(function (propValue) {
							expect(propValue).to.equal(false);
						});
		},

		'can patch text nodes, while leaving other nodes untouched': function () {
			return this.remote
				.get(require.toUrl('../runner.html?test=patch-dom/targets/generic'))
				.findById('patch-target-text')
					.type('a<input type="text" value="Hello">b')
					.end()
				.findById('update-target')
					.click()
					.end()
				.findById('patch-target')
					.getVisibleText()
					.then(function (text) {
						expect(text).to.equal('ab');
					})
					.findByTagName('input')
						.getProperty('value')
						.then(function (propValue) {
							expect(propValue).to.equal('Hello');
						})
						.end()
					.end()
				.findById('patch-source-text')
					.type('c<input type="text" value="Goodbye">d')
					.end()
				.findById('do-patch')
					.click()
					.end()
				.findById('patch-target')
					.getVisibleText()
					.then(function (text) {
						expect(text).to.equal('cd');
					})
					.findByTagName('input')
						.getProperty('value')
						.then(function (propValue) {
							expect(propValue).to.equal('Goodbye');
						})
						.end()
					.end();
		},

	});
});
