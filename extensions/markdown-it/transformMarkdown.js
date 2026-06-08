/**
 * Convert simple text to well-formed XHTML
 * @param {string} markdown - plain text
 * @param {string|undefined} idref - Spine item idref for context-aware transforms
 * @returns {string} Valid XHTML output
 */
function transformText(markdown, idref) {
  const md = window.markdownit({
    typographer: true,
    html: true,
    // highlight,
  });
  md.use(window.markdownItAttrs);
  return md.render(markdown);
}

function highlight(str, lang) {
  // Check if the language is available in highlight.js
  if (lang && hljs.getLanguage(lang)) {
  try {
    // Highlight the code and return the value
      return (
        '<pre class="code-block hljs"><code>' +
        hljs.highlight(str, { language: lang, ignoreIllegals: true })
          .value +
        "</code></pre>"
      );
    } catch (e) {
      console.error("Highlight.js error:", e);
    }
  }
  // If no language or an error occurs, return the string as is
  return str;
}
