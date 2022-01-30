// @ts-check

import { call } from './functions';
import { getBaseUrl } from './urls';
import { processWebComponents } from './web-component';
import { processWebImports } from './web-import';

/**
 * Candid entry point.
 * Processes the document and creates a custom element class for each web component.
 * 
 * @param {Options} options
 * @returns {Promise<void>}
 * 
 * @typedef {{
 *   elementProcessor?: ElementProcessor // process web-imported elements
 * }} Options
 * 
 * @typedef {(baseUrl: string, element: Element | DocumentFragment) => Promise<void>} ComponentProcessor
 * 
 * @typedef {(element: Element | DocumentFragment) => Promise<void>} ElementProcessor
 */
export default async function(options) {
  const { elementProcessor } = Object.assign({}, options);
  /** @type {ComponentProcessor} */
  const componentProcessor = async (baseUrl, element) => {
    call(elementProcessor, element);
    processWebComponents(baseUrl, element, componentProcessor);   
    await processWebImports(baseUrl, element, componentProcessor);
  };
  await componentProcessor(getBaseUrl(), document);
}
