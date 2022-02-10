import { WebComponent } from "./web-component";
import { WebImport } from "./web-import";

export { defineWebComponent } from "./web-component";
export type { Context, Name, Options, Props, PropValue } from "./web-component";

/**
 * This init() function will trigger an upgrade of all <web-import> and <web-component> elements in the DOM.
 * If Candid is directly used in the browser with a <script> tag, init() will be called automatically.
 *
 * @throws if the elements could not be registered
 */
export function init(): void {
    customElements.define('web-import', WebImport);
    customElements.define('web-component', WebComponent);
}

// for <script> use in the browser
init();
