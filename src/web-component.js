// @ts-check

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
      const superTag = elem.getAttribute('extends')?.toLocaleLowerCase();
      const template = elem.querySelector('template');
      // dynamically creates a custom element class based on the <web-component> declaration
      const CustomElement = createClass(baseUrl, template, mode, props, superTag, componentProcessor);
      // trigger instantiation of custom elements ${name} in the document
      const options = superTag ? { extends: superTag } : undefined;
      customElements.define(name, CustomElement, options);
    } catch (err) {
      console.error("[candid] Error processing web component:", elem, err);
    }
  });
}

/**
 * The internal element property this[__ctx] that is used to store the web component's context,
 * consisting of state and lifecycle methods.
 * The context is altered by user defined script tags in the template.
 *
 * @typedef {{
 *   element: HTMLElement
 *   root: HTMLElement
 *   onMount?: () => void
 *   onUnmount?: () => void
 *   onUpdate?: (name: string, oldValue: string | null, newValue: string | null) => void
 *   onAdapted?: () => void
 *   onSlotChange?: () => void
 * }} WebComponentContext
 */
const __ctx = Symbol();

/**
 * The initialization state of the web component this[__ready] is undefined, false or true.
 *
 * @typedef {string | undefined} WebComponentState
 */
const __ready = Symbol();

/**
 * Creates a new custom element class from the given template.
 *
 * @param {string} baseUrl the base path
 * @param {?HTMLTemplateElement} template 
 * @param {?string} mode shadow root mode
 * @param {?object} props default props
 * @param {?string} superTag super html element tag name
 * @param {ComponentProcessor} componentProcessor
 * @returns {CustomElementConstructor} a new custom element class
 */
function createClass(baseUrl, template, mode, props, superTag, componentProcessor) {

  const state = {

    /**
     * The web component template processor is lazily loading web imports.
     * @type {Promise | true | undefined}
     */
    processor: undefined,

    /**
     * The script is extracted from the template and evaluated on web component instantiation.
     * @type {string | undefined}
     */
    script: undefined

  };

  /**
   * The super type of the web component.
   */
  // TODO(@@dd): add validation that superType not instanceof HTMLUnknownElement
  const superType = superTag ? document.createElement(superTag).constructor : HTMLElement;

  /**
   * document.createElement('my-element') creates a new instance of the custom element
   * by calling this constructor.
   * Because attributes may be added later, we need to initialize the properties lazily
   * in the connectedCallback.
   */
  function CustomElement() {
    // Same as super(), superType.call(this) does not work for custom elements.
    // Reflect.construct returns a `self` pointer which is the same as `this`.
    // See https://github.com/whatwg/html/issues/1704#issuecomment-241867654
    const self = Reflect.construct(superType, [], CustomElement);
    if (!state.processor && template) {
      // start to lazily load web-imports before the component is connected to the DOM
      state.processor = componentProcessor(baseUrl, template.content);
    }
    // if mode === 'closed', shadowRoot is null but root is defined!
    const root = (mode === 'open' || mode === 'closed') ? self.attachShadow({ mode }) : self;
    /** @type {WebComponentContext} */
    self[__ctx] = {
      element: self,
      root
    };
    return self;
  }

  CustomElement.prototype = Object.create(superType.prototype, {
    constructor: {
      value: CustomElement
    },
    connectedCallback: {
      /**
       * Called when the element is inserted into the DOM.
       */
      value() {
        (this[__ready] === undefined)
          ? initialize(this, template, props, state)
          : (this[__ready] && this[__ctx].onMount?.call(this[__ctx]));
      }
    },
    disconnectedCallback: {
      /**
       * Called when the element is inserted into the DOM.
       */
      value() {
        this[__ready] && this[__ctx].onUnmount?.call(this[__ctx]);
      }
    },
    attributeChangedCallback: {
      /**
       * Called when an attribute is added, removed, or updated.
       *
       * @param {string} name
       * @param {string | null} oldValue
       * @param {string | null} newValue
       */
      value(name, oldValue, newValue) {
        this[__ready] && (newValue !== oldValue) && this[__ctx].onUpdate?.call(this[__ctx], name, oldValue, newValue);
      }
    },
    adoptedCallback: {
      /**
       * Called when the element is moved to a new document.
       */
      value() {
        this[__ready] && this[__ctx].onAdopt?.call(this[__ctx]);
      }
    }
  });

  // define static method
  Object.defineProperty(CustomElement, 'observedAttributes', {
    value: Object.keys(props)
  });

  // @ts-ignore (the compiler does not know that we use prototype based inheritance)
  return CustomElement;

}

/**
 * The initialization of the web component should run only once.
 *
 * @param {*} element
 */
async function initialize(element, template, props, state) {
  element[__ready] = false; // false prevents reentrance
  const ctx = element[__ctx];
  initializeProperties(element, props);
  if (template) {
    await state.processor; state.processor = true; // all instances will wait for the component to be processed
    processTemplate(template, ctx, state);
  }
  registerListeners(ctx, element); // even if there are no children (aka template), the element might be interested in events
  element[__ready] = true; // fully initialized
  // call custom element lifecycle methods, they will delegate now to the ctx lifecycle methods
  element.connectedCallback();
  Object.entries(props).forEach(([name, value]) =>
    element.attributeChangedCallback(name, null, value)
  );
}

// Lazily initialize  properties, see https://developers.google.com/web/fundamentals/web-components/best-practices#lazy-properties
// Properties reflect attribute values, that way cycles are prevented. If the attribute is not set, we use a default value.
// Caution: If both attribute and property are set, we need to bite the bullet and the attribute value is used.
function initializeProperties(element, props) {
  Object.entries(props).forEach(([prop, defaultValue]) => {
    let value = defaultValue;
    if (element.hasOwnProperty(prop)) {
      value = element[prop];
      delete element[prop];
    }
    createProperty(element, prop, defaultValue);
    if (!element.hasAttribute(prop)) {
      element[prop] = value;
    }
  });
}

/**
 * Clone template to (shadow) root and run scripts.
 *
 * @param {HTMLTemplateElement} template
 * @param {WebComponentContext} ctx
 */
function processTemplate(template, ctx, state) {
  // remove the script from the template before cloning the template
  if (state.script === undefined) {
    state.script = [...template.content.querySelectorAll("script")].map(s =>
      s.parentNode.removeChild(s).textContent
    ).join(';\n'); // add semicollon to avoid syntax ambiguities when joining multiple scripts
  }
  // the template has been processed and the script has been removed, it is ready to be cloned
  const content = template.content.cloneNode(true);
  ctx.root.appendChild(content);
  // execute the script
  (function () { eval(state.script) }.bind(ctx))();
}

/**
 * Register custom element event listeners.
 *
 * @param {*} ctx
 * @param {*} element
 */
function registerListeners(ctx, element) {
  // we add the event listener once and don't remove it in the diconnectedCallback
  // because it is possbile that contents may change in the disconnected state
  // * see slotchange event: https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/slotchange_event
  // * see bubbling up shadow DOM events: https://javascript.info/shadow-dom-events
  ctx.onSlotChange && element.addEventListener('slotchange', ctx.onSlotChange);
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
