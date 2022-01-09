[![npm version](https://img.shields.io/npm/v/candid?logo=npm&style=flat-square)](https://www.npmjs.com/package/candid/)[![minzipped size](https://img.shields.io/bundlephobia/minzip/candid?style=flat-square)](https://bundlephobia.com/result?p=candid@latest)
&nbsp;
[![Sponsor](https://img.shields.io/badge/GitHub-💖Sponsors-b5b7b9?logo=github&style=flat-square)](https://github.com/sponsors/danieldietrich)[![license](https://img.shields.io/github/license/danieldietrich/copy?style=flat-square)](https://opensource.org/licenses/MIT/)
&nbsp;
[![Follow](https://img.shields.io/twitter/follow/danieldietrich?label=Follow&style=social)](https://twitter.com/danieldietrich/)

![Candid](./public/candid.svg)

Candid is an honest, frameworkless JavaScript library for building web applications.

## Features

* **No framework, no dependencies, just markup and pure JavaScript**
* No need to learn anything about NodeJS, just edit and run index.html
* Builds on top of [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components), but without boilerplate
* Out-of-the-box [custom element best practices](https://developers.google.com/web/fundamentals/web-components/best-practices)
* Name validation [according to the specification](https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name)
* Encapsulation of DOM, style and state

## Usage

1. Add Candid `<script>` to your HTML

```html
<!-- umd package -->
<script src="https://cdn.jsdelivr.net/npm/candid"></script>
<script>
  window.addEventListener('load', () => candid());
</script>

<!-- alternative: modern javascript -->
<script type="module">
  import candid from 'https://esm.run/candid';
  window.addEventListener('load', () => candid());
</script>
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
