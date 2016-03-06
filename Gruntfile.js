/* global module */
module.exports = function (grunt) {
	'use strict';

	grunt.initConfig({

		jshint: {
			src: 'src/*.js',
			options: {
				jshintrc: true,
			},
		},

		jscs: {
			src: 'src/*.js',
			options: {
				config: true,
			},
		},

		jsdoc: {
			src: [ 'src/*.js', 'README.md' ],
			options: {
				destination: 'doc',
				template: 'node_modules/ink-docstrap/template',
				configure: 'jsdoc.conf.json',
			},
		},

		uglify: {
			dev: {
				files: [ {
					expand: true,
					cwd: 'src',
					src: '**/*.js',
					dest: 'dist/dev',
				} ],
				options: {
					beautify: {
						beautify: true,
						indent_level: 2,
						width: 120,
						bracketize: true,
						screw_ie8: true,
					},
					mangle: false,
					quoteStyle: 1,
					compress: {
						screw_ie8: true,
						sequences: false,
						conditionals: false,
						booleans: false,
						loops: false,
						if_return: false,
						join_vars: false,
						drop_debugger: false,
						drop_console: false,
						global_defs: {
							RUNTIME_CHECKS: true,
						},
						dead_code: true,
					},
				},
			},
			prod: {
				files: [ {
					expand: true,
					cwd: 'src',
					src: '**/*.js',
					dest: 'dist/prod',
				} ],
				options: {
					quoteStyle: 1,
					drop_console: true,
					compress: {
						screw_ie8: true,
						drop_debugger: true,
						drop_console: true,
						global_defs: {
							RUNTIME_CHECKS: false,
						},
						dead_code: true,
					},
				},
			},
		},

		intern: {
			all: {
				options: {
					runType: 'runner',
					config: 'tests/intern',
					reporters: [ 'Runner' ],
				},
			},
			unit: {
				options: {
					runType: 'client',
					config: 'tests/intern',
					reporters: [ 'Console' ],
				},
			},
		},

		watch: {
			files: 'src/*.js',
			tasks: [ 'jsdoc', 'uglify' ],
			options: {
				spawn: false,
			},
		},

	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-jscs');
	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('intern');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('ci-test', [ 'jshint', 'jscs', 'uglify', 'intern:unit' ]);
	grunt.registerTask('test', [ 'jshint', 'jscs', 'uglify', 'intern:all' ]);
	grunt.registerTask('default', [ 'jshint', 'jscs', 'jsdoc', 'uglify', 'test' ]);

};
