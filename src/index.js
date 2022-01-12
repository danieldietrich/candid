// @ts-check

// global store of visited web imports
const webImports = new Set();

//
// CANDID
//
export default async () => {
  await webImport(getBaseUrl(), document, webImports);
  process();
};

/**
 * Check if the given name is a valid custom element name.
 * 
 * @param {string} name
 * @return true if name is a valid custom element identifier, false otherwise
 */
const isValidName = (() => {
  // see https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
  const PCENChar = "[-\.0-9_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}]"
  const regexp = new RegExp(`^[a-z]${PCENChar}*-${PCENChar}*$`, 'u');
  const reservedWords = ['annotation-xml', 'color-profile', 'font-face', 'font-face-src', 'font-face-uri', 'font-face-format', 'font-face-name', 'missing-glyph'];
  return (name) => regexp.test(name) && !reservedWords.includes(name);
})();

/**
 * High-level <web-component> functionality.
 */
function process() {

  document.querySelectorAll("web-component").forEach(elem => {

    try {

      // Check custom element name
      const name = elem.getAttribute('name');
      if (name === null) {
        console.warn("[candid] Missing custom element name.", elem);
        return;
      }
      if (!isValidName(name)) {
        console.warn("[candid] Invalid custom element name: '" + name + "'. See https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name", elem);
        return;
      }

      // Check shadow root mode
      const mode = elem.getAttribute('mode');
      if (mode !== null && mode !== 'open' && mode !== 'closed') {
        console.warn("[candid] Invalid shadowRoot mode: '" + mode + "'. Valid values are 'open', 'closed' (or omit attribute). See https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/mode", elem);
        return;
      }

      // We parse the props by using eval instead of JSON.parse, because the latter is too restrictive.
      // The props are evaluated before connectedCallback, so they can be used in the static observedAttributes function.
      const props = elem?.hasAttribute('props') && eval('(' + elem.getAttribute('props') + ')') || {};
      if (props === null || typeof props !== 'object') {
        console.warn("[candid] Invalid props: '" + props + "'. Must be an object.", elem);
        return;
      }

      // Create class and register custom element
      const template = elem.querySelector('template');
      const C = createClass(template, mode, props);
      customElements.define(name, C);

    } catch (err) {
      console.error("[candid] Error processing custom element:", elem, err);
    }

  });

}

/**
 * The internal element property that is used to store the component context,
 * consisting of state and lifecycle methods.
 * The context is altered by the user <script> tags in the template.
 */
const __ctx = Symbol();

/**
 * Creates a new custom element class from the given template.
 * 
 * @param {?HTMLTemplateElement} template 
 * @param {?string} mode shadow root mode
 * @param {?object} props default props
 * @returns a new custom element class
 */
function createClass(template, mode, props) {

  // the script contents are read once but evaluated every time the element is created
  const script = template && Array.from(template.content.querySelectorAll("script")).map(s =>
    s.parentNode.removeChild(s).textContent
  ).join(';\n'); // add ; to avoid syntax errors

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
      const root = (mode === 'open' || mode === 'closed') ? this.attachShadow({  mode }) : this;
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
      if (!this.isConnected) {
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
      this[__ctx].onUnmount();
      this.removeEventListener('slotchange', this[__ctx].onSlotChange);
    }

    // Called when an attribute is added, removed, or updated.
    attributeChangedCallback(name, oldValue, newValue) {
      this[__ctx].onUpdate(name, oldValue, newValue);
    }

    // Called when the element is moved to a new document.
    adoptedCallback() {
      this[__ctx].onAdopt();
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
    onMount() {},
    onUnmount() {},
    onUpdate(name, oldValue, newValue) {},
    onSlotChange(event) {},
    onAdopt() {}
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

/**
 * High-level <web-import> functionality.
 * 
 * @param {string} base the base path
 * @param {Element | DocumentFragment} element a node to import
 * @param {Set} visited a set of imported urls
 */
async function webImport(base, element, visited) {
  await Promise.all(Array.from(element.querySelectorAll('web-import')).map(async (el) => {
      switch (el.getAttribute('status')) {
        case 'loading':
          break;
        case 'error':
          break;
        default:
          el.setAttribute('status', 'loading');
          try {
            const href = el.getAttribute('href');
            const resourceUrl = createUrl(base, href);
            if (visited.has(resourceUrl)) {
              break;
            } else {
              visited.add(resourceUrl);
            }
            // TODO: add options to fetch, like crossorigin, credentials, mode, cache, redirect, referrer, integrity, keepalive, window, etc.
            const response = await fetch(resourceUrl);
            if (response.ok) {
              const content = await response.text();
              const fragment = document.createRange().createContextualFragment(content);
              const newBaseUrl = extractBaseUrl(resourceUrl);
              await webImport(newBaseUrl, fragment, visited);
              el.parentNode.replaceChild(fragment, el);
            } else {
              el.setAttribute('status', 'error');
              el.textContent = `${response.status} ${response.statusText}`;
            }
          } catch (error) {
            el.setAttribute('status', 'error');
            el.textContent = error.message;
          }
      }
  }));
}

/**
 * Strips the base URL from the given URL.
 * 
 * @param {string} href 
 * @returns {string}
 */
function extractBaseUrl(href) {
  return href.substring(0, href.lastIndexOf('/')) + "/";
}

/**
 * Returns an url that is relative to the given base URL.
 * 
 * @param {string} base a base URL
 * @param {string} href a URL
 * @returns href relative to base
 */
function createUrl(base, href) {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  } else if (href.startsWith('/')) {
    return base.endsWith('/') ? base + href.substring(1) : base + href;
  } else {
    return base.endsWith('/') ? base + href : base + '/' + href;
  }
}

/**
 * @returns {string} the base URL of the actual document
 */
function getBaseUrl() {
  const base = document.head.querySelector("base");
  if (base) {
    return base.href;
  }
  return document.URL;
}
