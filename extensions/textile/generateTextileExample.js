/**
 * Generator: insert a concise Textile syntax example — the constructs a
 * chapter author reaches for first, including a classed paragraph (verified
 * against the bundled textile-js).
 *
 * @param {object} ctx - generator context (unused; fixed content)
 * @param {object} options - values from the invocation form (none)
 * @returns {string} source text to insert at the caret
 */
function generateText(ctx, options) {
  return (
    'h2. Section heading\n' +
    '\n' +
    'A paragraph with *strong*, _emphasised_ and @monospace@ text,\n' +
    'and a "link":https://textile-lang.com/.\n' +
    '\n' +
    'h3. Subsection\n' +
    '\n' +
    '* an unordered item\n' +
    '* another item\n' +
    '\n' +
    '# first ordered item\n' +
    '# second ordered item\n' +
    '\n' +
    'bq. A block quote.\n' +
    '\n' +
    'bc. a code block\n' +
    '\n' +
    'p(fancy). A paragraph carrying a CSS class.\n'
  );
}
