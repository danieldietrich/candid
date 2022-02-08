import { webImport } from "./web-import";

/**
 * WebComponent declares the customized built-in element <web-component>.
 */
export class WebComponent extends HTMLElement {
    constructor() {
        super();
        this.style.display = 'none';
    }
    connectedCallback() {
        const name = this.getAttribute('name')
        const props = this.getAttribute('props');
        if (name) {
            createWebComponent(name as Name, { // might throw when registering the custom element
                extends: this.getAttribute('extends'),
                mode: this.getAttribute('mode') as ShadowRootMode | null,
                props: props && eval('(' + props + ')') || {}, // no ternary ? : possible here!
                template: this.querySelector('template')
            });
        }
    }
}

/**
 * The type of `this` within the <script> elements of a web component template.
 */
export type Context = {
    element: HTMLElement               // the custom element
    root: HTMLElement | ShadowRoot     // element.shadowRoot || element
    onMount?: () => void               // called when connected to the DOM
    onUnmount?: () => void             // called when disconnecting from DOM
    // called on attribute or property change, if oldValue !== newValue
    onUpdate?: (name: string, oldValue: string | null, newValue: string | null) => void
    onAdopt?: () => void               // called when custom element changes the document
    onSlotChange?: (e: Event) => void  // called a slot changes
}

/**
 * The options for web component creation.
 */
export type Options = {
    extends?: string | null               // super tag name (default: null)
    mode?: ShadowRootMode | null          // shadow root mode (default: null)
    props?: Props                         // observed properties and default values
    template?: HTMLTemplateElement | null //  the html template
}

/**
 * Web component properties are an object of properties
 * that can be coerced to element attribute types.
 */
export type Props = {
    [prop: string]: PropValue
}

/**
 * Web component property value type,
 * can be coerced to an attribute value type.
 */
export type PropValue = string | number | boolean | null | undefined

/**
 * The name of a web component needs to contain at least one dash '-'.
 */
export type Name = `${string}-${string}`;

/**
 * The initialized web component state.
 */
type Init = {
    script: string
}

// used to protect the context property key of web-components
const ctx = Symbol();

/**
 * Create a web component by
 * 1) declaring a custom element
 * 2) defining the custom element
 */
export function createWebComponent(name: Name, options: Options = {}): void {
    const { extends: superTag, mode, props = {}, template }  = options;
    const superType = superTag ? document.createElement(superTag).constructor as CustomElementConstructor : HTMLElement;
    let init: Promise<Init>;
    class CustomElement extends superType {
        declare readonly [ctx]: Context;
        constructor() {
            super();
            Object.defineProperty(this, ctx, {
              value: {
                element: this,
                root: (mode === 'open' || mode === 'closed') ? this.attachShadow({ mode }) : this
              }
            });
            if (init === undefined) {
                init = template ? new Promise(async (resolve) => {
                    const { content } = template;
                    await Promise.all(Array.from(content.querySelectorAll('web-import')).map(
                        e => webImport(e))
                    );
                    const scripts = Array.from(content.querySelectorAll('script:not([src])')).map(
                        e => e.parentNode?.removeChild(e).textContent
                    );
                    const script = '{' + scripts.join('}{') + '}'; // add semicollon to avoid syntax ambiguities when joining multiple scripts
                    resolve({ script });
                }) : Promise.resolve({ script: '' });
            }
        }
        static get observedAttributes() {
            return Object.keys(props);
        }
        async connectedCallback() {
            const ready = Object.isFrozen(this[ctx]);
            if (ready) {
                this[ctx].onMount?.call(this[ctx]);
            } else {
                // wait for lazy initialization of web-imorts and scripts
                const { script } = await init;
                // make sure all props are ready before calling the script
                initializeProperties(this, props);
                // make content available in the live DOM
                if (template) {
                    const content = template.content.cloneNode(true);
                    this[ctx].root.appendChild(content);
                    // now the script has all it needs (we just let it crash in the case of errors)
                    (function () {
                        try {
                            eval(script)
                        } catch (err) {
                            console.error('[candid] error executing script of web component \'' + name + '\'\n', err, '\n', script);
                        }
                    }).call(this[ctx]);
                }
                Object.freeze(this[ctx]); // frozen indicates ready-state of this web-component
                // the script has registered its lifecycle callbacks, now we can make use of them
                this[ctx].onSlotChange && this.addEventListener('slotchange', (e) => this[ctx].onSlotChange?.call(this[ctx], e));
                this[ctx].onMount?.call(this[ctx]);
                CustomElement.observedAttributes.forEach(a => this[ctx].onUpdate?.call(this[ctx], a, null, (this as any)[a]));
            }
        }
        disconnectedCallback() {
            this[ctx].onUnmount?.call(this[ctx]);
        }
        attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
            (newValue !== oldValue) && this[ctx].onUpdate?.call(this[ctx], name, oldValue, newValue);
        }
        adoptedCallback() {
            this[ctx].onAdopt?.call(this[ctx]);
        }
    }
    customElements.define(name, CustomElement, superTag ? { extends: superTag } : undefined);
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
