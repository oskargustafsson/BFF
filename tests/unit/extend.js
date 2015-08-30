define(function (require) {
  'use strict';

  var registerSuite = require('intern!object');
  var chai = require('intern/chai!');
  var sinon = require('node_modules/sinon/pkg/sinon');
  var sinonChai = require('node_modules/sinon-chai/lib/sinon-chai');
  var expect = require('intern/chai!expect');

  var extend = require('dist/dev/extend');

  chai.use(sinonChai);

  registerSuite(function () {

    return {

      name: 'Extend',

      'adds properties to the target': function () {
        var source = { numProp: 123 };
        function Target () {}

        var targetInstance1 = new Target();

        extend(Target.prototype, source);

        var targetInstance2 = new Target();

        expect(Target.prototype.numProp).to.equal(source.numProp);
        expect(Target.numProp).to.equal(undefined);
        expect(targetInstance1.hasOwnProperty('numProp')).to.equal(false);
        expect(targetInstance1.numProp).to.equal(source.numProp);
        expect(targetInstance2.hasOwnProperty('numProp')).to.equal(false);
        expect(targetInstance2.numProp).to.equal(source.numProp);
      },

      'returns the target object': function () {
        var source = {};
        var target = {};

        var ret = extend(target, source);

        expect(ret).to.equal(target);
      },

      'throws an error if trying to extend an existing prop': function () {
        var source = { numProp: 123 };
        var target = { numProp: 456 };

        expect(function () {
          extend(target, source);
        }).to.throw();
      },

      'onConflict argument': {

        'can be a default solver string id': {

          '"crash", in which case an error will be thrown on conflicting props': function () {
            var source = { numProp: 123, stringProp: 'aaa' };
            var target = { numProp: 456, stringProp: 'bbb' };

            expect(function () {
              extend(target, source, 'crash');
            }).to.throw();
          },

          '"useTarget", in which case the original props will be preserved': function () {
            var source = { numProp: 123, stringProp: 'aaa' };
            var target = { numProp: 456, stringProp: 'bbb' };

            extend(target, source, 'useTarget');

            expect(target.numProp).to.equal(456);
            expect(target.stringProp).to.equal('bbb');
          },

          '"useSource", in which case the original props will be preserved': function () {
            var source = { numProp: 123, stringProp: 'aaa' };
            var target = { numProp: 456, stringProp: 'bbb' };

            extend(target, source, 'useSource');

            expect(target.numProp).to.equal(123);
            expect(target.stringProp).to.equal('aaa');
          },

          '"merge", in which case properties are recursively merged': function () {
            var spy1 = sinon.spy();
            var spy2 = sinon.spy();

            var source = {
              objProp: {
                objProp: {
                  numProp: -330,
                },
                stringProp: 'string',
                arrayProp: [ 4, 5 ],
              },
              arrayProp: [ 'd', 'e' ],
              funcProp: spy2,
              stringProp: 'bbb',
              numProp: 456,
              boolProp: true,
              nullProp: null,
              undefinedProp: undefined,
            };

            var target = {
              objProp: {
                objProp: {
                  numProp: 1337,
                },
                stringProp: 'g',
                arrayProp: [ 1, 2, 3 ],
              },
              arrayProp: [ 'a', 'b', 'c' ],
              funcProp: spy1,
              stringProp: 'aaa',
              numProp: 123,
              boolProp: false,
              nullProp: null,
              undefinedProp: undefined,
            };

            extend(target, source, 'merge');

            expect(target.objProp.objProp.numProp).to.equal(1007);
            expect(target.objProp.stringProp).to.equal('gstring');
            expect(target.objProp.arrayProp).to.deep.equal([ 1, 2, 3, 4, 5 ]);
            expect(target.arrayProp).to.deep.equal([ 'a', 'b', 'c', 'd', 'e' ]);
            expect(target.stringProp).to.equal('aaabbb');
            expect(target.numProp).to.equal(579);
            expect(target.boolProp).to.equal(true);
            expect(target.nullProp).to.equal(null);
            expect(target.undefinedProp).to.equal(undefined);

            target.funcProp('arg1', 'arg2');

            expect(spy1).to.have.been.calledOnce;
            expect(spy1).to.have.been.calledWith('arg1', 'arg2');
            expect(spy2).to.have.been.calledOnce;
            expect(spy2).to.have.been.calledWith('arg1', 'arg2');
            expect(spy1).to.have.been.calledBefore(spy2);
          },

        },

        'can be an object whose values are solver functions or default solver string ids': function () {
          var solvers = {
            'string': function (target, source, prop) { target[prop] = 'hodor'; },
            'array': 'merge',
          };

          var spy = sinon.spy(solvers, 'string');

          var target = {
            stringProp: 'aaa',
            arrayProp: [ 'a', 'b' ],
          };
          var source = {
            stringProp: 'bbb',
            arrayProp: [ 1, 2 ],
          };

          extend(target, source, solvers);

          expect(target.stringProp).to.equal('hodor');
          expect(target.arrayProp).to.deep.equal([ 'a', 'b', 1, 2 ]);
          expect(spy).to.have.been.calledOnce;
          expect(spy).to.have.been.calledWith(target, source, 'stringProp');
        },

      },

      'defaultOnConflict argument': {

        'can be a default solver string id': function () {
          var target = {
            numProp: 123,
            stringProp: 'aaa',
          };
          var source = {
            numProp: 456,
            stringProp: 'bbb',
          };
          var solvers = {
            'string': 'useSource',
          };

          extend(target, source, solvers, 'useTarget');

          expect(target.numProp).to.equal(123);
          expect(target.stringProp).to.equal('bbb');
        },

        'can be a function': function () {
          var target = {
            numProp: 123,
            stringProp: 'aaa',
          };
          var source = {
            numProp: 456,
            stringProp: 'bbb',
          };
          var solvers = {
            'string': 'useSource',
          };
          var defaultSolvers = {
            aSolver: function (target, source, prop) {
              target[prop] -= source[prop];
            }
          };

          var spy = sinon.spy(defaultSolvers, 'aSolver');

          extend(target, source, solvers, defaultSolvers.aSolver);

          expect(target.stringProp).to.equal('bbb');
          expect(target.numProp).to.equal( -333);
          expect(spy).to.have.been.calledOnce;
          expect(spy).to.have.been.calledWith(target, source, 'numProp');
        },

      },

    };

  });

});
