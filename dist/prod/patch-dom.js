!function(){'use strict';function a(){function a(a,b){var c,d=new Array(a+1);for(c=0;a>=c;++c)d[c]=new Array(b+1),d[c][0]=c;for(c=0;b>=c;++c)d[0][c]=c;return d}function b(a,b){return b?a.nodeName===b.nodeName:!1}function c(a){for(var b={},c=0,d=a.length;d>c;++c){var e=a[c];b[e.name]=e.value}return b}function d(a,b){var d,e,f,g,h,i=c(a.attributes),j=b.attributes;for('INPUT'===a.nodeName&&(a.value=b.value||''),void 0!==b.checked&&(a.checked=b.checked),void 0!==b.selected&&(a.selected=b.selected),d=0,e=j.length;e>d;++d)f=j[d],h=f.name,g=i[h],delete i[f.name],g&&g.value===f.value||a.setAttribute(h,f.value);for(h in i)a.removeAttribute(h)}function e(a,b){var c=b.nodeValue;a.nodeValue!==c&&(a.nodeValue=c)}function f(a,b){switch(a.nodeType){case Node.ELEMENT_NODE:d(a,b);break;case Node.TEXT_NODE:e(a,b)}}function g(a){return!!a.hasAttribute&&a.hasAttribute('patch-ignore')}function h(c,d,e){var l=c.parentNode,m=[];if(!b(c,d))return void(d?l.replaceChild(d,c):l.removeChild(c));if(f(c,d),!e||-1===Array.prototype.indexOf.call(e,c)){var n,o,p,q,r,s,t,u,v,w=c.childNodes,x=d.childNodes,y=w.length,z=x.length,A=0,B=0;for(n=0;y>n;++n)g(w[n])&&B++;if(y-B!==0||0!==z){var C;for(y>i||z>j?y>=i&&z>=j?(i=y,j=z,k=a(i,j),C=k):C=a(y,z):C=k,p=1;y>=p+A;p++)if(u=w[p+A-1],g(u))A++,p--;else for(q=1;z>=q;++q)b(u,x[q-1])?C[p][q]=C[p-1][q-1]:C[p][q]=1+Math.min(C[p-1][q-1],C[p][q-1],C[p-1][q]);for(p=y-B,q=z;p>0||q>0;)u=w[p+B-1],g(u)?B--:(r=p>0&&q>0?C[p-1][q-1]:1/0,s=q>0?C[p][q-1]:1/0,t=p>0?C[p-1][q]:1/0,v=x[q-1],s>=r&&t>=r?(r<C[p][q]?c.replaceChild(v,u):(m.push(u),m.push(v)),p--,q--):t>=s?(c.insertBefore(v,u.nextSibling),q--):(c.removeChild(u),p--));for(n=0,o=m.length;o>n;n+=2)h(m[n],m[n+1],e)}}}var i=63,j=63,k=a(i,j);return function(a,b,c){c=c||{};var d=c.ignoreSubtreeOf&&a.querySelectorAll(c.ignoreSubtreeOf);return h(a,b,d),a}}if('function'==typeof define&&define.amd)define(a);else if('object'==typeof exports)module.exports=a();else{var b=window.bff=window.bff||{};b.patchDom=a()}}();