export { createWebComponent } from './web-component';
export type { Context, Options, Props, PropValue } from './web-component';

import { WebComponent } from "./web-component";
import { WebImport } from "./web-import";

customElements.define('web-import', WebImport);
customElements.define('web-component', WebComponent);
