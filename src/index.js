// @ts-check

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
 * @typedef {(baseUrl: string, element: Element | DocumentFragment) => Promise<void>} ComponentProcessor
 * 
 * @typedef {(element: Element | DocumentFragment) => Promise<void>} ElementProcessor
 */
export default async function(options) {
  const { elementProcessor } = Object.assign({}, options);
  /** @type {ComponentProcessor} */
  const componentProcessor = async (baseUrl, element) => {
    // TODO(@@dd): we want to first perform web imports and then define web components to prevent FOUC
    elementProcessor && elementProcessor(element);
    processWebComponents(baseUrl, element, componentProcessor);
    await processWebImports(baseUrl, element, componentProcessor);
  };
  const baseUrl = document.head.querySelector("base")?.href || document.URL;
  await componentProcessor(baseUrl, document);
}
