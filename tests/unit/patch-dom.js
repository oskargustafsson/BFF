define(function (require) {
	'use strict';

	var registerSuite = require('intern!object');
	var chai = require('intern/chai!');
	var sinonChai = require('node_modules/sinon-chai/lib/sinon-chai');
	var expect = require('intern/chai!expect');

	var patch = require('dist/dev/patch-dom');

	chai.use(sinonChai);

	function makeNode(tagName, attributes, innerHTML) {
		var node = document.createElement(tagName);
		for (var attributeName in attributes || {}) {
			node.setAttribute(attributeName, attributes[attributeName]);
		}
		innerHTML && (node.innerHTML = innerHTML);
		return node;
	}

	registerSuite(function () {

		var testRoot;

		return {

			name: 'Patch DOM',

			'beforeEach': function () {
				testRoot = makeNode('div');
				document.body.appendChild(testRoot);
			},

			'afterEach': function () {
				testRoot.parentNode.removeChild(testRoot);
				testRoot = undefined;
			},

			'adds, replaces and removes attributes on the target node': function () {
				var target = makeNode('div', {
					'id': 'target-id',
					'class': 'target-class-1 target-class-2',
					'target-unique': 'true',
				});
				testRoot.appendChild(target);

				var source = makeNode('div', {
					'id': 'source-id',
					'class': 'source-class-1',
					'source-unique': 'true',
				});

				patch(target, source);
				expect(testRoot.firstChild).to.equal(target);

				expect(target.id).to.equal('source-id');
				expect(target.getAttribute('id')).to.equal('source-id');
				expect(target.getAttribute('class')).to.equal('source-class-1');
				expect(target.getAttribute('source-unique')).to.equal('true');
				expect(target.hasAttribute('target-unique')).to.equal(false);
			},

			'sets "value" variable on <input> elements': function () {
				var target = makeNode('input', {
					'type': 'text',
					'value': 'a'
				});
				testRoot.appendChild(target);
				var source = makeNode('input', {
					'type': 'text',
					'value': 'b',
				});

				expect(testRoot.firstChild).to.equal(target);
				expect(target.value).to.equal('a');
				expect(target.getAttribute('value')).to.equal('a');

				patch(target, source);

				expect(target.value).to.equal('b');
				expect(target.getAttribute('value')).to.equal('b');
			},

			'sets "checked" variable': function () {
				var target = makeNode('input', {
					'type': 'checkbox',
				});
				testRoot.appendChild(target);

				var source1 = makeNode('input', {
					'type': 'checkbox',
					'checked': 'checked',
				});

				var source2 = makeNode('input', {
					'type': 'checkbox',
				});

				expect(target.checked).to.equal(false);
				expect(target.getAttribute('checked')).to.equal(null);

				patch(target, source1);

				expect(testRoot.firstChild).to.equal(target);
				expect(target.checked).to.equal(true);
				expect(target.getAttribute('checked')).to.equal('checked');

				patch(target, source2);

				expect(testRoot.firstChild).to.equal(target);
				expect(target.checked).to.equal(false);
				expect(target.getAttribute('checked')).to.equal(null);
			},

			'sets "selected" variable': function () {
				var targetParent = makeNode('select');
				var target1 = makeNode('option');
				var target2 = makeNode('option');
				targetParent.appendChild(target1);
				targetParent.appendChild(target2);
				testRoot.appendChild(targetParent);

				var source1 = makeNode('option', {
					'selected': 'selected',
				});

				var source2 = makeNode('option');

				expect(target1.selected).to.equal(true);
				expect(target1.getAttribute('selected')).to.equal(null);
				expect(target2.selected).to.equal(false);
				expect(target2.getAttribute('selected')).to.equal(null);

				patch(target2, source1);

				expect(testRoot.firstChild).to.equal(targetParent);
				expect(targetParent.firstChild).to.equal(target1);
				expect(targetParent.lastChild).to.equal(target2);

				expect(target1.selected).to.equal(false);
				expect(target1.getAttribute('selected')).to.equal(null);
				expect(target2.selected).to.equal(true);
				expect(target2.getAttribute('selected')).to.equal('selected');

				patch(target2, source2);

				expect(target1.selected).to.equal(false);
				expect(target1.getAttribute('selected')).to.equal(null);
				expect(target2.selected).to.equal(true);
				expect(target2.getAttribute('selected')).to.equal(null);

				patch(target1, source1);

				expect(target1.selected).to.equal(true);
				expect(target1.getAttribute('selected')).to.equal('selected');
				expect(target2.selected).to.equal(false);
				expect(target2.getAttribute('selected')).to.equal(null);
			},

			'patches the text nodes, while leaving the other nodes untouched': function () {
				var target = makeNode('div', undefined, 'a<input type="text">b');
				testRoot.appendChild(target);
				var inputEl = target.childNodes[1];
				testRoot.appendChild(target);

				var source = makeNode('div', undefined, 'c<input type="text">d');

				expect(target.textContent).to.equal('ab');
				expect(target.firstChild.nodeValue).to.equal('a');
				expect(inputEl.nodeName).to.equal('INPUT');
				expect(target.lastChild.nodeValue).to.equal('b');

				patch(target, source);

				expect(target.textContent).to.equal('cd');
				expect(target.firstChild.nodeValue).to.equal('c');
				expect(target.childNodes[1]).to.equal(inputEl);
				expect(target.lastChild.nodeValue).to.equal('d');
			},

		};

	});

});
