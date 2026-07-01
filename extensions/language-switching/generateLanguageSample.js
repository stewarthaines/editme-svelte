/**
 * Generator: insert a short multilingual sample that demonstrates the
 * LanguageSwitching transform — a foreign-language inline phrase and a
 * whole-block run, tagged with `lang-*` classes in the project's text-format
 * syntax. After rendering, transformLanguageSwitching.js turns those classes
 * into real `lang` / `xml:lang` attributes.
 *
 * The class-attribute syntax differs per format, so pick the one the project
 * authors in via the `format` option (verified against each library):
 *   - markdown (markdown-it + markdown-it-attrs): `*text*{.lang-fr}` / `text\n{.class}`
 *   - djot:                                       `[text]{.lang-fr}` / `{.class}\ntext`
 *   - textile:                                    `_(lang-fr)text_`  / `p(class). text`
 *
 * @param {object} ctx - generator context (unused; self-contained fixed content)
 * @param {object} options - values from the invocation form; `format` selects the syntax
 * @returns {string} source text to insert at the caret
 */
function generateText(ctx, options) {
  const format = ['markdown', 'djot', 'textile'].includes(options && options.format)
    ? options.format
    : 'markdown';

  if (format === 'djot') {
    return (
      'The French greeting is [bonjour]{.lang-fr}.\n\n' +
      '{.lang-de}\nDies ist ein ganzer Absatz auf Deutsch.\n\n'
    );
  }

  if (format === 'textile') {
    return (
      'The French greeting is _(lang-fr)bonjour_.\n\n' +
      'p(lang-de). Dies ist ein ganzer Absatz auf Deutsch.\n\n'
    );
  }

  // markdown (markdown-it + markdown-it-attrs): block attrs go on the line after the block.
  return (
    'The French greeting is *bonjour*{.lang-fr}.\n\n' +
    'Dies ist ein ganzer Absatz auf Deutsch.\n{.lang-de}\n\n'
  );
}
