// @ts-check

import { extractBaseUrl, createUrl } from './urls';

/**
 * High-level web import functionality.
 * The contents of the web import element are imported and inserted into the DOM.
 * There is no internal caching, multiple imports of the same URL are all loaded.
 * 
 * @param {string} baseUrl the base path
 * @param {Element | DocumentFragment} element an element to process
 * @param {import('.').ComponentProcessor} componentProcessor
 * @returns {Promise<void>}
 */
export async function processWebImports(baseUrl, element, componentProcessor) {
  const elements = element.querySelectorAll('web-import');
  await Promise.allSettled([...elements].map(async (el) => {
    if (!el.getAttribute('status')) {
      el.setAttribute('status', 'loading');
      try {
        const link = el.getAttribute('src');
        const resourceUrl = createUrl(baseUrl, link);
        const response = await fetch(resourceUrl);
        if (response.ok) {
          const content = await response.text();
          const fragment = document.createRange().createContextualFragment(content);
          const newBaseUrl = extractBaseUrl(resourceUrl);
          // recurse before connecting the fragment to the live DOM
          await componentProcessor(newBaseUrl, fragment);
          el.parentNode.replaceChild(fragment, el);
        } else {
          logError(el, `${response.status} ${response.statusText}`);
        }
      } catch (error) {
        logError(el, error);
      }
    }
  }));
}

function logError(element, error) {
  console.error("[candid] web import error", element, error);
  element.setAttribute('status', 'error');
  element.setAttribute('message', JSON.stringify(error));
}
