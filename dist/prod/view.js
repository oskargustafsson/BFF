!function(){'use strict';function a(a,b,c,d){function e(){Object.defineProperty(this,'__private',{writable:!0,value:{}}),this.__private.isRenderRequested=!1;var a=this.__private.eventDelegates={};this.__private.onDelegatedEvent=function(b){var c=a[b.type],d=b.target;for(var e in c)if(d.matches(e))for(var f=c[e],g=0,h=f.length;h>g;++g)f[g](b)},this.__private.childViews=new d,this.listenTo(this.__private.childViews,'item:removed',function(a){a.destroy()})}var f=document.createElement('div');return a(e.prototype,b),a(e.prototype,{destroy:function(){this.removeChildren(),this.stopListening(),this.el&&this.el.parentNode&&this.el.parentNode.removeChild(this.el)},render:function(a){var b=this.parseHtml(this.getHtml());this.doPatch||b.setAttribute('patch-ignore',''),this.el?c(this.el,b,a):this.el=b},requestRender:function(){if(!this.__private.isRenderRequested){this.__private.isRenderRequested=!0;var a=this;requestAnimationFrame(function(){a.__private.isRenderRequested=!1,a.render()})}},parseHtml:function(a,b){return f.innerHTML=a,b?f.childNodes:f.firstChild},$:function(a){return this.el.querySelector(a)},forceRepaint:function(a){return(a||this.el).offsetHeight},addChild:function(a,b){return this.__private.childViews.push(a),b=b||this.el,b&&b.appendChild(a.el),a},removeChild:function(a){return this.__private.childViews.remove(a),a},removeChildren:function(){this.__private.childViews.clear()},listenTo:function(a,c,d,e,f){if('string'!=typeof a)return void b.listenTo.apply(this,arguments);if(c instanceof Array&&c.length>0)return this.listenTo(a,c.pop(),d,e,f),void this.listenTo(a,c,d,e,f);var g=this.__private.eventDelegates,h=g[c],i=!1;h||(h=g[c]={},i=!0,f=f||'blur'===c||'focus'===c,b.listenTo.call(this,this.el,c,this.__private.onDelegatedEvent,void 0,f)),h[a]=h[a]||[],h[a].push(d.bind(e||this))},stopListening:function(a,c){if('string'!=typeof a)return void b.stopListening.apply(this,arguments);var d=this.__private.eventDelegates[c];d&&(delete d[a],0===Object.keys(d).length&&(delete this.__private.eventDelegates[c],b.stopListening.call(this,this.el,c)))},toString:function(){return JSON.stringify({element:this.el&&{type:'<'+this.el.nodeName+'>',children:this.el.childNodes.length},'child views':this.__private.childViews.length,'event listeners':Object.keys(this.__private.listeningTo),'delegated events':Object.keys(this.__private.eventDelegates)},void 0,2)}},'useSource'),e.makeSubclass=function(b){var c=b.constructor,d=function(){e.apply(this,arguments),c&&c.apply(this,arguments)};return delete b.constructor,d.prototype=Object.create(e.prototype),b&&a(d.prototype,b),d.prototype.constructor=d,d},e}if('function'==typeof define&&define.amd)define(['./extend','./event-listener','./patch-dom','./list'],a);else if('object'==typeof exports)module.exports=a(require('./extend'),require('./event-listener'),require('./patch-dom'),require('./list'));else{var b=window.bff=window.bff||{};b.View=a(b.extend,b.eventListener,b.patchDom,b.List)}}();