[![npm version](https://img.shields.io/npm/v/candid?logo=npm&style=flat-square)](https://www.npmjs.com/package/candid/)[![brotlied](https://img.badgesize.io/https://cdn.jsdelivr.net/npm/candid.svg?compression=brotli&label=brotlied&max=1500&softmax=1300&style=flat-square)](https://www.jsdelivr.com/package/npm/candid)[![hits/month](https://data.jsdelivr.com/v1/package/npm/candid/badge)](https://www.jsdelivr.com/package/npm/candid)[![license](https://img.shields.io/github/license/danieldietrich/copy?style=flat-square)](https://opensource.org/licenses/MIT/)[![sponsor](https://img.shields.io/badge/GitHub-💖Sponsors-b5b7b9?logo=github&style=flat-square)](https://github.com/sponsors/danieldietrich)[![follow](https://img.shields.io/twitter/follow/danieldietrich?logo=twitter&style=flat-square)](https://twitter.com/danieldietrich/)

![Candid](./public/candid.svg)

Candid is an unopinionated, frameworkless JavaScript library for building web applications.

## Features

* **No framework, no dependencies, just markup and pure JavaScript**
* Builds on top of [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components), but without boilerplate
* Out-of-the-box [custom element best practices](https://developers.google.com/web/fundamentals/web-components/best-practices)
* HTML and JS/TS web component APIs
* Choose between openness and encapsulation (shadow root)
* Augment existing HTML documents
* Web imports of HTML fragments (HTML API only)
* Lazy loading support for web component contents

## Usage

The first step is to import Candid in your HTML

```html
<!-- umd package -->
<script src="//cdn.jsdelivr.net/npm/candid"></script>

<!-- alternative: modern javascript -->
<script type="module" src="//esm.run/candid"></script>
```

Candid can be used either declaratively in the HTML document.
 
```html
<body>
  <say-hi></say-hi>
  <web-component name="say-hi">
    <template>
      <script>console.log('Hi!')</script>
    </template>
  </web-component>
  <script type="module" src="//esm.run/candid"></script>
</body>
```

Or Candid can be used programmatically by using the JavaScript/TypeScript API.

**Vanilla JS:**

```ts
import * as Candid from 'candid';

Candid.init();

const template = document.createElement('template');
template.innerHTML = `<script>console.log('Hi!')</script>`;

Candid.createWebComponent('say-hi', { template });

const sayHi = document.createElement('say-hi');
document.body.appendChild(sayHi);
```

**Using JSX:** (3rd party lib needed)

```tsx
import * as Candid from 'candid';

Candid.init();

const myScript = 'console.log("Hi!")';

Candid.createWebComponent('say-hi', { template: (
  <template>
    <script>{myScript}</script>
  <template>
)});
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
  root: HTMLElement | ShadowRoot     // element.shadowRoot || element
  onMount?: () => void               // called when connected to the DOM
  onUnmount?: () => void             // called when disconnecting from DOM
  // called on attribute or property change, if oldValue !== newValue
  onUpdate?: (name: string, oldValue: string | null, newValue: string | null) => void
  onAdopt?: () => void               // called when custom element changes the document
  onSlotChange?: (e: Event) => void  // called a slot changes
}
```

## Safari support for customized built-in elements

Web components work in all major browsers and Candid can be used without any hassles.

Safari [does need a polyfill](https://caniuse.com/mdn-api_customelementregistry_builtin) for [customized built-in elements](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements-customized-builtin-example).

**Solution:** add the `@ungap/custom-elements` script by [@WebReflection](https://twitter.com/WebReflection) to the HTML `<head>` section.

```html
<script src="//cdn.jsdelivr.net/npm/@ungap/custom-elements"></script>
```
