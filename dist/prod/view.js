!function(){'use strict';function a(a,b,c,d,e){function f(){Object.defineProperty(this,'__private',{writable:!0,value:{}}),this.__private.isRenderRequested=!1;var a=this.__private.eventDelegates={};this.__private.onDelegatedEvent=function(b){var c=a[b.type],d=b.target;for(var e in c)if(d.matches(e))for(var f=c[e],g=0,h=f.length;h>g;++g)f[g](b)},Object.defineProperty(this,'el',{enumerable:!0,get:function(){return this.__private.el},set:function(a){this.stopListening('*'),this.__private.el=a}}),this.__private.childViews=new e,this.listenTo(this.__private.childViews,'item:destroyed',function(a){this.__private.childViews.remove(a)}),Object.defineProperty(this,'children',{enumerable:!0,get:function(){return this.__private.childViews}})}var g=document.createElement('div');return a(f.prototype,b),a(f.prototype,c),a(f.prototype,{destroy:function(){this.destroyChildren(),this.stopListening(),this.el&&this.el.parentNode&&this.el.parentNode.removeChild(this.el),this.emit('destroyed',this)},render:function(a){var b=this.parseHtml(this.getHtml());this.doPatch||b.setAttribute('patch-ignore',''),this.el?d(this.el,b,a):this.el=b},requestRender:function(){if(!this.__private.isRenderRequested){this.__private.isRenderRequested=!0;var a=this;requestAnimationFrame(function(){a.__private.isRenderRequested=!1,a.render()})}},parseHtml:function(a,b){return g.innerHTML=a,b?g.childNodes:g.firstChild},$:function(a){return this.el.querySelector(a)},forceRepaint:function(a){return(a||this.el).offsetHeight},addChild:function(a,b){return this.__private.childViews.push(a),b!==!1&&(b||this.el).appendChild(a.el),a},destroyChildren:function(){for(var a=this.__private.childViews.length-1;a>=0;--a)this.__private.childViews[a].destroy()},listenTo:function(a,b,d,e,f){if('string'!=typeof a)return void c.listenTo.apply(this,arguments);if(b instanceof Array&&b.length>0)return this.listenTo(a,b.pop(),d,e,f),void this.listenTo(a,b,d,e,f);var g=this.__private.eventDelegates,h=g[b];h||(h=g[b]={},f=f||'blur'===b||'focus'===b,c.listenTo.call(this,this.el,b,this.__private.onDelegatedEvent,void 0,f)),h[a]=h[a]||[],h[a].push(d.bind(e||this))},stopListening:function(a,b){if('string'==typeof a||(c.stopListening.apply(this,arguments),void 0===a))for(var d=this.__private.eventDelegates,e=void 0!==b?[b]:Object.keys(d),f=0,g=e.length;g>f;++f){b=e[f];var h=d[b];h&&(a&&'*'!==a?delete h[a]:d[b]={},0===Object.keys(d[b]).length&&(delete this.__private.eventDelegates[b],c.stopListening.call(this,this.el,b)))}},toString:function(){return JSON.stringify({element:this.el&&{type:'<'+this.el.nodeName+'>',children:this.el.childNodes.length},'child views':this.__private.childViews.length,'event listeners':Object.keys(this.__private.listeningTo),'delegated events':Object.keys(this.__private.eventDelegates)},void 0,2)}},'useSource'),f.makeSubclass=function(b){var c=b.constructor,d=function(){f.apply(this,arguments),c&&c.apply(this,arguments)};return delete b.constructor,d.prototype=Object.create(f.prototype),b&&a(d.prototype,b),d.prototype.constructor=d,d},f}if('function'==typeof define&&define.amd)define(['./extend','./event-emitter','./event-listener','./patch-dom','./list'],a);else if('object'==typeof exports)module.exports=a(require('./extend'),require('./event-emitter'),require('./event-listener'),require('./patch-dom'),require('./list'));else{var b=window.bff=window.bff||{};b.View=a(b.extend,b.eventEmitter,b.eventListener,b.patchDom,b.List)}}();