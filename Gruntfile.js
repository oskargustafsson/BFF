/* global module */
module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({

    jsdoc: {
      dist: {
        src: [ 'src/*.js' ],
        options: {
          destination: 'doc',
          template: 'node_modules/grunt-jsdoc/node_modules/ink-docstrap/template',
          configure: 'jsdoc.conf.json',
        },
      },
    },

    uglify: {
      dev: {
        options: {
          beautify: true,
          mangle: false,
          screwIE8: true,
          quoteStyle: 1,
          drop_console: true,
          compress: {
            global_defs: {
              RUNTIME_CHECKS: true,
            },
            dead_code: true,
          },
        },
        files: [ {
          expand: true,
          cwd: 'src',
          src: '**/*.js',
          dest: 'dist/dev',
        } ],
      },
      prod: {
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
        files: [ {
          expand: true,
          cwd: 'src',
          src: '**/*.js',
          dest: 'dist/prod',
        } ],
      },
    },

    watch: {
      scripts: {
        files: [ 'src/*.js' ],
        tasks: [ 'jsdoc' ],
        options: {
          spawn: false,
        },
      },
    },

  });

  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', [ 'jsdoc', 'uglify' ]);

};
