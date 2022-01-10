// @ts-check

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
 * A function that processes all custom elements in the document.
 */
export default () => {

  document.querySelectorAll("web-component").forEach(elem => {

    try {

      // perform checks on the element
      const name = elem.getAttribute('name');
      if (name === null) {
        console.warn("[candid] Missing custom element name.", elem);
        return;
      }
      if (!isValidName(name)) {
        console.warn("[candid] Invalid custom element name: '" + name + "'. See https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name", elem);
        return;
      }
      const mode = elem.getAttribute('mode');
      if (mode !== null && mode !== 'open' && mode !== 'closed') {
        console.warn("[candid] Invalid shadowRoot mode: '" + mode + "'. Valid values are 'open', 'closed' (or omit attribute). See https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/mode", elem);
        return;
      }
      const props = elem?.hasAttribute('props') && eval('(' + elem.getAttribute('props') + ')') || {};
      if (props === null || typeof props !== 'object') {
        console.warn("[candid] Invalid props: '" + props + "'. Must be an object.", elem);
        return;
      }

      // create class and register custom element
      const template = elem.querySelector('template');
      const C = createClass(props, mode, template);
      customElements.define(name, C);

    } catch (err) {
      console.error("[candid] Error processing custom element:", elem, err);
    }

  });

  // inform window that candid initialization is complete
  window.dispatchEvent(new Event('candid-ready'));

}

/**
 * Creates a new custom element class from the given template.
 * 
 * @param {object} props
 * @param {?string} mode shadow root mode
 * @param {?HTMLTemplateElement} template 
 * @returns a new custom element class
 */
function createClass(props, mode, template) {

  // the script contents are read once but evaluated every time the element is created
  const script = template && Array.from(template.content.querySelectorAll("script")).map(s =>
    s.parentNode.removeChild(s).textContent
  ).join('\n');

  // Custom element class
  class C extends HTMLElement {

    /** @type {ShadowRoot | HTMLElement} */
    root;

    /** stateful object, altered by <script lang="candid"> */
    onMount = () => {};
    onUnmount = () => {};
    onUpdate = (name, oldValue, newValue) => {};
    onAdopt = () => {};

    constructor() {
      super();
      // the script may not access the _root during construction time
      if (script) {
        (function () { eval(script) }.bind(this))(); // the script's scope is the element's state
      }
      // initialize _root
      const content = template.content.cloneNode(true);
      this.root = (mode === 'open' || mode === 'closed') ? this.attachShadow({  mode }) : this;
      this.root.appendChild(content);
    }

    static get observedAttributes() {
      return Object.keys(props);
    }

    connectedCallback() {
      if (!this.isConnected) {
        return;
      }
      Object.entries(props).forEach(([prop, value]) => {
        // make properties lazy, see https://developers.google.com/web/fundamentals/web-components/best-practices#lazy-properties
        if (this.hasOwnProperty(prop)) {
          const value = this[prop];
          delete this[prop];
          this[prop] = value;
        }
        // set default value if attribute is not set
        if (!this.hasAttribute(prop)) {
          this[prop] = value;
        }
      }, this);
      this.onMount();
    }

    disconnectedCallback() {
      this.onUnmount();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      this.onUpdate(name, oldValue, newValue);
    }

    adoptedCallback() {
      this.onAdopt();
    }

  }

  // dynamically add getters and setters for element attributes
  Object.entries(props).forEach(([prop, defaultValue]) => {
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
      }
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
      }
    });
    Object.defineProperty(C.prototype, prop, propertyDescriptor);
  });

  return C;
}
