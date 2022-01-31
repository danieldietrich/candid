import { call } from './functions.js';
/**
 * Processes web component tags by creating and registering a new custom element class.
 * 
 * @param {string} baseUrl the base path
 * @param {Element | DocumentFragment} element an element to process
 * @param {ComponentProcessor} componentProcessor
 * @returns {void}
 * 
 * @typedef {import('.').ComponentProcessor} ComponentProcessor
 */
 export function processWebComponents(baseUrl, element, componentProcessor) {
  element.querySelectorAll("web-component").forEach(elem => {
    try {
      const name = elem.getAttribute('name');
      const mode = elem.getAttribute('mode');
      const propsStr = elem.getAttribute('props');
      const props = propsStr ? eval('(' + propsStr + ')') : {}; // we use eval because JSON.parse is too restrictive
      const template = elem.querySelector('template');
      const C = createClass(baseUrl, template, mode, props, componentProcessor);
      customElements.define(name, C); // this triggers the instantiation of all custom elements in the document
    } catch (err) {
      console.error("[candid] Error processing web component:", elem, err);
    }
  });
}

/**
 * The internal element property that is used to store the component's context,
 * consisting of state and lifecycle methods.
 * The context is altered by user defined script tags in the template.
 */
const __ctx = Symbol();

/**
 * Creates a new custom element class from the given template.
 * 
 * @param {string} baseUrl the base path
 * @param {?HTMLTemplateElement} template 
 * @param {?string} mode shadow root mode
 * @param {?object} props default props
 * @param {ComponentProcessor} componentProcessor
 * @returns a new custom element class
 */
function createClass(baseUrl, template, mode, props, componentProcessor) {

  let processor;
  let script;

  async function initialize() {
    if (template) {
      if (!processor) {
        // the first instance will trigger lazy instantiation
        processor = componentProcessor(baseUrl, template.content);
      }
      // all instances will wait for the component to be processed
      await processor;
      // remove the script from the template before cloning the template
      if (!script) {
        script = [...template.content.querySelectorAll("script")].map(s =>
          s.parentNode.removeChild(s).textContent
        ).join(';\n'); // add semicollon to avoid syntax ambiguities when joining multiple scripts
      }
      // if mode === 'closed', shadowRoot is null but root is defined!
      const root = (mode === 'open' || mode === 'closed') ? this.attachShadow({ mode }) : this;
      // the template has been processed and the script has been removed,
      // so clone it and add it to the (shadow) root
      root.appendChild(template.content.cloneNode(true));
      // the context needs to be in place before the script is executed
      const ctx = {
        element: this,
        root
      };
      Object.defineProperty(this, __ctx, {
        value: ctx
      });
      // execute the script
      (function () { eval(script) }.bind(ctx))();
      // we add the event listener once and don't remove it in the diconnectedCallback
      // because it is possbile that contents may change in the disconnected state
      // * see slotchange event: https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/slotchange_event
      // * see bubbling up shadow DOM events: https://javascript.info/shadow-dom-events
      this.addEventListener('slotchange', ctx.onSlotChange);
      // call component lifecycle methods
      this.connectedCallback();
      Object.entries(props).forEach(([name, value]) =>
        this.attributeChangedCallback(name, null, value)
      );
    }
  }

  class C extends HTMLElement {

    /**
     * document.createElement('my-element') creates a new instance of the custom element
     * by calling this constructor.
     * Because attributes may be added later, we need to initialize the properties lazily
     * in the connectedCallback.
     */
    constructor() {
      super();
      // Lazily initialize  properties, see https://developers.google.com/web/fundamentals/web-components/best-practices#lazy-properties
      // Properties reflect attribute values, that way cycles are prevented. If the attribute is not set, we use a default value.
      // Caution: If both attribute and property are set, we need to bite the bullet and the attribute value is used.
      Object.entries(props).forEach(([prop, defaultValue]) => {
        let value = defaultValue;
        if (this.hasOwnProperty(prop)) {
          value = this[prop];
          delete this[prop];
        }
        createProperty(this, prop, defaultValue);
        if (!this.hasAttribute(prop)) {
          this[prop] = value;
        }
      });
      // perform lazy initialization
      initialize.bind(this)();
    }

    static get observedAttributes() {
      return Object.keys(props);
    }

    // Called when the element is inserted into the DOM.
    connectedCallback() {
      call(this[__ctx]?.onMount);
    }

    // Called when the element is removed from the DOM.
    disconnectedCallback() {
      call(this[__ctx]?.onUnmount);
    }

    /**
     * Called when an attribute is added, removed, or updated.
     * 
     * @param {string} name
     * @param {string | null} oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      (newValue !== oldValue) &&
        call(this[__ctx].onUpdate, name, oldValue, newValue);
    }

    // Called when the element is moved to a new document.
    adoptedCallback() {
      call(this[__ctx]?.onAdopt);
    }

  }

  return C;
}

/**
 * Creates a new custom element property that reflects the attribute value.
 * We add special handing for boolean attributes.
 * 
 * @param {HTMLElement} el the element
 * @param {string} prop the property name
 * @param {any} defaultValue the default value
 */
function createProperty(el, prop, defaultValue) {
  const descriptor = (typeof defaultValue === 'boolean') ? ({
    get: () =>  el.hasAttribute(prop),
    set: (value) => value ? el.setAttribute(prop, '') : el.removeAttribute(prop),
    enumerable: true
  }) : ({
    get: () => el.getAttribute(prop),
    set: (value) => (value === null || value === undefined) ? el.removeAttribute(prop) : el.setAttribute(prop, value),
    enumerable: true
  });
  Object.defineProperty(el, prop, descriptor);
}
