/**
 * WebImport declares the autonomous custom element <web-import>.
 */
export class WebImport extends HTMLElement {
    connectedCallback() {
        webImport(this);
    }
}

export async function webImport(e: Element) {
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
        console.error(e, response.status, await response.text());
    }
}

function createUrl(link: string | null, baseUrl: string = document.head.baseURI): string {
    return new URL(link || '/', baseUrl).toString();
}
