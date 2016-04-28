// Learn more about configuring this file at <https://theintern.github.io/intern/#configuration>.
// These default settings work OK for most people. The options that *must* be changed below are the
// packages, suites, excludeInstrumentation, and (if you want functional tests) functionalSuites
define({
	// The port on which the instrumenting proxy will listen
	proxyPort: 9000,

	// A fully qualified URL to the Intern proxy
	proxyUrl: 'http://localhost:9000/',

	// Default desired capabilities for all environments. Individual capabilities can be overridden by any of the
	// specified browser environments in the `environments` array below as well. See
	// <https://theintern.github.io/intern/#option-capabilities> for links to the different capabilities options for
	// different services.
	//
	// Note that the `build` capability will be filled in with the current commit ID or build tag from the CI
	// environment automatically
	capabilities: {
		'selenium-version': '2.45.0'
	},

	// Browsers to run integration testing against. Note that version numbers must be strings if used with Sauce
	// OnDemand. Options that will be permutated are browserName, version, platform, and platformVersion; any other
	// capabilities options specified for an environment will be copied as-is
	environments: [
		{ browserName: 'firefox' },
		//{ browserName: 'chrome' },
		/*{ browserName: 'internet explorer', version: '11', platform: 'WIN8' },
		{ browserName: 'internet explorer', version: '10', platform: 'WIN8' },
		{ browserName: 'internet explorer', version: '9', platform: 'WINDOWS' },
		{ browserName: 'firefox', version: '37', platform: [ 'WINDOWS', 'MAC' ] },
		{ browserName: 'chrome', version: '39', platform: [ 'WINDOWS', 'MAC' ] },
		{ browserName: 'safari', version: '8', platform: 'MAC' }*/
	],

	tunnel: 'NullTunnel',

	leaveRemoteOpen: 'fail',

	// Maximum number of simultaneous integration tests that should be executed on the remote WebDriver service
	maxConcurrency: 3,

	// Configuration options for the module loader; any AMD configuration options supported by the AMD loader in use
	// can be used here.
	// If you want to use a different loader than the default loader, see
	// <https://theintern.github.io/intern/#option-useLoader> for instruction
	loaderOptions: {
		// Packages that should be registered with the loader in each testing environment
		packages: [
			{ name: 'app', location: 'src/' },
			{ name: 'tests', location: 'tests/' }
		]
	},

	// Non-functional test suite(s) to run in each browser
	suites: [
		//'tests/unit/patch-dom', // Unreliable, disable for now
		'tests/unit/event-emitter',
		'tests/unit/event-listener',
		'tests/unit/extend',
		'tests/unit/record',
		'tests/unit/list',
	],

	// Functional test suite(s) to execute against each browser once non-functional tests are completed
	functionalSuites: [
		//'tests/functional/view/view',
		'tests/functional/patch-dom/patch-dom',
	],

	// A regular expression matching URLs to files that should not be included in code coverage analysis
	excludeInstrumentation: /^(?:tests|docs|dist|node_modules)\//
});
