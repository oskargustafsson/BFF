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

    /*uglify: {
      dist: {
        files: {
          'dist/jimage.min.js': [ 'src/jimage.js' ],
        },
      },
    },*/

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

  grunt.registerTask('default', [ 'jsdoc' ]);

};
