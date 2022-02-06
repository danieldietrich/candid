[![npm version](https://img.shields.io/npm/v/candid?logo=npm&style=flat-square)](https://www.npmjs.com/package/candid/)[![brotlied](https://img.badgesize.io/https://cdn.jsdelivr.net/npm/candid.svg?compression=brotli&label=brotlied&max=1500&softmax=1300&style=flat-square)](https://www.jsdelivr.com/package/npm/candid)[![hits/month](https://data.jsdelivr.com/v1/package/npm/candid/badge)](https://www.jsdelivr.com/package/npm/candid)[![license](https://img.shields.io/github/license/danieldietrich/copy?style=flat-square)](https://opensource.org/licenses/MIT/)[![sponsor](https://img.shields.io/badge/GitHub-💖Sponsors-b5b7b9?logo=github&style=flat-square)](https://github.com/sponsors/danieldietrich)[![follow](https://img.shields.io/twitter/follow/danieldietrich?logo=twitter&style=flat-square)](https://twitter.com/danieldietrich/)

![Candid](./public/candid.svg)

Candid is an unopinionated, frameworkless JavaScript library for building web applications.

## Features

* **No framework, no dependencies, just markup and pure JavaScript**
* No need to learn anything about NodeJS, just edit and run index.html
* Builds on top of [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components), but without boilerplate
* Out-of-the-box [custom element best practices](https://developers.google.com/web/fundamentals/web-components/best-practices)
* Encapsulation of DOM, style and state

## Usage

1. Add Candid `<script>` to your HTML

```html
<!-- umd package -->
<script src="https://cdn.jsdelivr.net/npm/candid"></script>

<!-- alternative: modern javascript -->
<script type="module" src="https://esm.run/candid"></script>
```

2. Define your web components

```html
<web-component name="hello-world" props="{ greeting: 'Hi!'}">
    <template>
        <script>
            // all your state & logic goes here
            this.onMount = () => {
                console.log("component mounted");
            };
            this.onUnmount = () => {
                console.log("component unmounts");
            };
            this.onUpdate = (name, oldValue, newValue) => {
                console.log("attribute changed");
                this.root.querySelector('h1').innerHTML = `
                    Hello ${newValue}!
                `;
            };
            this.onAdpopt = () => {
                console.log("component changes document");
            };
        </script>
        <style>
            /* component styles */
            .greet {
                color: red;
            }
        </style>
        <h1 class="greet"></h1>
    </template>
</web-component>
```

3. Use your web components

```html
<!-- renders Hi! and Hi ya'all! -->
<body>
    <hello-world />
    <hello-world greeting="Hi ya'all!" />
</body>
```

## Safari support for customized built-in elements

Web components work in all major browsers and Candid can be used without any hassles.

Safari [does need a polyfill](https://caniuse.com/mdn-api_customelementregistry_builtin) for [customized built-in elements](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements-customized-builtin-example).

**Solution:** add the following script to the the HTML `<head>` element.

```html
<script src="//cdn.jsdelivr.net/npm/@ungap/custom-elements"></script>
```
