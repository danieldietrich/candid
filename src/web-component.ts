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
        const template = this.querySelector('template');
        if (template) {
            createCustomElement(template, ...['name', 'extends', 'mode', 'props'].map(a => this.getAttribute(a)) as Args);
        }
    }
}

type AttributeValue = string | null;

type Args = [AttributeValue, AttributeValue, AttributeValue, AttributeValue];

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

type Init = {
    script: string
}

// used to protect the context property key of web-components
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
    let init: Promise<Init>;
    class CustomElement extends superType {
        constructor() {
            super();
            Object.defineProperty(this, ctx, {
              value: {
                element: this,
                root: (mode === 'open' || mode === 'closed') ? this.attachShadow({ mode }) : this
              }
            });
            if (init === undefined) {
                init = new Promise(async (resolve) => {
                    const { content } = template;
                    await Promise.all(Array.from(template.content.querySelectorAll('web-import')).map(
                        e => webImport(e))
                    );
                    const scripts = Array.from(template.content.querySelectorAll('script:not([src])')).map(
                        e => e.parentNode?.removeChild(e).textContent
                    );
                    const script = '{' + scripts.join('}{') + '}'; // add semicollon to avoid syntax ambiguities when joining multiple scripts
                    resolve({ script });
                });
            }
        }
        static get observedAttributes() {
            return Object.keys(props);
        }
        async connectedCallback() {
            const ready = Object.isFrozen((this as any)[ctx]);
            if (ready) {
                (this as any)[ctx].onMount?.call((this as any)[ctx]);
            } else {
                // wait for lazy initialization of web-imorts and scripts
                const { script } = await init;
                // make sure all props are ready before calling the script
                initializeProperties(this, props);
                // make content available in the live DOM
                const content = template.content.cloneNode(true);
                (this as any)[ctx].root.appendChild(content);
                // now the script has all it needs (we just let it crash in the case of errors)
                (function () {
                    try {
                        eval(script)
                    } catch (err) {
                        console.error('[candid] error executing script of web component \'' + name + '\'\n', err, '\n', script);
                    }
                }).call((this as any)[ctx]);
                Object.freeze((this as any)[ctx]); // frozen indicates ready-state of this web-component
                // the script has registered its lifecycle callbacks, now we can make use of them
                (this as any)[ctx].onSlotChange && this.addEventListener('slotchange', () => (this as any)[ctx].onSlotChange?.call((this as any)[ctx]));
                (this as any)[ctx].onMount?.call((this as any)[ctx]);
                CustomElement.observedAttributes.forEach(a => (this as any)[ctx].onUpdate?.call((this as any)[ctx], a, null, (this as any)[a]));
            }
        }
        disconnectedCallback() {
            (this as any)[ctx].onUnmount?.call((this as any)[ctx]);
        }
        attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
            (newValue !== oldValue) && (this as any)[ctx].onUpdate?.call((this as any)[ctx], name, oldValue, newValue);
        }
        adoptedCallback() {
            (this as any)[ctx].onAdopt?.call((this as any)[ctx]);
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
