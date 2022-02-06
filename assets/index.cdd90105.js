var d=Object.defineProperty;var m=(t,e,r)=>e in t?d(t,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[e]=r;var i=(t,e,r)=>(m(t,typeof e!="symbol"?e+"":e,r),r);const p=function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const c of s.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&o(c)}).observe(document,{childList:!0,subtree:!0});function r(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerpolicy&&(s.referrerPolicy=n.referrerpolicy),n.crossorigin==="use-credentials"?s.credentials="include":n.crossorigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(n){if(n.ep)return;n.ep=!0;const s=r(n);fetch(n.href,s)}};p();class WebImport extends HTMLElement{connectedCallback(){webImport(this)}}async function webImport(t){var e;try{const r=createUrl(t.getAttribute("src")),o=await fetch(r);if(o.ok){const n=await o.text(),s=document.createRange().createContextualFragment(n),c=r.substring(0,r.lastIndexOf("/"))+"/";s.querySelectorAll("template").forEach(l=>{l.content.querySelectorAll("web-import").forEach(a=>{const u=createUrl(a.getAttribute("src"),c);a.setAttribute("src",u)})}),(e=t.parentNode)==null||e.replaceChild(s,t)}else console.error("[candid] web-import http error ",o.status+`
`,await o.text(),`
`,t)}catch(r){console.error("[candid] web-import network error:",r,`
`,t)}}function createUrl(t,e=document.head.baseURI){return new URL(t||"/",e).toString()}class WebComponent extends HTMLTemplateElement{connectedCallback(){createCustomElement(this,...["name","extends","mode","props"].map(e=>this.getAttribute(e)))}}function createCustomElement(template,name,superTag,mode,propsStr){if(!name)return;const superType=superTag?document.createElement(superTag).constructor:HTMLElement,props=propsStr?eval("("+propsStr+")"):{};let init;class CustomElement extends superType{constructor(){super();i(this,"ctx");i(this,"ready",!1);this.ctx={element:this,root:mode==="open"||mode==="closed"?this.attachShadow({mode}):this},init===void 0&&(init=new Promise(async t=>{await Promise.all(Array.from(template.content.querySelectorAll("web-import")).map(o=>webImport(o)));const e=Array.from(template.content.querySelectorAll("script:not([src])")).map(o=>{var n;return(n=o.parentNode)==null?void 0:n.removeChild(o).textContent}),r="{"+e.join("}{")+"}";t({script:r})}))}static get observedAttributes(){return Object.keys(props)}async connectedCallback(){var t,e;if(this.ready)(t=this.ctx.onMount)==null||t.call(this.ctx);else{const{script}=await init;initializeProperties(this,props);const content=template.content.cloneNode(!0);this.ctx.root.appendChild(content),function(){try{eval(script)}catch(r){console.error("[candid] error executing script of web component '"+name+`'
`,r,`
`,script)}}.call(this.ctx),this.ctx.onSlotChange&&this.ctx.element.addEventListener("slotchange",()=>{var r;return(r=this.ctx.onSlotChange)==null?void 0:r.call(this.ctx)}),(e=this.ctx.onMount)==null||e.call(this.ctx),CustomElement.observedAttributes.forEach(r=>{var o;return(o=this.ctx.onUpdate)==null?void 0:o.call(this.ctx,r,null,this[r])}),this.ready=!0}}disconnectedCallback(){var t;(t=this.ctx.onUnmount)==null||t.call(this.ctx)}attributeChangedCallback(t,e,r){var o;r!==e&&((o=this.ctx.onUpdate)==null||o.call(this.ctx,t,e,r))}adoptedCallback(){var t;(t=this.ctx.onAdopt)==null||t.call(this.ctx)}}const options=superTag?{extends:superTag}:void 0;customElements.define(name,CustomElement,options)}function initializeProperties(t,e){Object.keys(e).forEach(r=>{let o=e[r];t.hasOwnProperty(r)&&(o=t[r],delete t[r]),createProperty(t,r,e[r]),t.hasAttribute(r)||(t[r]=o)})}function createProperty(t,e,r){Object.defineProperty(t,e,typeof r=="boolean"?{get:()=>t.hasAttribute(e),set:n=>n?t.setAttribute(e,""):t.removeAttribute(e),enumerable:!0}:{get:()=>t.getAttribute(e),set:n=>n==null?t.removeAttribute(e):t.setAttribute(e,String(n)),enumerable:!0})}customElements.define("web-import",WebImport);customElements.define("web-component",WebComponent,{extends:"template"});
