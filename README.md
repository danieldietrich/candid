<p align="center"><img width="103" src="./public/candid-logo.svg" alt="Candid logo"></p>

[![npm version](https://img.shields.io/npm/v/candid?logo=npm&style=flat-square)](https://www.npmjs.com/package/candid/)[![brotlied](https://img.badgesize.io/https://cdn.jsdelivr.net/npm/candid.svg?compression=brotli&label=brotlied&max=1500&softmax=1300&style=flat-square)](https://www.jsdelivr.com/package/npm/candid)[![hits/month](https://data.jsdelivr.com/v1/package/npm/candid/badge)](https://www.jsdelivr.com/package/npm/candid)[![license](https://img.shields.io/github/license/danieldietrich/copy?style=flat-square)](https://opensource.org/licenses/MIT/)[![sponsor](https://img.shields.io/badge/GitHub-💖Sponsors-b5b7b9?logo=github&style=flat-square)](https://github.com/sponsors/danieldietrich)[![follow](https://img.shields.io/twitter/follow/danieldietrich?logo=twitter&style=flat-square)](https://twitter.com/danieldietrich/)

Candid is an unopinionated, frameworkless JavaScript library for building web applications.

## Features

* **No framework, no dependencies, just markup and pure JavaScript**
* Builds on top of [web components](https://developer.mozilla.org/en-US/docs/Web/Web_Components), but without boilerplate
* Out-of-the-box [custom element best practices](https://developers.google.com/web/fundamentals/web-components/best-practices)
* HTML and JS/TS web component APIs
* Choose between openness and encapsulation (shadow root)
* Augment existing HTML elements
* Web imports of HTML fragments (HTML API only)
* Lazy loading support for web component contents

## Usage

The _Vanilla HTML_ users just add the script to their index.html, the module is loaded and available in the global `window.Candid` object.

```html
<body>
  <!-- using a component -->
  <say-hi></say-hi>
  <!-- defining a component -->
  <web-component name="say-hi">
    <template>
      <script>console.log('Hi!')</script>
    </template>
  </web-component>
  <!-- initializing Candid -->
  <script src="https://cdn.jsdelivr.net/npm/candid"></script>
</body>
```

All web components and web imports (see below) are hidden using `{ display: none }` after the custom element is created.

### Programmatically

Candid has a JavaScript/TypeScript API.

Installation:

```sh
$ npm i candid
```

**Vanilla JS:**

```ts
import * as Candid from 'candid';

Candid.init();

const template = document.createElement('template');
template.innerHTML = `<script>console.log('Hi!')</script>`;

Candid.defineWebComponent('say-hi', { template });

const sayHi = document.createElement('say-hi');
document.querySelector('app').appendChild(sayHi);
```

## Options

A web component can be defined using the following options:

```ts
type Options = {
  extends?: string /* tag name */
  mode?: ShadowRootMode /* 'open' | 'closed' */ | null
  props?: Props /* { [key: string]?: string | number | boolean | null } */
  template?: HTMLTemplateElement | null
}
```

## Template

The template may contain arbitrary HTML.
Style has a local scope in the presence of a shadow root.
Inline scripts (without src attribute) will be executed once on web component instantiation.
After that, only callbacks will be called.

A script's `this` is the context of a web component and has the following type:

```ts
type Context = {
  element: HTMLElement               // the custom element
  root: HTMLElement | ShadowRoot     // element.shadowRoot || element, depending on the mode option
  onMount?: () => void               // called when connected to the DOM
  onUnmount?: () => void             // called when disconnecting from DOM
  // called on attribute or property change, if oldValue !== newValue
  onUpdate?: (name: string, oldValue: string | null, newValue: string | null) => void
  onAdopt?: () => void               // called when custom element changes the document
  onSlotChange?: (e: Event) => void  // called when a slot changes
}
```

All callbacks can be set during creation of the web component. After that, the context is read-only.

## Lifecycle

The user may set callbacks on the context object:

* `onMount`: called when connected to the DOM
* `onUnmount`: called when disconnecting from DOM
* `onUpdate`: called on attribute or property change, if oldValue !== newValue
* `onAdopt`: called when custom element changes the document
* `onSlotChange`: called when a slot changes

When a web component (read: a custom element) is created, the following effects happen:

1. if mode is set then the shadow root is created (default: no shadow root)
2. the context property is created, containing element and root
3. the web imports are performed asynchronously
4. the scripts are removed from the template

After creation, the element can be mutated by the user, e.g. setting properties, attributes or registering listeners. When the element is connected to the DOM, the following effects happen:

1. the observed properties are linked to the attributes
2. the template is cloned and inserted into the (shadow) root
3. the scripts are executed
4. the context is frozen
5. the `onMount` callback is called
6. the `onUpdate` callback is called for all observed properties
7. the `onSlotChange` callback is called for all slots

When the element is disconnected from the DOM, the following effects happen:

* the `onUnmount` callback is called

When slot content changes, the following effects happen:

* the `onSlotChange` callback is called

When the custom element changes the document, the following effects happen:

* the `onAdopt` callback is called

## Web imports

Web imports are plain HTML imports that are inserted into the DOM.

Once Candid is imported, web imports are fetched and the DOM elements are replaced by the loaded HTML contents. Especially web components can be imported using the `web-import` element.

```html
<head>
  <base href="/components">
  <link rel="preload" href="web-components.html" as="fetch">
</head>
<body>
  <web-import src="web-components.html"></web-import>
  <script type="module" src="https://esm.run/candid"></script>
</body>
```

Web components can have nested `web-import` elements. These are loaded asynchronously when the first web component is instantiated. Relative urls are resolved against the base URL if the origin is the same, otherwise the URL is resolved using the remote URL.

```html
<web-component name="lazy-one" mode="open">
  <template>
    <web-import src="lazy-one.css.html"></web-import>
    <web-import src="https://my.cdn/lazy-one.js.html"></web-import>
    <h1>Candid!</h1>
  </template>
</web-component>
```

Web-imports can be nested and cross-reference different domains. Beware of cycles!

## Extending built-in HTML elements

Web components work in all major browsers and Candid can be used without any hassles. However, it is possible to extend built-in HTML elements.

```html
<form>
  <input is="fancy-input">
</form>
<web-component name="fancy-input" extends="input" props="{ type: 'text', placeholder: 'fancy' }">
  <template>
    <h1>Candid!</h1>
  </template>
</web-component>
```

Safari [does need a polyfill](https://caniuse.com/mdn-api_customelementregistry_builtin) for [customized built-in elements](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements-customized-builtin-example).

**Solution:** add the `@ungap/custom-elements` script by [@WebReflection](https://twitter.com/WebReflection) to the HTML `<head>` section.

```html
<script src="https://cdn.jsdelivr.net/npm/@ungap/custom-elements"></script>
```

## How to stop FOUC

FOUC stands for Flash of Unstyled Content (FOUC). It happens when web components are already inserted in the DOM but not yet defined. FOUC can be prevented by conditionally styling the elements.

```css
my-element:not(:defined) {
  /* Pre-style, give layout, replicate my-element's eventual styles, etc. */
  display: inline-block;
  height: 100vh;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}
```

See [Google Web Fundamentals](https://developers.google.com/web/fundamentals/web-components/customelements#prestyle) and [StackOverflow](https://stackoverflow.com/questions/62683430/how-to-stop-fouc-from-happening-with-native-web-components).

## Security

Candid internally uses `eval` to evaluate scripts. If there are security concerns, use the [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) (CSP) to prevent the scripts from being evaluated.

## Reflection

Given an element `el`, the following information is available:

```ts
const name = el.hasAttribute('is') : el.getAttribute('is') : el.tagName.toLowerCase();
const superTag = el.hasAttribute('is') ? el.tagName.toLowerCase() : undefined;
const mode = el.shadowRoot?.mode;
const customElement = customElements.get(name);
const propNames = customElement.observedAttributes;
const props = propNames.reduce((props, name) => (props[name] = el.getAttribute(name), props), {});
```
