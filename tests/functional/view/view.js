define(function (require) {
	'use strict';

	var registerSuite = require('intern!object');
	var expect = require('intern/chai!expect');
	var chai = require('intern/chai!');
	var sinonChai = require('node_modules/sinon-chai/lib/sinon-chai');

	chai.use(sinonChai);

	registerSuite({

		name: 'View',

		'can "listenTo" delegated DOM events': function () {
			return this.remote
				.setFindTimeout(5000)
				.get(require.toUrl('../runner.html?test=view/targets/listen-to'))
				.findById('text-input')
					.getProperty('value')
					.then(function (text) { expect(text).to.equal(''); })
					.click()
					.getProperty('value')
					.then(function (text) { expect(text).to.equal('Focused'); })
					.end()
				.findById('textarea')
					.getProperty('value')
					.then(function (text) { expect(text).to.equal(''); })
					.click()
					.getProperty('value')
					.then(function (text) { expect(text).to.equal('Focused'); })
					.end()
				.findById('text-input')
					.getProperty('value')
					.then(function (text) { expect(text).to.equal('Blurred'); })
					.click()
					.end()
				.findById('textarea')
					.getProperty('value')
					.then(function (text) { expect(text).to.equal('Blurred'); });
		},

		'can "stopListening" to all delegated elements and event names': function () {
			return this.remote
				.setFindTimeout(5000)
				.get(require.toUrl('../runner.html?test=view/targets/listen-to'))
				.findById('stop-all')
					.click()
					.end()
				.findById('text-input')
					.getProperty('value')
					.then(function (text) { expect(text).to.equal(''); })
					.click()
					.getProperty('value')
					.then(function (text) { expect(text).to.equal(''); })
					.end()
				.findById('textarea')
					.getProperty('value')
					.then(function (text) { expect(text).to.equal(''); })
					.click()
					.getProperty('value')
					.then(function (text) { expect(text).to.equal(''); })
					.end()
				.findById('text-input')
					.getProperty('value')
					.then(function (text) { expect(text).to.equal(''); })
					.click()
					.end()
				.findById('textarea')
					.getProperty('value')
					.then(function (text) { expect(text).to.equal(''); });
		},

		'can "stopListening" to specific delegated event names': function () {
			return this.remote
				.setFindTimeout(5000)
				.get(require.toUrl('../runner.html?test=view/targets/listen-to'))
				.findById('stop-focus')
					.click()
					.end()
				.findById('text-input')
					.getProperty('value')
					.then(function (text) { expect(text).to.equal(''); })
					.click()
					.getProperty('value')
					.then(function (text) { expect(text).to.equal(''); })
					.end()
				.findById('textarea')
					.getProperty('value')
					.then(function (text) { expect(text).to.equal(''); })
					.click()
					.getProperty('value')
					.then(function (text) { expect(text).to.equal(''); })
					.end()
				.findById('text-input')
					.getProperty('value')
					.then(function (text) { expect(text).to.equal('Blurred'); })
					.click()
					.end()
				.findById('textarea')
					.getProperty('value')
					.then(function (text) { expect(text).to.equal('Blurred'); });
		},

		'can "stopListening" to specific delegated selector strings': function () {
			return this.remote
				.setFindTimeout(5000)
				.get(require.toUrl('../runner.html?test=view/targets/listen-to'))
				.findById('stop-text-input')
					.click()
					.end()
				.findById('text-input')
					.getProperty('value')
					.then(function (text) { expect(text).to.equal(''); })
					.click()
					.getProperty('value')
					.then(function (text) { expect(text).to.equal(''); })
					.end()
				.findById('textarea')
					.getProperty('value')
					.then(function (text) { expect(text).to.equal(''); })
					.click()
					.getProperty('value')
					.then(function (text) { expect(text).to.equal('Focused'); })
					.end()
				.findById('text-input')
					.getProperty('value')
					.then(function (text) { expect(text).to.equal(''); })
					.click()
					.end()
				.findById('textarea')
					.getProperty('value')
					.then(function (text) { expect(text).to.equal('Blurred'); });
		},

		'can add and remove all child views': function () {
			return this.remote
				.setFindTimeout(5000)
				.get(require.toUrl('../runner.html?test=view/targets/child-views'))
				.findByClassName('parent')
					.findAllByClassName('child')
						.then(function (children) { expect(children.length).to.equal(3); })
						.end()
					.findByClassName('child-count')
						.getVisibleText()
						.then(function (text) { return expect(text).to.equal('3'); })
						.end()
					.findById('destroy-children')
						.click()
						.end()
					.findByClassName('child-count')
						.getVisibleText()
						.then(function (text) { return expect(text).to.equal('0'); })
						.end()
					.waitForDeletedByClassName('child');
		},

		'(child) views can destroy themseleves': function () {
			return this.remote
				.setFindTimeout(5000)
				.get(require.toUrl('../runner.html?test=view/targets/child-views'))
				.findByClassName('parent')
					.findAllByClassName('child')
						.then(function (children) { expect(children.length).to.equal(3); })
						.end()
					.findByClassName('child-count')
						.getVisibleText()
						.then(function (text) { return expect(text).to.equal('3'); })
						.end()
					.findByCssSelector('.child[data-i="1"] .destroy')
						.click()
						.end()
					.findAllByClassName('child')
						.then(function (children) { expect(children.length).to.equal(2); })
						.end()
					.findByClassName('child-count')
						.getVisibleText()
						.then(function (text) { return expect(text).to.equal('2'); });
		},

	});
});
