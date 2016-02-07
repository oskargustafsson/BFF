!function(){'use strict';function a(a,b,c){function d(a){return!(!a||!a.addEventListener)}function e(a,b,c){if(!d(b))return void a.emit(s,b,c,a);for(var e in a.__private.reEmittingEvents){var f=e.replace(z,'');h(a,b,f,e)}b.emit(p,b,c,a)}function f(a,b,c){return d(b)?(b.emit(r,b,c,a),void a.stopListening(b)):void a.emit(u,b,c,a)}function g(a,b,c,e){b!==c&&(d(c)?c.emit(q,b,c,e,a):a.emit(t,b,c,e,a))}function h(a,b,c,d){a.listenTo(b,c,function(){a.emit.apply(a,[d].concat(Array.prototype.slice.call(arguments)))})}function i(a){return function(b){this.splice(a,1,b)}}function j(a){return function(){return this.__private.array[a]}}function k(a){return function(){return this.__private.array[a].apply(this.__private.array,arguments)}}function l(a){return function(){return new this.constructor(this.__private.array[a].apply(this.__private.array,arguments))}}function m(a){a.emit(x,'length',a.length,a),a.emit(w,a.length,a)}function n(a,b){a.length!==b&&(a.emit(y,'length',a.length,b,a),a.emit(v,a.length,b,a))}function o(b){function d(a){this.__private||Object.defineProperty(this,'__private',{writable:!0,value:{}}),this.__private.array=[],this.__private.reEmittingEvents={},this.listenTo(this,v,function(a,b){var c,d=a-b;if(d>0)for(c=b;a>c;++c)Object.defineProperty(this,c,{enumerable:!0,configurable:!0,get:j(c),set:i(c)});else for(c=a;b>c;++c)delete this[c]}),g.call(this),a=a||[],a.length&&this.pushAll(a)}for(var e in b){var f=b[e];f.setter=!1}a(b,{length:{getter:function(){return this.__private.array.length},setter:!1},first:{getter:function(){return this[0]},setter:!1},last:{getter:function(){return this[this.length-1]},setter:!1}});var g=c.withProperties(b,!0);return d.prototype=Object.create(g.prototype),d.prototype.constructor=d,a(d.prototype,A),d}var p='added',q='replaced',r='removed',s='item:added',t='item:replaced',u='item:removed',v='change:length',w='prechange:length',x='prechange',y='change',z=/item:/,A={};A.push=function(){var a=arguments.length;if(0===a)return this.length;var b=this.length;m(this),this.__private.array.push.apply(this.__private.array,arguments),n(this,b);for(var c=0;a>c;++c)e(this,this[b+c],b+c);return this.length},A.unshift=function(){var a=arguments.length;if(0===a)return this.length;var b=this.length;m(this),this.__private.array.unshift.apply(this.__private.array,arguments),n(this,b);for(var c=0;a>c;++c)e(this,this[c],c);return this.length},A.pop=function(){if(0!==this.length){var a=this.length;m(this);var b=this.__private.array.pop.apply(this.__private.array,arguments);return n(this,a),f(this,b,this.length),b}},A.shift=function(){if(0!==this.length){var a=this.length;m(this);var b=this.__private.array.shift.apply(this.__private.array,arguments);return n(this,a),f(this,b,0),b}},A.splice=function(a,b){var c,d=this.length;0>a&&(a=d+a),b=Math.min(b,d-a);var h=arguments.length-2,i=Math.min(h,b),j=Math.max(h,b),k=this.length;m(this);var l=this.__private.array.splice.apply(this.__private.array,arguments);for(n(this,k),c=0;j>c;++c)h>c&&e(this,this[a+c],a+c),i>c&&g(this,this[a+c],l[c],a+c),b>c&&f(this,l[c],a+c);return l},['forEach','every','some','indexOf','lastIndexOf','join','reduce','reduceRight'].forEach(function(a){A[a]=Array.prototype[a]}),['sort','reverse'].forEach(function(a){A[a]=k(a)}),['filter','slice','map'].forEach(function(a){A[a]=l(a)}),A.concat=function(){for(var a=0,b=arguments.length;b>a;++a){var c=arguments[a];c instanceof Array||void 0===c.length||(arguments[a]=c.toArray())}return new this.constructor(this.__private.array.concat.apply(this.__private.array,arguments))},A.filterMut=function(a,b){for(var c=0,d=this.length-1;d>=-1;--d)d>-1&&!a.call(b,this[d],d,this)?c++:c&&(this.splice(d+1,c),c=0);return this},A.remove=function(a){return this.filterMut(function(b){return a!==b})},A.clear=function(){return this.splice(0,this.length)},A.pushAll=A.concatMut=function(a){return a.length&&this.push.apply(this,a),this.length},A.sliceMut=function(a,b){var c=this.length;b='undefined'!=typeof b?b:c;var d=a||0;d=d>=0?d:Math.max(0,c+d);var e=('number'==typeof b?Math.min(b,c):c)-1;0>b&&(e=c+b);var f=e-d;return f!==c&&(this.splice(0,d),this.splice(e,c-e)),this},A.mapMut=function(a,b){for(var c=0,d=this.length;d>c;++c)this[c]=a.call(b,this[c],c,this);return this},A.find=function(a,b){for(var c=0,d=this.length;d>c;++c)if(a.call(b,this[c],c,this))return this[c]},A.findIndex=function(a,b){for(var c=0,d=this.length;d>c;++c)if(a.call(b,this[c],c,this))return c;return-1},A.includes=function(a,b){b=b||0;var c=this.__private.array.indexOf(a);return-1!==c&&c>=b},A.toArray=function(){return this.__private.array.slice()},A.toJSON=function(){return this.toArray()},A.addEventListener=function(a){if(z.test(a)&&!this.__private.reEmittingEvents[a]){this.__private.reEmittingEvents[a]=!0;for(var b=a.replace(z,''),c=0,e=this.length;e>c;++c){var f=this[c];d(f)&&h(this,f,b,a)}}},A.removeEventListener=function(a){if(z.test(a)){var b=this.__private.listeners[a];if(!b||!b.length){delete this.__private.reEmittingEvents[a];var c=a.replace(z,'');this.stopListening(void 0,c)}}},a(A,b,{'function':'merge'});var B=o({});return B.withProperties=o,B}if('function'==typeof define&&define.amd)define(['./extend','./event-emitter','./record'],a);else if('object'==typeof exports)module.exports=a(require('./extend'),require('./event-emitter'),require('./record'));else{var b=window.bff=window.bff||{};b.List=a(b.extend,b.eventEmitter,b.Record)}}();