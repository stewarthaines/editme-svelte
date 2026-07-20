/**
 * Screen reader announcement walk — pure logic for the preview pane's
 * Screen reader panel.
 *
 * The walk drives @guidepup/virtual-screen-reader (vendored at
 * public/sr-preview/, loaded into the preview iframe) over one element and
 * reports each announcement phrase. Kept free of Svelte and of the real
 * library so the target resolution, stop conditions, and driver loop are unit
 * testable.
 */

/** Elements an author can announce individually — the deepest match wins. */
export const ANNOUNCEABLE_SELECTOR =
  'h1, h2, h3, h4, h5, h6, p, li, figure, table, blockquote, aside, dl, pre';

/**
 * The block the hover affordance should target for an event target: the
 * nearest announceable ancestor-or-self. `closest()` walks upward, so an `li`
 * wins over its `ul` — item-level announcements ("listitem, position 12, set
 * size 40") keep the loop tight on long lists.
 */
export function resolveAnnounceTarget(el: Element): Element | null {
  return el.closest(ANNOUNCEABLE_SELECTOR);
}

/**
 * Whether a phrase ends the walk. The virtual screen reader announces
 * "end of X" whenever the cursor exits any container, so only the phrase for
 * the container the walk started from is terminal; a stuck cursor (repeated
 * phrase) or a wrap-around to the first phrase also ends the walk.
 */
export function isTerminalPhrase(phrase: string, prev: string, first: string): boolean {
  return (
    phrase === prev ||
    phrase === first ||
    phrase === 'end of document' ||
    phrase === `end of ${first}`
  );
}

// Role tokens as spoken by real screen readers. The virtual screen reader's
// phrases use raw ARIA role tokens ("listitem", "doc-noteref"), which no TTS
// voice can pronounce; captions keep them verbatim, speech gets these.
const SPOKEN_ROLES: Record<string, string> = {
  listitem: 'list item',
  columnheader: 'column header',
  rowheader: 'row header',
  rowgroup: 'row group',
  'graphics-document': 'graphic',
  'graphics-object': 'graphic object',
  'graphics-symbol': 'graphic symbol',
  'doc-noteref': 'note reference',
  'doc-footnote': 'footnote',
  'doc-endnote': 'endnote',
  'doc-endnotes': 'endnotes',
  'doc-pagebreak': 'page break',
  'doc-toc': 'table of contents',
};

function spokenRole(token: string): string {
  const mapped = SPOKEN_ROLES[token];
  if (mapped) return mapped;
  // remaining DPUB roles read fine once the prefix and hyphens go
  if (token.startsWith('doc-')) return token.slice(4).replaceAll('-', ' ');
  return token;
}

/**
 * The spoken form of an announcement phrase. Rewrites the leading role token
 * (also after "end of ") to its spoken vocabulary, and "position x, set size
 * y" to "x of y" — the way real screen readers voice list context. Applied to
 * the speech path only; captions show the phrase verbatim.
 */
export function speakablePhrase(phrase: string): string {
  const isEnd = phrase.startsWith('end of ');
  const body = isEnd ? phrase.slice('end of '.length) : phrase;
  // Role announcements are a lowercase token alone or followed by a comma;
  // anything else is content text and passes through untouched.
  const match = body.match(/^([a-z][a-z-]*)(?:,|$)/);
  if (!match) return phrase;
  const rewritten = (spokenRole(match[1]) + body.slice(match[1].length)).replace(
    /\bposition (\d+), set size (\d+)/,
    '$1 of $2'
  );
  return isEnd ? `end of ${rewritten}` : rewritten;
}

/** The subset of the virtual screen reader the walk driver needs. */
export interface VsrLike {
  start(options: { container: Element; displayCursor?: boolean }): Promise<void>;
  next(): Promise<void>;
  stop(): Promise<void>;
  lastSpokenPhrase(): Promise<string>;
}

export interface WalkOptions {
  /** Aborts between steps; already-emitted phrases stand. */
  signal: AbortSignal;
  /**
   * Walk only this element, announced with its full document context. The
   * session still starts on `container` (ancestry outside the session's
   * container doesn't exist for the virtual screen reader — a nested li
   * walked as the container announces as "level 1"), and the cursor jumps to
   * the target via a transient tabindex + focus, which the virtual screen
   * reader follows like a real one.
   */
  target?: Element;
  /** Pause between steps so the in-preview cursor is followable. */
  stepDelayMs?: number;
  onPhrase: (phrase: string) => void;
  /** Backstop against a non-terminating cursor. */
  maxSteps?: number;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Poll until the last spoken phrase changes from `previous` (or time out). */
async function awaitPhraseChange(
  vsr: VsrLike,
  previous: string,
  timeoutMs = 1500
): Promise<string> {
  const started = Date.now();
  for (;;) {
    const phrase = await vsr.lastSpokenPhrase();
    if (phrase !== previous) return phrase;
    if (Date.now() - started > timeoutMs) return phrase;
    await delay(50);
  }
}

/**
 * Walk `container` — or just `target` within it — emitting each announcement
 * phrase in order, including the terminal "end of …" phrase. Always stops the
 * virtual screen reader, even on abort or error; stop() failures are swallowed
 * (the target document may have been rewritten under the walk).
 */
export async function walkAnnouncements(
  vsr: VsrLike,
  container: Element,
  { signal, target, stepDelayMs = 90, onPhrase, maxSteps = 2000 }: WalkOptions
): Promise<void> {
  try {
    await vsr.start({ container, displayCursor: true });
    let first = await vsr.lastSpokenPhrase();
    if (target && target !== container) {
      const ownTabindex = target.getAttribute('tabindex');
      if (ownTabindex === null) target.setAttribute('tabindex', '-1');
      (target as HTMLElement).focus?.({ preventScroll: true });
      first = await awaitPhraseChange(vsr, first);
      if (ownTabindex === null) target.removeAttribute('tabindex');
    }
    onPhrase(first);
    let prev = first;
    for (let i = 0; i < maxSteps && !signal.aborted; i++) {
      if (stepDelayMs > 0) await delay(stepDelayMs);
      if (signal.aborted) break;
      await vsr.next();
      const phrase = await vsr.lastSpokenPhrase();
      if (phrase === prev || phrase === first) break;
      onPhrase(phrase);
      if (isTerminalPhrase(phrase, prev, first)) break;
      prev = phrase;
    }
  } finally {
    try {
      await vsr.stop();
    } catch {
      // the preview document may have been rewritten mid-walk
    }
  }
}
