export { createWebComponent } from './web-component';
export type { Context, Options, Name, Props, PropValue } from './web-component';

import { WebComponent } from "./web-component";
import { WebImport } from "./web-import";

/**
 * This init() function will trigger an upgrade of all <web-import> and <web-component> elements in the DOM.
 * It will return true, if the elements were successfully registered or false, if an element was already
 * registered (or the runtime env does not support custom elements / web components).
 *
 * Normally, init() will executed automatically when importing Candid. However, in the presence of tree shaking,
 * the init() call may be considered as dead code and removed because it does perform only side-effects.
 * In that case, init() should be called manually. A second call will not throw but return false.
 *
 * Candid can be used either declaratively in the HTML document.
 *
 * ```
 * <body>
 *   <web-component name="say-hi">
 *     <template>
 *       <script>console.log('Hi!')</script>
 *     </template>
 *   </web-component>
 *   <script type="module" src="//esm.run/candid"></script>
 * </body>
 * ```
 *
 * Or Candid can be used programmatically by using the JavaScript/TypeScript API.
 *
 * Variant 1: Vanilla JS
 *
 * ```
 * import * as Candid from 'candid';
 *
 * Candid.init();
 *
 * const template = document.createElement('template');
 * template.innerHTML = `<script>console.log('Hi!')</script>`;
 *
 * Candid.createWebComponent('say-hi', { template });
 *
 * const sayHi = document.createElement('say-hi');
 * document.body.appendChild(sayHi);
 * ```
 *
 * Variant 2: Using JSX (3rd party lib needed)
 *
 * ```
 * import * as Candid from 'candid';
 *
 * Candid.init();
 *
 * const myScript = 'console.log("Hi!")';
 *
 * Candid.createWebComponent('say-hi', { template: (
 *   <template>
 *     <script>{myScript}</script>
 *   <template>
 * )});
 * ```
 */
export function init(): boolean {
    try {
        customElements.define('web-import', WebImport);
        customElements.define('web-component', WebComponent);
        return true;
    } catch {
        return false;
    }
}

// define Candid's custom elements
init();
