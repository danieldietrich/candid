// @ts-check
import { getBaseUrl } from './urls';
import { validate } from './validation';
import { webImport } from './web-import';

/**
 * @typedef {import('./web-import').WithQuerySelectorAll} WithQuerySelectorAll
 */

/**
 * Candid entry point.
 * 
 * @param {Options} options
 * 
 * @typedef {{
 *   debug?: boolean,                    // debug mode
 *   elementProcessor?: ElementProcessor // process web-imported elements
 * }} Options
 * 
 * @typedef {(...elements: Element[]) => Promise<void>} ElementProcessor
 */
export default async (options) => {
  const { debug, elementProcessor } = options;
  const root = document.documentElement;
  const processor = createProcessor(elementProcessor, debug);
  await processor(getBaseUrl(), root);
};

/**
 * Creates processor function for web-components and web-imports.
 * 
 * @param {?ElementProcessor} elementProcessor 
 * @param {?boolean} debug
 * @returns {(baseUrl: string, element: Element) => Promise<void>}
 */
function createProcessor(elementProcessor, debug) {
  const componentProcessor = async (baseUrl, element) => {
    await webImport(baseUrl, element, debug);
    process(baseUrl, element, elementProcessor, componentProcessor, debug);
  };
  return componentProcessor;
}

/**
 * Processes <web-component> tags by creating and registering a new custom element class.
 * 
 * @param {string} baseUrl the base path
 * @param {Element | DocumentFragment} element an element to process
 * @param {?ElementProcessor} elementProcessor
 * @param {(baseUrl: string, element: WithQuerySelectorAll) => Promise<void>} componentProcessor
 * @param {?boolean} debug whether to enable debug mode
 */
function process(baseUrl, element, elementProcessor, componentProcessor, debug) {
  element.querySelectorAll("web-component").forEach(elem => {
    try {
      const name = elem.getAttribute('name');
      const mode = elem.getAttribute('mode');
      const props = parseProps(elem.getAttribute('props'));
      const template = elem.querySelector('template');
      const validationResult = validate({ name, mode, props, template });
      if (validationResult.length) {
        validationResult.forEach(msg => console.warn('[candid] ' + msg, elem));
        return;
      }
      const { script } = processTemplate(template, elementProcessor);
      const C = createClass(baseUrl, template, mode, props || {}, script, componentProcessor);
      customElements.define(name, C); // throws if name is already registered, see https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define#exceptions
    } catch (err) {
      console.error("[candid] Error processing web component:", elem, err);
    }
  });
}

/**
 * Parses the given string into an object.
 * 
 * @param {string | null} str
 * @returns {any} the result of parsing the string
 * @throws {any} if the string cannot be evaluated
 */
function parseProps(str) {
  // We parse the props by using eval instead of JSON.parse, because the latter is too restrictive.
  // The props are evaluated before connectedCallback, so they can be used in the static observedAttributes function.
  return str && eval('(' + str + ')');
}

/**
 * Processes the template contents of the web component.
 * 
 * @param {?HTMLTemplateElement} template
 * @param {?ElementProcessor} elementProcessor
 * @return {{ script?: string }}
 */
function processTemplate(template, elementProcessor) {
  // apply the injected elementProcessor to the template content
  template && elementProcessor && elementProcessor(...template.content.querySelectorAll('*'));
  // the script contents are read once but evaluated every time the element is created
  const script = template && [...template.content.querySelectorAll("script")].map(s =>
    s.parentNode.removeChild(s).textContent
  ).join(';\n'); // add ; to avoid syntax errors
  return { script };
}

/**
 * The internal element property that is used to store the component's context,
 * consisting of state and lifecycle methods.
 * The context is altered by user defined <script> tags in the template.
 */
const __ctx = Symbol();

/**
 * Creates a new custom element class from the given template.
 * 
 * @param {string} baseUrl the base path
 * @param {?HTMLTemplateElement} template 
 * @param {?string} mode shadow root mode
 * @param {?object} props default props
 * @param {string} script the script contents
 * @param {(baseUrl: string, element: WithQuerySelectorAll) => Promise<void>} componentProcessor
 * @returns a new custom element class
 */
function createClass(baseUrl, template, mode, props, script, componentProcessor) {

  let processed = false;

  class C extends HTMLElement {

    /**
     * document.createElement('my-element') creates a new instance of the custom element
     * by calling this constructor.
     * Because attributes may be added later, we need to initialize the properties lazily
     * in the connectedCallback.
     */
    constructor() {
      super();
      // if mode === 'closed', shadowRoot is null but root is defined!
      const root = (mode === 'open' || mode === 'closed') ? this.attachShadow({ mode }) : this;
      /** @ts-ignore @type {DocumentFragment} */
      const content = template.content.cloneNode(true);
      if (!processed) {
        componentProcessor(baseUrl, content).then(() => {
          processed = true;
          customElements.upgrade(this); // TODO(@@dd): are callbacks called in the correct order when upgrading this element?
        });
      }
      root.appendChild(template.content.cloneNode(true));
      Object.defineProperty(this, __ctx, {
        value: createContext(this, root)
      });
      // Run user <script> and define lifecycle methods as early as possible.
      // Anything may happen here but the user must not rely on a fully initialized component.
      // Especially, the user script should not try to access the DOM or the element attributes.
      //
      if (script) {
        (function () { eval(script) }.bind(this[__ctx]))();
      }
    }

    static get observedAttributes() {
      return Object.keys(props);
    }

    // Called when the element is inserted into the DOM.
    connectedCallback() {
      if (!this.isConnected || !processed) {
        return;
      }
      // An element might be added (connected) to and removed (disconnected) multiple times from the DOM.
      // We guard against multiple initializations using the __uninitialized context property.
      if (this[__ctx].__uninitialized) {
        delete this[__ctx].__uninitialized;
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
      }
      // See slotchange event: https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/slotchange_event
      // See bubbling up shadow DOM events: https://javascript.info/shadow-dom-events
      // We add the event listener once and don't remove it in the diconnectedCallback because it is possbile that contents may change in the disconnected state
      this.addEventListener('slotchange', this[__ctx].onSlotChange);
      this[__ctx].onMount();
    }

    // Called when the element is removed from the DOM.
    disconnectedCallback() {
      if (processed) {
        this[__ctx].onUnmount();
        this.removeEventListener('slotchange', this[__ctx].onSlotChange);
      }
    }

    // Called when an attribute is added, removed, or updated.
    attributeChangedCallback(name, oldValue, newValue) {
      if (processed) {
        this[__ctx].onUpdate(name, oldValue, newValue);
      }
    }

    // Called when the element is moved to a new document.
    adoptedCallback() {
      if (processed) {
        this[__ctx].onAdopt();
      }
    }

  }

  return C;
}

/**
 * Creates a new custom element property that reflects the attribute value.
 * 
 * @param {HTMLElement} target the element
 * @param {string} prop the property name
 * @param {any} defaultValue the default value
 */
function createProperty(target, prop, defaultValue) {
  const propertyDescriptor = (typeof defaultValue === 'boolean') ? ({
    get() {
      return this.hasAttribute(prop);
    },
    set(value) {
      if (value) {
        this.setAttribute(prop, '');
      } else {
        this.removeAttribute(prop);
      }
    },
    enumerable: true
  }) : ({
    get() {
      return this.getAttribute(prop);
    },
    set(value) {
      if (value === null || value === undefined) {
        this.removeAttribute(prop);
      } else {
        this.setAttribute(prop, value);
      }
    },
    enumerable: true
  });
  Object.defineProperty(target, prop, propertyDescriptor);
}

/**
 * Creates a new custom element context.
 * Root is either the element's shadowRoot or the element itself.
 * 
 * @param {HTMLElement} element
 * @param {ShadowRoot | HTMLElement} root
 * @return {Context}
 * 
 * @typedef {{
 *   __uninitialized: boolean,
 *   readonly element: HTMLElement, // the custom element class instance
 *   readonly root: ShadowRoot | HTMLElement, // root = (element.shadowRoot ? element.shadowRoot : element)
 *   onMount: () => void,
 *   onUnmount: () => void,
 *   onUpdate: (name: string, oldValue: string | null, newValue: string | null) => void,
 *   onSlotChange: (event: any) => void,
 *   onAdopt: () => void
 * }} Context
 */
function createContext(element, root) {
  const context = {
    __uninitialized: true, // marker, will be removed in connectedCallback
    element,
    root,
    onMount() { },
    onUnmount() { },
    onUpdate(name, oldValue, newValue) { },
    onSlotChange(event) { },
    onAdopt() { }
  };
  return Object.defineProperties(context, {
    element: {
      configurable: false,
      enumerable: true,
      writable: false
    },
    root: {
      configurable: false,
      enumerable: true,
      writable: false
    }
  });
}
