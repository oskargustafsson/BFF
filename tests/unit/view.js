define(function (require) {
	'use strict';

	var registerSuite = require('intern!object');
	var expect = require('intern/chai!expect');
	var chai = require('intern/chai!');
	var sinonChai = require('node_modules/sinon-chai/lib/sinon-chai');

	var BaseView = require('dist/dev/view');

	chai.use(sinonChai);

	registerSuite(function () {

		return {

			name: 'View',

			'"toString" method returns a string containing valuable debugging information': function () {
				var View = BaseView.makeSubclass({
					constructor: function () { this.render(); },
					getHtml: function () { return '<h1>test <span>more test</span></h1>'; },
				});
				var view = new View();

				var viewStr = view.toString();

				expect(viewStr).to.contain('element');
				expect(viewStr).to.contain('type');
				expect(viewStr).to.contain('<H1>');
				expect(viewStr).to.contain('children');
				expect(viewStr).to.contain('2');

				expect(viewStr).to.contain('child views');
				expect(viewStr).to.contain('0');

				expect(viewStr).to.contain('event listeners');
				expect(viewStr).to.contain('delegated events');
			},

		};

	});

});
