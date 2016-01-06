define(function (require) {
  'use strict';

  var registerSuite = require('intern!object');
  var chai = require('intern/chai!');
  var sinonChai = require('node_modules/sinon-chai/lib/sinon-chai');
  var expect = require('intern/chai!expect');

  var merge = require('src/dom-merger');

  chai.use(sinonChai);

  registerSuite(function () {

    return {

      name: 'DOM Merger',

      'updates attributes on the target root node': function () {
        var target = document.createElement('div');
        target.setAttribute('id', 'target-id');
        target.setAttribute('class', 'target-class-1 target-class-2');
        target.setAttribute('target-unique', 'true');

        var source = document.createElement('div');
        source.setAttribute('id', 'source-id');
        source.setAttribute('class', 'source-class-1');
        source.setAttribute('source-unique', 'true');

        merge(target, source);

        expect(target.id).to.equal('source-id');
        expect(target.getAttribute('id')).to.equal('source-id');
        expect(target.getAttribute('class')).to.equal('source-class-1');
        expect(target.getAttribute('source-unique')).to.equal('true');
        expect(target.hasAttribute('target-unique')).to.equal(false);
      },

    };

  });

});
