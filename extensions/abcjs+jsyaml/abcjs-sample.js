/**
 * Generator: insert a sample of ABC music notation, wrapped in the plain-text
 * block syntax the project authors in, ready for transformAbcjs.js to render.
 *
 * The wrapper is chosen with the `format` option:
 *   - markdown -> a fenced ```abcjs block  (=> <pre><code class="language-abcjs">)
 *   - textile  -> a `bc(abcjs).` block      (=> <pre class="abcjs"><code>)
 * Both selectors are recognised by transformAbcjs.js.
 *
 * With `responsive` on, a YAML frontmatter block naming the conventional
 * staff-width variants is placed inside the code block. transformAbcjs.js
 * parses it (via js-yaml) and renders the tune once per width as
 * div.abcjs-variant.<name> inside one div.abcjs-container; Styles/abc.css
 * shows the variant that fits the reading column (container query, with
 * fallbacks).
 *
 * Options:
 *   format (select)      — "markdown" | "textile" block wrapper
 *   voices (select)      — "1" | "2" | "3" | "satb" voice arrangement
 *   responsive (boolean) — emit the staffwidths YAML frontmatter
 *   tempo (select)       — Q: header value (beats per minute)
 *   key (select)         — K: header value
 *   words (boolean)      — sample lyric (w:) line under each voice
 *
 * @param {object} ctx - generator context (unused here; this generator is self-contained)
 * @param {object} options - values from the invocation form, keyed by option name
 * @returns {string} source text to insert at the caret
 */
function generateText(ctx, options) {
  const opts = options || {};
  const format = opts.format === 'textile' ? 'textile' : 'markdown';
  const voices = ['1', '2', '3', 'satb'].includes(opts.voices) ? opts.voices : '1';
  const responsive = Boolean(opts.responsive);
  const tempo = Number(opts.tempo) > 0 ? Number(opts.tempo) : 120;
  const key = typeof opts.key === 'string' && opts.key ? opts.key : 'C';
  const words = Boolean(opts.words);

  // One lyric syllable per note (two bars of four).
  const lyric = 'w: la- la- la- la- la- la- la- la';
  const w = words ? [lyric] : [];

  const head = ['M:4/4', 'L:1/4', `Q:1/4=${tempo}`];

  let body;
  if (voices === '1') {
    body = [`K:${key}`, 'CDEF|GABc|]'].concat(w);
  } else if (voices === '2') {
    body = [
      'V:1 clef=treble name=I',
      'V:2 clef=bass name=II',
      '%%score 1 2',
      `K:${key}`,
      'V:1',
      "cdef|gabc'|]",
    ].concat(w, ['V:2', 'C,D,E,F,|G,A,B,C|]'], w);
  } else if (voices === '3') {
    body = [
      'V:T clef=treble name=I',
      'V:M clef=treble name=II',
      'V:B clef=bass name=III',
      '%%score (T M) B',
      `K:${key}`,
      'V:T',
      "cdef|gabc'|]",
    ].concat(w, ['V:M', 'CDEF|GABc|]'], w, ['V:B', 'C,D,E,F,|G,A,B,C,|]'], w);
  } else {
    // SATB: two braced staves — women's voices sharing treble, men's on
    // treble-8 / bass.
    body = [
      'V:S clef=treble name=S',
      'V:A clef=treble name=A',
      'V:T clef=treble-8 name=T',
      'V:B clef=bass name=B',
      '%%score (S A) (T B)',
      `K:${key}`,
      'V:S',
      "cdef|gabc'|]",
    ].concat(
      w,
      ['V:A', 'GABc|defg|]'],
      w,
      ['V:T', 'CDEF|GABc|]'],
      w,
      ['V:B', 'C,D,E,F,|G,A,B,C,|]'],
      w
    );
  }

  // Optional YAML frontmatter: the conventional responsive staff-width
  // variants. A narrower staff = fewer measures per line = the narrow-column
  // variant.
  const frontmatter = responsive
    ? ['---', 'staffwidths:', '  narrow: 320', '  wide: 640', '  full: 960', '---']
    : [];

  const block = frontmatter.concat(head, body);

  if (format === 'textile') {
    // The trailing blank line closes the `bc.` block so following text isn't
    // pulled into the code listing.
    return 'bc(abcjs).\n' + block.join('\n') + '\n\n';
  }

  // Markdown fenced block. (Backticks kept out of a template literal on purpose.)
  const fence = '```';
  return fence + 'abcjs\n' + block.join('\n') + '\n' + fence + '\n';
}
