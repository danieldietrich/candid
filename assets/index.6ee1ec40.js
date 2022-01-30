const p=function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))s(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const c of o.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function n(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerpolicy&&(o.referrerPolicy=r.referrerpolicy),r.crossorigin==="use-credentials"?o.credentials="include":r.crossorigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(r){if(r.ep)return;r.ep=!0;const o=n(r);fetch(r.href,o)}};p();function getBaseUrl(){const e=document.head.querySelector("base");return e?e.href:document.URL}function extractBaseUrl(e){return e.substring(0,e.lastIndexOf("/"))+"/"}function createUrl(e,t){return t.startsWith("http://")||t.startsWith("https://")?t:t.startsWith("/")?e.endsWith("/")?e+t.substring(1):e+t:e.endsWith("/")?e+t:e+"/"+t}async function webImport(e,t,n){const s=t.querySelectorAll("web-import");await Promise.allSettled([...s].map(async r=>{if(!r.getAttribute("status")){r.setAttribute("status","loading");try{const o=r.getAttribute("src"),c=createUrl(e,o),i=await fetch(c);if(i.ok){const l=await i.text(),a=document.createRange().createContextualFragment(l),u=extractBaseUrl(c);await n(u,a),r.parentNode.replaceChild(a,r)}else logError(r,`${i.status} ${i.statusText}`)}catch(o){logError(r,o)}}}))}function logError(e,t){console.error("[candid] web import error",e,t),e.setAttribute("status","error"),e.setAttribute("message",JSON.stringify(t))}async function candid(e){Object.assign({},e);const t=async(n,s)=>{process(n,s,t),await webImport(n,s,t)};await t(getBaseUrl(),document)}function process(e,t,n,s){t.querySelectorAll("web-component").forEach(r=>{try{const o=r.getAttribute("name"),c=r.getAttribute("mode"),i=parseProps(r.getAttribute("props")),l=r.querySelector("template"),a=createClass(e,l,c,i,n);customElements.define(o,a)}catch(o){console.error("[candid] Error processing web component:",r,o)}})}function parseProps(str){return str?eval("("+str+")"):{}}const __ctx=Symbol();function createClass(baseUrl,template,mode,props,componentProcessor){let processor,script;async function initialize(){if(template){processor||(processor=componentProcessor(baseUrl,template.content)),await processor,script||(script=[...template.content.querySelectorAll("script")].map(e=>e.parentNode.removeChild(e).textContent).join(`;
`));const root=mode==="open"||mode==="closed"?this.attachShadow({mode}):this;root.appendChild(template.content.cloneNode(!0));const ctx={element:this,root};Object.defineProperty(this,__ctx,{value:ctx}),function(){eval(script)}.bind(ctx)(),this.addEventListener("slotchange",ctx.onSlotChange),this.connectedCallback(),Object.entries(props).forEach(([e,t])=>this.attributeChangedCallback(e,null,t))}}class C extends HTMLElement{constructor(){super();Object.entries(props).forEach(([t,n])=>{let s=n;this.hasOwnProperty(t)&&(s=this[t],delete this[t]),createProperty(this,t,n),this.hasAttribute(t)||(this[t]=s)}),initialize.bind(this)()}static get observedAttributes(){return Object.keys(props)}connectedCallback(){var t;call((t=this[__ctx])==null?void 0:t.onMount)}disconnectedCallback(){var t;call((t=this[__ctx])==null?void 0:t.onUnmount)}attributeChangedCallback(t,n,s){var r;call((r=this[__ctx])==null?void 0:r.onUpdate,t,n,s)}adoptedCallback(){var t;call((t=this[__ctx])==null?void 0:t.onAdopt)}}return C}function call(e,...t){typeof e=="function"&&e.apply(e,t)}function createProperty(e,t,n){Object.defineProperty(e,t,typeof n=="boolean"?{get:()=>e.hasAttribute(t),set:r=>r?e.setAttribute(t,""):e.removeAttribute(t),enumerable:!0}:{get:()=>e.getAttribute(t),set:r=>r==null?e.removeAttribute(t):e.setAttribute(t,r),enumerable:!0})}window.addEventListener("load",()=>candid());
