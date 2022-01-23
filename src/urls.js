// @ts-check

/**
 * @returns {string} the base URL of the actual document
 */
export function getBaseUrl() {
  const base = document.head.querySelector("base");
  if (base) {
    return base.href;
  }
  return document.URL;
}

/**
 * Strips the base URL from the given URL.
 * 
 * @param {string} href 
 * @returns {string}
 */
export function extractBaseUrl(href) {
  return href.substring(0, href.lastIndexOf('/')) + "/";
}

/**
 * Returns an url that is relative to the given base URL.
 * 
 * @param {string} baseUrl a base URL
 * @param {string} href a URL
 * @returns href relative to base
 */
export function createUrl(baseUrl, href) {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }
  return href.startsWith('/')
    ? baseUrl.endsWith('/') ? baseUrl + href.substring(1) : baseUrl + href
    : baseUrl.endsWith('/') ? baseUrl + href : baseUrl + '/' + href;
}
