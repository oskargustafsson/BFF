<img src="https://cdn.rawgit.com/oskargustafsson/BFF/master/logo.svg" width="128" alt="BFF logo">, Basic Front end Foundation [![Build Status](https://travis-ci.org/oskargustafsson/BFF.svg?branch=master)](https://travis-ci.org/oskargustafsson/BFF)
================================
### Disclaimer: BFF is in alpha - don't use it for production projects just yet!

BFF is a collection of standalone modules, designed with the intent of making it easier to design interactive web applications. It comprises base classes for the MVC pattern ([Record](https://github.com/oskargustafsson/BFF/blob/master/src/record.js), [View](https://github.com/oskargustafsson/BFF/blob/master/src/view.js)) but more importantly, generic building blocks for event systems ([Event Emitter](https://github.com/oskargustafsson/BFF/blob/master/src/event-emitter.js), [Event Listener](https://github.com/oskargustafsson/BFF/blob/master/src/event-listener.js)), inheritance ([Extend](https://github.com/oskargustafsson/BFF/blob/master/src/extend.js)), collections ([List](https://github.com/oskargustafsson/BFF/blob/master/src/list.js)) and DOM manipulation ([Patch DOM](https://github.com/oskargustafsson/BFF/blob/master/src/patch-dom.js)).

Its ambition is to be a helper library rather than a framework, to be mixed and matched with home grown or third-party components. As such, each BFF module provides a specific service, with a minimal interface. All modules are AMD and CommonJS compatible.

#### Distinguishing features
* Modular, light weight, and no external dependencies.
* Two versions; _development_ and _production_. The former with lots of runtime error checking, the latter minified and without error checks, for optimal performance.
* Fast and fool-proof event system - uses inversion-of-control to make cleaning up event listeners less error prone.
* Data modules (Record and List) combine event system with [getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) and [setters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set), to create a type safe data layer (in development mode) that can be manipulated using terse syntax.
* Data modules support calculated properties, similar to [signals](http://elm-lang.org/guide/reactivity#signals) in [FRP](https://en.wikipedia.org/wiki/Functional_reactive_programming), whose values are derived from one or more other properties - and still emits events when their calculated values change.
* View module that combines the best parts of Backbone.js views with React-like DOM patching to provide a structured approach to building SPAs, with very little boilerplate code, while maintaining separation of concerns.

Get started
-----------
* In your project's root folder run `npm install bff-lib --save` or `bower install bff-lib --save`
* Or, download a release directly from [here](https://github.com/oskargustafsson/BFF/releases).

Demos
-----
[Todo application](http://oskargustafsson.github.io/BFF-todos-example/) ([source](https://github.com/oskargustafsson/BFF-todos-example/))

Documentation
-------------
[API reference](http://oskargustafsson.github.io/BFF)

Want to contribute?
-------------------
#### Building
`npm install` will install all project dev. dependencies.

`grunt` will lint the project, build dev and prod versions of BFF, compile JSDoc documentation, and run the Intern test suite

`grunt watch` will watch for source file changes and recompile the source and documentation

#### Running tests
##### Unit tests in browser
Go to `[server root]/node_modules/intern/client.html?config=tests/intern` in some browser

##### Unit tests in terminal (Node)
Run `node_modules/.bin/intern-client config=tests/intern`

##### Unit tests and functional tests in browser
* Start a standalone [Selenium](http://www.seleniumhq.org/download/) server `java -jar [path to selenium jar]`
* Run `grunt test`
