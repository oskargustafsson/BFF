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
      src: 'src/*.js',
      options: {
        destination: 'doc',
        template: 'node_modules/grunt-jsdoc/node_modules/ink-docstrap/template',
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
          beautify: true,
          mangle: false,
          screwIE8: true,
          quoteStyle: 1,
          compress: {
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
          screwIE8: true,
          quoteStyle: 1,
          drop_console: true,
          compress: {
            global_defs: {
              RUNTIME_CHECKS: false,
            },
            dead_code: true,
          },
        },
      },
    },

    intern: {
      someReleaseTarget: {
        options: {
          runType: 'client',
          config: 'tests/intern',
          reporters: [ 'Console' ],
        },
      },
    },

    watch: {
      files: 'src/*.js',
      tasks: [ 'jsdoc' ],
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

  grunt.registerTask('test', [ 'intern' ]);
  grunt.registerTask('default', [ 'jshint', 'jscs', 'jsdoc', 'uglify', 'test' ]);

};
