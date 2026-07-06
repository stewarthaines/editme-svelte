/**
 * Generator: insert a concise Markdown syntax example — the constructs a
 * chapter author reaches for first, including a markdown-it-attrs class
 * (verified against the bundled markdown-it + markdown-it-attrs).
 *
 * @param {object} ctx - generator context (unused; fixed content)
 * @param {object} options - values from the invocation form (none)
 * @returns {string} source text to insert at the caret
 */
function generateText(ctx, options) {
  return (
    '## Section heading\n' +
    '\n' +
    'A paragraph with **bold**, *italic* and `monospace` text,\n' +
    'and a [link](https://commonmark.org/).\n' +
    '\n' +
    '### Subsection\n' +
    '\n' +
    '- an unordered item\n' +
    '- another item\n' +
    '\n' +
    '1. first ordered item\n' +
    '2. second ordered item\n' +
    '\n' +
    '> A block quote.\n' +
    '\n' +
    '```\n' +
    'a fenced code block\n' +
    '```\n' +
    '\n' +
    'A styled span via markdown-it-attrs: *classy*{.fancy}\n'
  );
}
