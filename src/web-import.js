// @ts-check
import { extractBaseUrl, createUrl } from './urls';

/**
 * High-level <web-import> functionality.
 * The contents of the <web-import> element are imported and inserted into the DOM.
 * There is no internal caching, multiple imports of the same URL are all loaded.
 * 
 * @param {string} baseUrl the base path
 * @param {WithQuerySelectorAll} element an element to process
 * @param {?boolean} debug whether to enable debug mode
 * 
 * @typedef {Node & { querySelectorAll: (selector: any) => NodeListOf<any> }} WithQuerySelectorAll
 */
export async function webImport(baseUrl, element, debug) {
  const elements = element.querySelectorAll('web-import');
  await Promise.allSettled(Array.from(elements).map(async (el) => {
    if (!el.getAttribute('status')) {
      el.setAttribute('status', 'loading');
      try {
        const link = el.getAttribute('src');
        const resourceUrl = createUrl(baseUrl, link);
        // TODO: add options to fetch, like crossorigin, credentials, mode, cache, redirect, referrer, integrity, keepalive, window, etc.
        const response = await fetch(resourceUrl + '?timestamp=' + Date.now()); // TODO(@@dd): remove timestamp
        if (response.ok) {
          const content = await response.text();
          const fragment = document.createRange().createContextualFragment(content);
          const newBaseUrl = extractBaseUrl(resourceUrl);
          // recurse before connecting the fragment to the live DOM
          await webImport(newBaseUrl, fragment, debug);
          if (debug) {
            el.innerHTML = ''; // reset content
            el.appendChild(fragment);
          } else {
            el.parentNode.replaceChild(fragment, el);
          }
          el.setAttribute('status', 'ok');
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
