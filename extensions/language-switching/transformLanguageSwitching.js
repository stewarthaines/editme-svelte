/**
 * Language switching: promote `lang-<tag>` CSS classes into real `lang` and
 * `xml:lang` attributes so reading systems render and pronounce multilingual
 * runs correctly. Authors mark inline foreign-language spans with a class like
 * `lang-fr` or `lang-ja`; this copies the tag onto both attributes (HTML `lang`
 * and XML `xml:lang`, both required for broad EPUB reader support).
 *
 * @param {Document} htmlDocument - the chapter's rendered DOM
 * @param {string} idref - spine item id for this chapter
 * @param {object} [ctx] - transform context (unused)
 */
function transformDOM(htmlDocument, idref, ctx) {
  htmlDocument.body.querySelectorAll('[class*=lang-]').forEach(el => {
    const lang = el.className.match(/(?:^|\s)lang-(\S+)/)?.[1] ?? '';
    el.setAttribute('xml:lang', lang);
    el.setAttribute('lang', lang);
  });
  return htmlDocument;
}
