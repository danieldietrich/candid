const p=function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const c of s.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&n(c)}).observe(document,{childList:!0,subtree:!0});function r(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerpolicy&&(s.referrerPolicy=o.referrerpolicy),o.crossorigin==="use-credentials"?s.credentials="include":o.crossorigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(o){if(o.ep)return;o.ep=!0;const s=r(o);fetch(o.href,s)}};p();function getBaseUrl(){const t=document.head.querySelector("base");return t?t.href:document.URL}function extractBaseUrl(t){return t.substring(0,t.lastIndexOf("/"))+"/"}function createUrl(t,e){return e.startsWith("http://")||e.startsWith("https://")?e:e.startsWith("/")?t.endsWith("/")?t+e.substring(1):t+e:t.endsWith("/")?t+e:t+"/"+e}function processWebComponents(baseUrl,element,componentProcessor){element.querySelectorAll("web-component").forEach(elem=>{var t;try{const name=elem.getAttribute("name"),mode=elem.getAttribute("mode"),propsStr=elem.getAttribute("props"),props=propsStr?eval("("+propsStr+")"):{},superTag=(t=elem.getAttribute("extends"))==null?void 0:t.toLocaleLowerCase(),template=elem.querySelector("template"),CustomElement=createClass(baseUrl,template,mode,props,superTag,componentProcessor),options=superTag?{extends:superTag}:void 0;customElements.define(name,CustomElement,options)}catch(e){console.error("[candid] Error processing web component:",elem,e)}})}const __ctx=Symbol();function createClass(baseUrl,template,mode,props,superTag,componentProcessor){let processor,script;const superType=superTag?document.createElement(superTag).constructor:HTMLElement;function CustomElement(){return Reflect.construct(superType,[],CustomElement)}return CustomElement.prototype=Object.create(superType.prototype,{connectedCallback:{value(){var t,e;this[__ctx]||(Object.entries(props).forEach(([r,n])=>{let o=n;this.hasOwnProperty(r)&&(o=this[r],delete this[r]),createProperty(this,r,n),this.hasAttribute(r)||(this[r]=o)}),initialize.bind(this)()),(e=(t=this[__ctx])==null?void 0:t.onMount)==null||e.call(this[__ctx])}},disconnectedCallback:{value(){var t,e;(e=(t=this[__ctx])==null?void 0:t.onUnmount)==null||e.call(this[__ctx])}},attributeChangedCallback:{value(t,e,r){var n,o;r!==e&&((o=(n=this[__ctx])==null?void 0:n.onUpdate)==null||o.call(this[__ctx],t,e,r))}},adoptedCallback:{value(){var t,e;(e=(t=this[__ctx])==null?void 0:t.onAdopt)==null||e.call(this[__ctx])}}}),CustomElement.observedAttributes=Object.keys(props),CustomElement;async function initialize(){if(template){processor||(processor=componentProcessor(baseUrl,template.content)),await processor,script||(script=[...template.content.querySelectorAll("script")].map(t=>t.parentNode.removeChild(t).textContent).join(`;
`));const root=mode==="open"||mode==="closed"?this.attachShadow({mode}):this,content=template.content.cloneNode(!0);root.appendChild(content);const ctx={element:this,root};Object.defineProperty(this,__ctx,{value:ctx}),function(){eval(script)}.bind(ctx)(),this.addEventListener("slotchange",ctx.onSlotChange),this.connectedCallback(),Object.entries(props).forEach(([t,e])=>this.attributeChangedCallback(t,null,e))}}}function createProperty(t,e,r){Object.defineProperty(t,e,typeof r=="boolean"?{get:()=>t.hasAttribute(e),set:o=>o?t.setAttribute(e,""):t.removeAttribute(e),enumerable:!0}:{get:()=>t.getAttribute(e),set:o=>o==null?t.removeAttribute(e):t.setAttribute(e,o),enumerable:!0})}async function processWebImports(t,e,r){const n=e.querySelectorAll("web-import");await Promise.allSettled([...n].map(async o=>{if(!o.getAttribute("status")){o.setAttribute("status","loading");try{const s=o.getAttribute("src"),c=createUrl(t,s),i=await fetch(c);if(i.ok){const l=await i.text(),a=document.createRange().createContextualFragment(l),u=extractBaseUrl(c);await r(u,a),o.parentNode.replaceChild(a,o)}else logError(o,`${i.status} ${i.statusText}`)}catch(s){logError(o,s)}}}))}function logError(t,e){console.error("[candid] web import error",t,e),t.setAttribute("status","error"),t.setAttribute("message",JSON.stringify(e))}async function candid(t){const{elementProcessor:e}=Object.assign({},t),r=async(n,o)=>{e&&e(o),processWebComponents(n,o,r),await processWebImports(n,o,r)};await r(getBaseUrl(),document)}window.addEventListener("load",()=>candid());