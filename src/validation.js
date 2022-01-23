// @ts-check

/**
 * Validates the given web component attributes
 * @param {WebComponentParams} params
 * @returns {string[]} a possibly empty list of validation errors
 * 
 * @typedef {{
 *   name: string | null,
 *   mode: string | null,
 *   props: any
 * }} WebComponentParams
 */
export function validate({ name, mode, props }) {
  const result = [];

  (name === null)
    && result.push("Missing custom element name.");

  (!isValidName(name))
    && result.push("Invalid custom element name: '" + name + "'. See https://candid.link/#custom-element-name");
  
  (customElements.get(name) !== undefined)
    && result.push("Custom element name '" + name + "' is already registered.");

  (mode !== null && mode !== 'open' && mode !== 'closed')
    && result.push("Invalid shadowRoot mode: '" + mode + "'. See https://candid.link/#shadow-root-mode");

  (typeof props !== 'object' || Array.isArray(props))
    && result.push("Invalid props: '" + JSON.stringify(props) + "'. See https://candid.link/#web-component-props");

  return result;
}

// see https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
const PCENChar = "[-\.0-9_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}]"
const regexp = new RegExp(`^[a-z]${PCENChar}*-${PCENChar}*$`, 'u');
const reservedWords = [
  'annotation-xml',
  'color-profile',
  'font-face',
  'font-face-src',
  'font-face-uri',
  'font-face-format',
  'font-face-name',
  'missing-glyph'
];

/**
 * Check if the given name is a valid custom element name.
 * 
 * @param {string} name
 * @returns true if name is a valid custom element identifier, false otherwise
 */
function isValidName(name) {
  return regexp.test(name) && !reservedWords.includes(name);
}
