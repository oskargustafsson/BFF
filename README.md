Run tests in terminal
---------------------
node_modules/.bin/intern-client config=tests/intern

Run tests in browser
--------------------
[server_root]/node_modules/intern/client.html?config=tests/intern

Ambitions
---------
Simplicity; Don't create a Rube Goldberg machine that operates behind the scenes to create the illusion of magic functionality. Instead, make heavy use of getter, setters, prototypal inheritance and mixins to bring out the best parts of JS. Stay close to classic MVC, to avoid recreating problems that has already been solved.

A library, not a framework; BFF comprises a set of standalone modules, each providing a complete service or functionality. All modules should be compatible with eachother but dependencies between modules should be kept at a minimum.

Terse but explicit code; terseness should come from avoiding repeated boilerplate code. On the other hand, complex tasks (such as data bindings) should not be abstracted away using leaky abstractions, just to create less code in some cases.

No external library dependencies; all modern browsers support enough of the HTML/JS/CSS specs to render libraries such as jQuery unnecessary.

Lots of error checks; provide two versions of the library. One development version with lots of runtime error checks and one production version with all runtime checks stripped.
