/**
 * Generator: insert a concise Djot syntax example — the constructs a chapter
 * author reaches for first, including an attributed span (verified against the
 * bundled djot.js).
 *
 * @param {object} ctx - generator context (unused; fixed content)
 * @param {object} options - values from the invocation form (none)
 * @returns {string} source text to insert at the caret
 */
function generateText(ctx, options) {
  return (
    '## Section heading\n' +
    '\n' +
    'A paragraph with *strong*, _emphasised_ and `verbatim` text,\n' +
    'and a [link](https://djot.net/).\n' +
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
    'A styled span with attributes: [classy]{.fancy}\n'
  );
}
