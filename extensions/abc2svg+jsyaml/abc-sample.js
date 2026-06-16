/**
 * Generator: insert a sample of ABC music notation, wrapped in the plain-text
 * block syntax the project authors in, ready for transformABC.js to render.
 *
 * The wrapper is chosen with the `format` option:
 *   - markdown -> a fenced ```abc2svg block  (=> <pre><code class="language-abc2svg">)
 *   - textile  -> a `bc(abc2svg).` block      (=> <pre class="abc2svg"><code>)
 * Both selectors are recognised by transformABC.js.
 *
 * With `include_scales` on, a YAML frontmatter block naming several scales is
 * placed inside the code block. transformABC.js parses it (via js-yaml) and renders
 * the tune once per scale, wrapping each SVG in <div class="<name>"> so a stylesheet
 * can show/size them independently.
 *
 * Options:
 *   format (select)          — "markdown" | "textile" block wrapper
 *   include_scales (boolean) — emit the multi-scale YAML frontmatter
 *
 * @param {object} ctx - generator context (unused here; this generator is self-contained)
 * @param {object} options - values from the invocation form, keyed by option name
 * @returns {string} source text to insert at the caret
 */
function generateText(ctx, options) {
  const opts = options || {};
  const format = opts.format === 'textile' ? 'textile' : 'markdown';
  const includeScales = Boolean(opts.include_scales);

  // The ABC tune both wrappers share.
  const tune = ['M:C', 'L:1/4', 'K:C', 'CDEF|GABc|'];

  // Optional YAML frontmatter: render the tune at several named scales.
  const frontmatter = ['---', 'scales:', '  narrow: 1.9', '  wide: 1.15', '  full: 0.69', '---'];

  // Frontmatter (when requested) precedes the tune inside the block.
  const block = includeScales ? frontmatter.concat(tune) : tune.slice();

  if (format === 'textile') {
    // The trailing blank line closes the `bc.` block so following text isn't
    // pulled into the code listing.
    return 'bc(abc2svg).\n' + block.join('\n') + '\n\n';
  }

  // Markdown fenced block. (Backticks kept out of a template literal on purpose.)
  const fence = '```';
  return fence + 'abc2svg\n' + block.join('\n') + '\n' + fence + '\n';
}
