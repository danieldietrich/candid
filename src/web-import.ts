/**
 * WebImport declares the autonomous custom element <web-import>.
 */
export class WebImport extends HTMLElement {
    constructor() {
        super();
        this.style.display = 'none';
    }
    connectedCallback() {
        webImport(this);
    }
}

export async function webImport(e: Element) {
    try {
        const url = createUrl(e.getAttribute('src'));
        const response = await fetch(url);
        if (response.ok) {
            const content = await response.text();
            const fragment = document.createRange().createContextualFragment(content);
            const newBaseUrl = url.substring(0, url.lastIndexOf('/')) + '/';
            fragment.querySelectorAll('template').forEach(t => {
                t.content.querySelectorAll('web-import').forEach(e => {
                    const src = createUrl(e.getAttribute('src'), newBaseUrl);
                    e.setAttribute('src', src);
                });
            });
            e.parentNode?.replaceChild(fragment, e);
        } else {
            console.error('[candid] web-import http error ', response.status + '\n', await response.text(), '\n', e);
        }
    } catch (err) {
        console.error('[candid] web-import network error:', err, '\n', e);
    }
}

function createUrl(link: string | null, baseUrl: string = document.head.baseURI): string {
    return new URL(link || '/', baseUrl).toString();
}
