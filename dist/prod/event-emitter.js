!function(){'use strict';function a(){var a={emit:function(a){if(this.__private&&this.__private.listeners){var b=this.__private.listeners[a];if(b)for(var c=0,d=b.length;c<d;++c){var e=b[c];e.call.apply(e,arguments)}}},emitArgsAsArray:function(a,b){if(this.__private&&this.__private.listeners){var c=this.__private.listeners[a];if(c)for(var d=0,e=c.length;d<e;++d)c[d].apply(void 0,b)}},addEventListener:function(a,b){this.__private||Object.defineProperty(this,'__private',{writable:!0,value:{}});var c=this.__private.listeners||(this.__private.listeners={}),d=c[a]||(c[a]=[]);d.push(b)},removeEventListener:function(a,b){if(this.__private&&this.__private.listeners){var c=this.__private.listeners[a];if(c){if(b){var d=c.indexOf(b);if(d===-1)return;c.splice(d,1)}else c.length=0;0===c.length&&delete this.__private.listeners[a]}}}};return a}if('function'==typeof define&&define.amd)define(a);else if('object'==typeof exports)module.exports=a();else{var b=window.bff=window.bff||{};b.eventEmitter=a()}}();