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
 * @param {string} url 
 * @returns {string}
 */
export function extractBaseUrl(url) {
  return url.substring(0, url.lastIndexOf('/')) + "/";
}

/**
 * Returns an url that is relative to the given base URL.
 * 
 * @param {string} baseUrl a base URL
 * @param {string} url an absolute or relative URL
 * @returns url relative to base
 */
export function createUrl(baseUrl, url) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return url.startsWith('/')
    ? baseUrl.endsWith('/') ? baseUrl + url.substring(1) : baseUrl + url
    : baseUrl.endsWith('/') ? baseUrl + url : baseUrl + '/' + url;
}
