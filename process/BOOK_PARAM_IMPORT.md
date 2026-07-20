# `?book=<url>` import — the editor's half of the reader hand-off

**Status: plan, for review.**

## Contract (fixed by the reader; do not renegotiate)

READ.html (commits `a0cdb2b`, `cfb6737`, `ca89437` in read-html) now offers **"Edit in SEED.html"** in its per-book settings for any book acquired from a URL. The link is built by `src/lib/editor.ts` as `https://readitinabook.com/SEED.html?book=<book-url>` — the book's _own_ URL, never the reader's copy. The reader persists `sourceUrl` on the book record, so the link survives library round-trips and reloads. Its commit message names this "the reader's half of a contract the editor will meet later." This task meets it.

The reader's own `?book=` handling (its `App.svelte` onMount) sets the semantics we mirror:

- embedded payload wins over deep links;
- params are read **once at startup**, then cleared with `history.replaceState(null, '', location.pathname)` so reloads return to the app's own state;
- the URL is fetched **as-is** with `cache: 'no-store'` — CORS applies, no proxy;
- the filename is derived from `response.url`'s pathname (redirects honoured), decoded, falling back to a default.

## What SEED already has

- **A legacy remote import**: `#<http-url>` in the hash → `handleEpubImport(undefined, url)` (App.svelte:1234–1248) — plain fetch, unpack, navigate; no dedupe; alert on failure.
- **The dedupe flow**, built for embedded-payload boot (`handleEmbeddedPayloadBoot`, App.svelte:1079): `readEpubIdentity(bytes)` → `findWorkspaceByIdentifier(...)` → confirm "already a project: OK opens it / Cancel imports a fresh copy" → open existing or `handleEpubImport(file)` + import-notice toast.
- **Boot ordering**: payload boot runs first; hash handling only if no payload (App.svelte:1208–1211).

## Design decisions

1. **Param over hash.** `?book=<url>` becomes the canonical deep link; the hash form stays working (it's shipped behaviour) but is legacy. Precedence at boot: embedded payload → `?book=` → hash.
2. **Dedupe is required, not optional.** Unlike the one-shot hash link, the reader's link is a durable button a user will press twice. Without the identifier check, every press mints a duplicate workspace. Reuse the payload-boot flow verbatim: same confirm, same open-existing navigation, same fresh-copy fallback.
3. **Read-once-and-clear.** Clear the query string via `history.replaceState` _before_ the async fetch (the reader's pattern), not after success — a failed import must not leave a URL that re-fires on reload. (The legacy hash path clears after success; leave it as-is.)
4. **Scheme validation.** Accept only `http:`/`https:` URLs from the param; anything else is ignored with a console warning. The param is attacker-suppliable; `fetch` would reject exotic schemes anyway, but validating explicitly keeps the guarantee local and testable.
5. **Fetch semantics mirror the reader**: `fetch(url, { cache: 'no-store' })`; non-OK → the existing alert path with HTTP status; filename from `response.url` pathname (decoded), replacing `extractFilenameFromUrl`'s input-URL guess for this path.
6. **Non-SEED EPUBs import as they do today** (unpack succeeds; there are just no plain-text sources). The reader offers the link for any URL-acquired book, so this case will arrive. Out of scope to block it; optional nice-to-have: detect a missing `SEED.zip` after unpack and toast "This book wasn't made with SEED.html, so it has no plain-text sources to edit." — decide at implementation with the user.
7. **CORS is the host's problem, by contract.** Same-origin hosting (readitinabook.com → sample.readitinabook.com is _cross_-origin — needs CORS headers on the sample host, same as the reader's fetch already does today) — no proxy, matching the reader's documented stance. Failure surfaces as the fetch error alert.
8. **`file://` build**: the param can't arrive meaningfully (no query string on a double-clicked file, and fetch would fail); no gating needed — the parse simply finds nothing.

## Implementation steps

1. **`src/lib/import/book-param.ts`** (new, small, pure): `parseBookParam(search: string): string | null` — URLSearchParams lookup, scheme validation per decision 4. Unit tests: present/absent, http/https accepted, `javascript:`/`data:`/relative rejected, malformed URL rejected.
2. **Extract the shared import-or-reopen helper** in App.svelte from `handleEmbeddedPayloadBoot`: `importOrReopenEpub(bytes: Uint8Array, filename: string, notice?: string): Promise<void>` — identity read, dedupe confirm, open-existing navigation, else `handleEpubImport(new File(...))` + optional toast. Payload boot becomes a thin caller; no behaviour change there (its test coverage in boot-payload stays valid).
3. **Boot wiring** in onMount after `payloadHandled` is false: `parseBookParam(location.search)`; if found — `history.replaceState` clear, fetch per decision 5, call the helper (no import notice toast, or a shorter one — the user asked for this import, unlike the payload surprise); on any failure, the existing alert. Hash fallback only when no param.
4. **i18n**: any new user-facing string goes through `$t` and `locales/en.po` via the extract→convert pipeline (`.po` is source; never edit the JSON).
5. **Changelog** (Unreleased): one line — opening a book link from READ.html's "Edit in SEED.html" now lands in the editor, reopening the existing project when the book is already here.
6. **Validate + tests**: `npm run validate`; new unit tests for book-param; spine of the dedupe behaviour is already covered by boot-payload tests.

## Coordination

- The link-generating reader UI is **post-0.4.0** upstream (0.4.0 = `7766c58`, currently vendored). Ship SEED's param handling first; when read-html cuts 0.5.0, vendor it per `public/read/VENDORED.md` — the contract then works end-to-end in production. Until then the param is testable directly (`/SEED.html?book=<url>`).
- End-to-end verification (dev + preview deploy): same-origin book URL imports; cross-origin without CORS shows the fetch alert; second click on the same link offers "open existing"; reload after import stays in the app (param cleared); `#<url>` legacy path still works; payload artifact ignores both.

## Out of scope

- A `?catalog=` equivalent (the reader has one; the editor has no catalog-browsing surface).
- Proxying fetches for CORS-less hosts.
- Blocking or special-casing non-SEED EPUBs beyond the optional notice (decision 6).
