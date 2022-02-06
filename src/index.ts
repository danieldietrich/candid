type AttributeValue = string | null;

type Args = [AttributeValue, AttributeValue, AttributeValue, AttributeValue];

/**
 * WebComponent declares the customized built-in element <template is='web-component'>.
 */
class WebComponent extends HTMLTemplateElement {
    connectedCallback() {
        createCustomElement(this, ...['name', 'extends', 'mode', 'props'].map(a => this.getAttribute(a)) as Args);
    }
}

customElements.define('web-component', WebComponent, { extends: 'template' });

/**
 * WebImport declares the autonomous custom element <web-import>.
 */
class WebImport extends HTMLElement {
    connectedCallback() {
        webImport(this);
    }
}

customElements.define('web-import', WebImport);

async function webImport(e: Element) {
    const url = createUrl(e.getAttribute('src'));
    const response = await fetch(url);
    if (response.ok) {
        const content = await response.text();
        const fragment = document.createRange().createContextualFragment(content);
        const newBaseUrl = url.substring(0, url.lastIndexOf('/')) + '/';
        fragment.querySelectorAll('template').forEach(t => {
            t.content.querySelectorAll('web-import').forEach(e => {
                const src = createUrl(e.getAttribute('src'), newBaseUrl);
                e.setAttribute('src', src);
            });
        });
        e.parentNode?.replaceChild(fragment, e);
    } else {
        console.error(e, response.status, await response.text());
    }
}

function createUrl(link: AttributeValue, baseUrl: string = document.head.baseURI): string {
    const url = new URL(link || '/', baseUrl).toString();
    return url;
}

/**
 * 
 */
type HTMLElementConstructor = { new(): HTMLElement };

type Context = {
    element: HTMLElement
    root: HTMLElement | ShadowRoot
    onMount?: () => void
    onUnmount?: () => void
    onUpdate?: (name: string, oldValue: string | null, newValue: string | null) => void
    onAdopt?: () => void
    onSlotChange?: () => void
}

type Props = {
    [prop: string]: PropValue
}

type PropValue = string | number | boolean | null | undefined

const ctx = Symbol();

/**
 * Creates a custom element.
 */
function createCustomElement(template: HTMLTemplateElement, name: AttributeValue, superTag: AttributeValue, mode: AttributeValue, propsStr: AttributeValue): void {
    if (!name) {
        return;
    }
    const superType = superTag ? document.createElement(superTag).constructor as HTMLElementConstructor : HTMLElement;
    const props: Props = propsStr ? eval('(' + propsStr + ')') : {};
    let script: string;
    class CustomElement extends superType {
        private ctx: Context;
        private ready = false;
        constructor() {
            super();
            if (script === void 0) { // needs to run first to ensure template has no script tags anymore!
                script = Array.from(template.content.querySelectorAll('script')).map(s =>
                    s.parentNode?.removeChild(s).textContent
                ).join(';\n'); // add semicollon to avoid syntax ambiguities when joining multiple scripts
            }
            this.ctx = {
                element: this,
                root: (mode === 'open' || mode === 'closed') ? this.attachShadow({ mode }) : this
            };
            this.ctx.root.appendChild(template.content.cloneNode(true));
        }
        static get observedAttributes() {
            return Object.keys(props);
        }
        connectedCallback() {
            if (!this.ready) {
                initializeProperties(this, props);
                (function () { eval(script) }).call(this.ctx);
                this.ctx.onSlotChange && this.ctx.element.addEventListener('slotchange', this.ctx.onSlotChange);
                this.ready = true;
            }
            this.ctx.onMount?.call(this.ctx);
        }
        disconnectedCallback() {
            this.ctx.onUnmount?.call(this.ctx);
        }
        attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
            (newValue !== oldValue) && this.ctx.onUpdate?.call(this.ctx, name, oldValue, newValue);
        }
        adoptedCallback() {
            this.ctx.onAdopt?.call(this.ctx);
        }
    }
    const options = superTag ? { extends: superTag } : undefined;
    customElements.define(name, CustomElement, options);
}

/**
 * Properties reflect attribute values. If the attribute is not set, the props default value is used.
 * If both attribute and property are set, we need to bite the bullet and the attribute value is used.
 * See https://developers.google.com/web/fundamentals/web-components/best-practices#lazy-properties
 */
function initializeProperties(element: any, props: Props) {
    Object.keys(props).forEach(prop => {
        let value = props[prop];
        if (element.hasOwnProperty(prop)) {
            value = element[prop];
            delete element[prop];
        }
        createProperty(element, prop, props[prop]);
        if (!element.hasAttribute(prop)) {
            element[prop] = value;
        }
    });
}

/**
 * Creates a new custom element property that reflects the attribute value.
 * Attributes of boolean props are handled as expected (true -> attribute present, false -> no attribute).
 */
function createProperty(e: HTMLElement, prop: string, defaultValue: PropValue) {
    const descriptor = (typeof defaultValue === 'boolean') ? ({
        get: () => e.hasAttribute(prop),
        set: (value: PropValue) => value ? e.setAttribute(prop, '') : e.removeAttribute(prop),
        enumerable: true
    }) : ({
        get: () => e.getAttribute(prop),
        set: (value: PropValue) => (value === null || value === undefined) ? e.removeAttribute(prop) : e.setAttribute(prop, String(value)),
        enumerable: true
    });
    Object.defineProperty(e, prop, descriptor);
}
