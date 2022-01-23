const p=function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const c of s.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&o(c)}).observe(document,{childList:!0,subtree:!0});function r(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerpolicy&&(s.referrerPolicy=n.referrerpolicy),n.crossorigin==="use-credentials"?s.credentials="include":n.crossorigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(n){if(n.ep)return;n.ep=!0;const s=r(n);fetch(n.href,s)}};p();function getBaseUrl(){const t=document.head.querySelector("base");return t?t.href:document.URL}function extractBaseUrl(t){return t.substring(0,t.lastIndexOf("/"))+"/"}function createUrl(t,e){return e.startsWith("http://")||e.startsWith("https://")?e:e.startsWith("/")?t.endsWith("/")?t+e.substring(1):t+e:t.endsWith("/")?t+e:t+"/"+e}function validate({name:t,mode:e,props:r}){const o=[];return t===null&&o.push("Missing custom element name."),!isValidName(t)&&o.push("Invalid custom element name: '"+t+"'. See https://candid.link/#custom-element-name"),e!==null&&e!=="open"&&e!=="closed"&&o.push("Invalid shadowRoot mode: '"+e+"'. See https://candid.link/#shadow-root-mode"),(typeof r!="object"||Array.isArray(r))&&o.push("Invalid props: '"+JSON.stringify(r)+"'. See https://candid.link/#web-component-props"),o}const PCENChar="[-.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}]",regexp=new RegExp(`^[a-z]${PCENChar}*-${PCENChar}*$`,"u"),reservedWords=["annotation-xml","color-profile","font-face","font-face-src","font-face-uri","font-face-format","font-face-name","missing-glyph"];function isValidName(t){return regexp.test(t)&&!reservedWords.includes(t)}const webImports=new Set;async function webImport(t,e,r){const o=e.querySelectorAll("web-import");await Promise.all(Array.from(o).map(async n=>{if(!n.getAttribute("status")){n.setAttribute("status","loading");try{const s=n.getAttribute("href"),c=createUrl(t,s);if(webImports.has(c))return;webImports.add(c);const i=await fetch(c);if(i.ok){const u=await i.text(),a=document.createRange().createContextualFragment(u),l=extractBaseUrl(c);await webImport(l,a,r),r?(n.innerHTML="",n.appendChild(a)):n.parentNode.replaceChild(a,n)}else n.setAttribute("status","error"),n.textContent=`${i.status} ${i.statusText}`}catch(s){n.setAttribute("status","error"),n.textContent=s.message}}}))}var candid=async t=>{const{debug:e,elementProcessor:r}=t,o=document.documentElement;await createProcessor(r,e)(getBaseUrl(),o)};function createProcessor(t,e){const r=async(o,n)=>{await webImport(o,n,e),process(o,n,t,r)};return r}function process(t,e,r,o,n){e.querySelectorAll("web-component").forEach(s=>{try{const c=s.getAttribute("name"),i=s.getAttribute("mode"),u=parseProps(s.getAttribute("props")),a=s.querySelector("template"),l=validate({name:c,mode:i,props:u,template:a});if(l.length){l.forEach(h=>console.warn("[candid] "+h,s));return}const{script:d}=processTemplate(a,r),f=createClass(t,a,i,u||{},d,o);customElements.define(c,f)}catch(c){console.error("[candid] Error processing web component:",s,c)}})}function parseProps(str){return str&&eval("("+str+")")}function processTemplate(t,e){return t&&e&&e(...t.content.querySelectorAll("*")),{script:t&&[...t.content.querySelectorAll("script")].map(o=>o.parentNode.removeChild(o).textContent).join(`;
`)}}const __ctx=Symbol();function createClass(baseUrl,template,mode,props,script,componentProcessor){let processed=!1;class C extends HTMLElement{constructor(){super();const root=mode==="open"||mode==="closed"?this.attachShadow({mode}):this,content=template.content.cloneNode(!0);processed||componentProcessor(baseUrl,content).then(()=>{processed=!0,customElements.upgrade(this)}),root.appendChild(template.content.cloneNode(!0)),Object.defineProperty(this,__ctx,{value:createContext(this,root)}),script&&function(){eval(script)}.bind(this[__ctx])()}static get observedAttributes(){return Object.keys(props)}connectedCallback(){!this.isConnected||!processed||(this[__ctx].__uninitialized&&(delete this[__ctx].__uninitialized,Object.entries(props).forEach(([t,e])=>{let r=e;this.hasOwnProperty(t)&&(r=this[t],delete this[t]),createProperty(this,t,e),this.hasAttribute(t)||(this[t]=r)})),this.addEventListener("slotchange",this[__ctx].onSlotChange),this[__ctx].onMount())}disconnectedCallback(){processed&&(this[__ctx].onUnmount(),this.removeEventListener("slotchange",this[__ctx].onSlotChange))}attributeChangedCallback(t,e,r){processed&&this[__ctx].onUpdate(t,e,r)}adoptedCallback(){processed&&this[__ctx].onAdopt()}}return C}function createProperty(t,e,r){Object.defineProperty(t,e,typeof r=="boolean"?{get(){return this.hasAttribute(e)},set(n){n?this.setAttribute(e,""):this.removeAttribute(e)},enumerable:!0}:{get(){return this.getAttribute(e)},set(n){n==null?this.removeAttribute(e):this.setAttribute(e,n)},enumerable:!0})}function createContext(t,e){return Object.defineProperties({__uninitialized:!0,element:t,root:e,onMount(){},onUnmount(){},onUpdate(o,n,s){},onSlotChange(o){},onAdopt(){}},{element:{configurable:!1,enumerable:!0,writable:!1},root:{configurable:!1,enumerable:!0,writable:!1}})}window.addEventListener("load",()=>candid({debug:!0}));
