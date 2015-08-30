/* global module */
module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({

    jsdoc: {
      dist: {
        src: [ 'src/*.js' ],
        options: {
          destination: 'doc',
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
