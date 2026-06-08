/**
 * Helpers for the preview → editor "click to find text" feature.
 *
 * The preview is the rendered output; the editor holds the markup source. Matching
 * a whole rendered element against the source breaks whenever the element has inline
 * markup (`*em*`, `**strong**`, a `<span>`…), because those characters live in the
 * source but not the rendered text. A single rendered text node, however, maps to a
 * contiguous, markup-free run of the source — so a short snippet from the text node
 * the user actually clicked can be found by a plain substring search.
 */

/**
 * Return a snippet of ~`wordCount` words from `nodeText`, centred on the word at
 * `offset` (the caret position within the clicked text node). Whitespace is
 * collapsed and the window is clamped to the node's bounds. Returns '' when there
 * is no word content.
 */
export function snippetAroundClick(nodeText: string, offset: number, wordCount = 5): string {
  if (!nodeText) return '';

  const words: Array<{ text: string; start: number; end: number }> = [];
  const re = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(nodeText)) !== null) {
    words.push({ text: match[0], start: match.index, end: match.index + match[0].length });
  }
  if (words.length === 0) return '';

  const clamped = Math.max(0, Math.min(offset, nodeText.length));

  // The clicked word is the first one ending at/after the caret; fall back to the
  // last word when the caret sits in trailing whitespace.
  let clickedIndex = words.findIndex(w => clamped <= w.end);
  if (clickedIndex === -1) clickedIndex = words.length - 1;

  const half = Math.floor(wordCount / 2);
  let start = clickedIndex - half;
  // Shift the window fully inside the available words, then clamp.
  if (start + wordCount > words.length) start = words.length - wordCount;
  if (start < 0) start = 0;
  const end = Math.min(words.length, start + wordCount);

  return words
    .slice(start, end)
    .map(w => w.text)
    .join(' ');
}
