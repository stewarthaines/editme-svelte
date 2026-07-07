/**
 * Responsive layout hooks. All layout policy lives in Styles/responsive.css; this
 * transform only guarantees the markup the stylesheet needs:
 *
 *   1. The chapter's body content is wrapped in <div class="sr-page"> — the
 *      reading-measure hook. A dedicated wrapper (rather than styling <body>)
 *      keeps the rules clear of reading-system user-setting overrides, which
 *      commonly rewrite body margins.
 *   2. Each <figure> is wrapped in <div class="sr-figure"> — the container-query
 *      container. The figure itself must stay a *descendant* of the container so
 *      @container rules can restyle it; an element cannot query its own size.
 *
 * Deliberately NOT here: `container-type` on .sr-page. Inline-size containment
 * wrapped around an entire chapter has a history of breaking fragmentation in
 * column-paginated reading systems (content clips instead of flowing to the next
 * page), so containment is applied only to the small .sr-figure wrappers, in CSS.
 *
 * Both wraps are idempotent — re-running the pipeline over already-transformed
 * content changes nothing.
 *
 * @param {Document} htmlDocument - the chapter's rendered DOM (HTML)
 * @param {string} idref - spine item id for this chapter
 * @param {object} ctx - transform context (unused)
 */
async function transformDOM(htmlDocument, idref, ctx) {
  const XHTMLNS = 'http://www.w3.org/1999/xhtml';
  const body = htmlDocument.body;
  if (!body) return htmlDocument;

  // 1. Reading-measure wrapper (skip when this chapter is already wrapped).
  if (!(body.children.length === 1 && body.children[0].classList.contains('sr-page'))) {
    const page = htmlDocument.createElementNS(XHTMLNS, 'div');
    page.setAttribute('class', 'sr-page');
    while (body.firstChild) page.appendChild(body.firstChild);
    body.appendChild(page);
  }

  // 2. Figure containers (skip figures already inside one).
  for (const figure of [...htmlDocument.querySelectorAll('figure')]) {
    if (figure.parentElement && figure.parentElement.classList.contains('sr-figure')) continue;
    const wrapper = htmlDocument.createElementNS(XHTMLNS, 'div');
    wrapper.setAttribute('class', 'sr-figure');
    figure.replaceWith(wrapper);
    wrapper.appendChild(figure);
  }

  return htmlDocument;
}
