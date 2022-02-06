import { WebComponent } from "./web-component";
import { WebImport } from "./web-import";

customElements.define('web-import', WebImport);
customElements.define('web-component', WebComponent, { extends: 'template' });
