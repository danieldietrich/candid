const p=function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const c of s.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&r(c)}).observe(document,{childList:!0,subtree:!0});function e(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerpolicy&&(s.referrerPolicy=o.referrerpolicy),o.crossorigin==="use-credentials"?s.credentials="include":o.crossorigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(o){if(o.ep)return;o.ep=!0;const s=e(o);fetch(o.href,s)}};p();class WebImport extends HTMLElement{constructor(){super();this.style.display="none"}connectedCallback(){webImport(this)}}async function webImport(t){var n;try{const e=createUrl(t.getAttribute("src")),r=await fetch(e);if(r.ok){const o=await r.text(),s=document.createRange().createContextualFragment(o),c=e.substring(0,e.lastIndexOf("/"))+"/";s.querySelectorAll("template").forEach(a=>{a.content.querySelectorAll("web-import").forEach(i=>{const l=createUrl(i.getAttribute("src"),c);i.setAttribute("src",l)})}),(n=t.parentNode)==null||n.replaceChild(s,t)}else console.error("[candid] web-import http error ",r.status+`
`,await r.text(),`
`,t)}catch(e){console.error("[candid] web-import network error:",e,`
`,t)}}function createUrl(t,n=document.head.baseURI){return new URL(t||"/",n).toString()}class WebComponent extends HTMLElement{constructor(){super();this.style.display="none"}connectedCallback(){const name=this.getAttribute("name"),props=this.getAttribute("props");name&&defineWebComponent(name,{extends:this.getAttribute("extends"),mode:this.getAttribute("mode"),props:props&&eval("("+props+")")||{},template:this.querySelector("template")})}}const ctx=Symbol();function defineWebComponent(name,options={}){const{extends:superTag,mode,props={},template}=options,superType=superTag?document.createElement(superTag).constructor:HTMLElement;let init;const _CustomElement=class extends superType{constructor(){super();Object.defineProperty(this,ctx,{value:{element:this,root:mode==="open"||mode==="closed"?this.attachShadow({mode}):this}}),init===void 0&&(init=template?new Promise(async t=>{const{content:n}=template;await Promise.all(Array.from(n.querySelectorAll("web-import")).map(o=>webImport(o)));const e=Array.from(n.querySelectorAll("script:not([src])")).map(o=>{var s;return(s=o.parentNode)==null?void 0:s.removeChild(o).textContent}),r="{"+e.join("}{")+"}";t({script:r})}):Promise.resolve({script:""}))}static get observedAttributes(){return Object.keys(props)}async connectedCallback(){var t,n;const ready=Object.isFrozen(this[ctx]);if(ready)(t=this[ctx].onMount)==null||t.call(this[ctx]);else{const{script}=await init;if(initializeProperties(this,props),template){const content=template.content.cloneNode(!0);this[ctx].root.appendChild(content),function(){try{eval(script)}catch(e){console.error("[candid] error executing script of web component '"+name+`'
`,e,`
`,script)}}.call(this[ctx])}Object.freeze(this[ctx]),(n=this[ctx].onMount)==null||n.call(this[ctx]),this[ctx].onSlotChange&&this[ctx].root.addEventListener("slotchange",e=>{var r;return(r=this[ctx].onSlotChange)==null?void 0:r.call(this[ctx],e)}),_CustomElement.observedAttributes.forEach(e=>{var r;return(r=this[ctx].onUpdate)==null?void 0:r.call(this[ctx],e,null,this[e])})}}disconnectedCallback(){var t;(t=this[ctx].onUnmount)==null||t.call(this[ctx])}attributeChangedCallback(t,n,e){var r;e!==n&&((r=this[ctx].onUpdate)==null||r.call(this[ctx],t,n,e))}adoptedCallback(){var t;(t=this[ctx].onAdopt)==null||t.call(this[ctx])}};let CustomElement=_CustomElement;customElements.define(name,CustomElement,superTag?{extends:superTag}:void 0)}function initializeProperties(t,n){Object.keys(n).forEach(e=>{let r=n[e];t.hasOwnProperty(e)&&(r=t[e],delete t[e]),createProperty(t,e,n[e]),t.hasAttribute(e)||(t[e]=r)})}function createProperty(t,n,e){Object.defineProperty(t,n,typeof e=="boolean"?{get:()=>t.hasAttribute(n),set:o=>o?t.setAttribute(n,""):t.removeAttribute(n),enumerable:!0}:{get:()=>t.getAttribute(n),set:o=>o==null?t.removeAttribute(n):t.setAttribute(n,String(o)),enumerable:!0})}function init(){customElements.define("web-import",WebImport),customElements.define("web-component",WebComponent)}init();
