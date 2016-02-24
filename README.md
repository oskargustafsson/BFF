BFF - Basic Front end Foundation
================================
### Disclaimer: BFF is in alpha - don't use it for production projects just yet!

BFF is a collection of standalone modules, designed with the intent of making it easier to design interactive web applications. It comprises base classes for the MVC pattern ([Record](https://github.com/oskargustafsson/BFF/blob/master/src/record.js), [View](https://github.com/oskargustafsson/BFF/blob/master/src/view.js)) but more importantly, generic building blocks for event systems ([Event Emitter](https://github.com/oskargustafsson/BFF/blob/master/src/event-emitter.js), [Event Listener](https://github.com/oskargustafsson/BFF/blob/master/src/event-listener.js)), inheritance ([Extend](https://github.com/oskargustafsson/BFF/blob/master/src/extend.js)), collections ([List](https://github.com/oskargustafsson/BFF/blob/master/src/list.js)) and DOM manipulation ([Patch DOM](https://github.com/oskargustafsson/BFF/blob/master/src/patch-dom.js)).

Its ambition is to be a helper library rather than a framework, to be mixed and matched with home grown or third-party components. As such, each BFF module provides a specific service, with a minimal interface. All modules are AMD and CommonJS compatible.

Demos
-----
[Todo application](http://oskargustafsson.github.io/BFF-todos-example/) ([source](https://github.com/oskargustafsson/BFF-todos-example/))

Build
-----
`npm install` will install all project dev. dependencies.

`grunt` will lint the project, build dev and prod versions of BFF, compile JSDoc documentation, and run the Intern test suite

`grunt watch` will watch for source file changes and recompile the source and documentation

`grunt test` will run the test suite

Run tests in browser
--------------------
[server root]/node_modules/intern/client.html?config=tests/intern

TO DO before 1.0
----------------
### General
* Add input validation (of calling arguments) to all exposed functions
* Complete documentation
    * Docblocks
    * Make available online
* Implement toString() for all modules

### List
* UTs for all functions
* UT: Props that depend on 'length' should trigger own change events when length changes
* Option to mixin Lodash functions
    * or just implement some lodash funcs like union and intersection
* Throw error message if user tries to assign to list[-1] or list[list.length]
* Explore if there is a way to check if the user assigns outside of the array and throw an error.
    * Using Proxies? (FF + IE12)
    * Listening for internal Array "length" changes?

### Record
* Cache calculated property values
* How to destroy Records? Will they be garbage collected as-is?

### Event emitter
* Calling addEventListener() with the same arguments multiple times should have no effect. Maybe.

### Event listener
* Write UTs for listenTo(anArray, ...)
* Option: useCapture

### View
* FTs

### Patch DOM
* Option: idAttributes: [], a list of node attributes used to differentiate a list of otherwise indistinguishable nodes
* SVG support
* FTs

### Extend
