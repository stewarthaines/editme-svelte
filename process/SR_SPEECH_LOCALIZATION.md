# Screen reader preview: localized speech (and captions)

Plan of record for localizing the screen reader preview's announcements. Supersedes the draft reviewed 2026-07-21; incorporates the cross-review notes from that draft.

## Context

Real screen readers speak _structural_ announcements in the screen reader's own language (the user's UI language) and read _content_ in the content's language, voice-switching on `lang`. The preview currently violates both halves: structural vocabulary is hardcoded English (`speakablePhrase`'s map in `src/lib/components/spine/sr-walk.ts`), and every utterance — structure included — is spoken with the book-language voice, handing English structure words to non-English voices (the "listitem" mispronunciation class, systemic).

Design decisions, updated per cross-review:

- **Structure language, v1: the app locale**, with the manual stating this explicitly and advising authors to set the app to their readers' language for a faithful preview. The cross-review's alternative — keying structure to the _book_ language when an enabled catalog exists — is the better fidelity model (book language is the best proxy for readers' screen reader configuration, and an author can read the language they write in), but it requires translating msgids in a locale other than `currentLocale`; the i18n runtime resolves only the active catalog today. Recorded as the designated follow-up, not v1 (see Open items).
- **Captions localize along with speech** (reopened from the author's seat: a deaf/hard-of-hearing author consumes this feature entirely through captions). Each caption row keeps the verbatim English phrase reachable as its `title` attribute — the precise record at zero new-string cost. Known gap: `title` is unreachable on touch devices; accepted for v1, revisit if it bites (see Open items).
- **No `end of {role}` template.** Per-role `end of …` msgids for the enumerated role set — German compounds ("Listenende"), Slavic case agreement, and translator reordering all rule out frame-plus-noun concatenation. `level {n}` and `{x} of {y}` remain templates (numeral interpolation only).
- **Full DPUB-ARIA enumeration.** Every `doc-*` role gets a mapped spoken form; the strip-the-prefix fallback survives only for roles that don't exist yet, with a comment saying so. The EPUB-specific roles are this audience's core vocabulary, not a long tail.
- **German seeds come from shipping screen reader vocabulary**, consulted from NVDA's open-source German translations (and VoiceOver's terms where they differ), cited in `.po` translator comments so the flagged-for-review entries can be reviewed against something. Consult as reference for standard AT terminology — do not copy entries wholesale (NVDA's translations are GPL; ours are MIT).

## Changes

### `src/lib/components/spine/sr-walk.ts` (stays pure — vocabulary injected)

- Export `isStructuralPhrase(phrase: string): boolean` — the leading-lowercase-token(+comma/end) rule factored out of `speakablePhrase`; `end of …` phrases are structural. Pure content text → false. Comment: the heuristic is English-shaped by design — classification always runs on the library's raw phrases, never on translated output.
- Rework `speakablePhrase(phrase, spoken?)` where `spoken: (msgid: string, params?: Record<string, string | number>) => string` defaults to English passthrough:
  - role tokens → `spoken('list item')` etc. — `SPOKEN_ROLES` values become msgids, extended to the full DPUB-ARIA set (`doc-endnote`, `doc-glossref`, `doc-pagelist`, `doc-biblioref`, `doc-backlink`, …)
  - `end of X` → per-role msgids: `spoken('end of list item')`, `spoken('end of list')`, `spoken('end of table')`, … for the enumerated container roles (including plain-word roles: list, table, figure, paragraph, caption, row, row group, region, document, blockquote, aside). Unknown role: English passthrough, flagged by comment as the untranslated last resort.
  - `level N` → `spoken('level {n}', { n })`
  - `position X, set size Y` → `spoken('{x} of {y}', { x, y })`
- Msgids marked for extraction with `_()` from `src/lib/i18n/msgid.ts` (established pattern for strings defined away from call sites).

### `src/lib/components/spine/PreviewPane.svelte`

- `announceElement`'s `onPhrase` splits by phrase kind:
  - structural (`isStructuralPhrase`): localized text `speakablePhrase(phrase, translate)`, spoken with `lang: $currentLocale`, `voiceURI: null` (app-locale default voice). If the platform has no voice for the app locale the engine falls back silently — accepted; code comment records it.
  - content: verbatim text, `lang` = book language, `voiceURI` = the picked voice (unchanged).
- Voice-picker semantics: a picked voice applies to **content only**; structure always uses the app-locale default. Stated in a code comment and the manual.
- Captions: `srPhrases` becomes `{ caption: string; verbatim: string }[]` — `caption` is the same localized phrase used for speech (content phrases: identical either way), `verbatim` the library phrase, rendered as the row's `title`. With app locale en, captions read exactly as today.

### i18n catalogs

`npm run i18n:extract && npm run i18n:convert`. Seed `locales/de.po` for the new msgids from NVDA-German vocabulary (with source citations in translator comments), flagged for review — nothing marked reviewed.

### Manual (`docs/user/seed.html-user-manual/Text/chapter04.md`)

One or two sentences in the Screen reader preview section: announcements about structure are in the app's language, the book's text is read in the book's language; set the app to your readers' language to hear what they will hear.

## Tests

`sr-walk.test.ts`:

- `isStructuralPhrase`: role phrases and `end of` phrases true; content text false.
- `speakablePhrase` with a fake `spoken` hook returning tagged strings — asserts per-role msgids (including a per-role `end of` case and a DPUB role), `level {n}` and `{x} of {y}` params, and that content text never reaches the hook.
- Defaults (no hook) still produce the current English output — existing tests unchanged.

## Verification

- `npx vitest run src/lib/components/spine/sr-walk.test.ts`; `npm run validate`; `npm run lint:i18n`.
- Live (user's dev server): app locale en → captions and speech unchanged from today. Switch to Deutsch → captions and speech read "Listenelement, Ebene 2, 3 von 12"; hovering a caption row shows the English phrase; content spoken in the book-language voice; picked voice affects content only.

## Open items (recorded, not v1)

- **Book-language-keyed structure**: needs cross-locale msgid resolution (load a second catalog and translate against it). The i18n state already keys catalogs by locale, so the machinery is close; design when wanted.
- **Verbatim record on touch**: `title` tooltips don't exist on iPad; if the precise record matters there, add a long-press or per-panel toggle later.
- **Voice-missing UX**: when no voice exists for the app locale (or the book language), the engine silently falls back, usually to English. If this confuses in practice, surface the resolved voice name in the panel.
