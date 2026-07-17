# Package as SEED.html — the self-editing book, double-clickable

The fourth generate option: publish a project as a single `.html` file that contains SEED.html itself plus the project's Active EPUB. Double-click it anywhere and the editor opens in the browser with the book ready to edit — export a new EPUB, or any output that works offline. It is the Active EPUB's promise (a book that carries its own editor) with the openability problem solved: no rename-and-unzip knowledge required, just a double-click.

**What this artifact is NOT — the load-bearing framing.** It is an **import vehicle plus the editor**, never a working copy. There is no cross-browser way for a `file://` page to overwrite its own file, so the artifact must never pretend to hold edits: opening it imports the project into the browser's storage (exactly today's model), edits live there, and persistence leaves through the export flows. Every UI surface and doc sentence about this feature must respect that framing — a user who believes the file holds their edits will lose work.

## 1. The payload slot — a contract SEED.html publishes about itself

Mirrors the READ.html payload-slot contract (read-html `docs/PAYLOAD_SLOT.md`), self-consumed rather than cross-repo. The app's `index.html` source carries one empty payload element that survives the single-file build untouched:

```html
<script type="application/epub+zip;base64" id="seedhtml-payload"></script>
```

- **Filling it**: the export inserts the base64 bytes of one Active EPUB as the element's text content, changing nothing else (base64 cannot form `</script>` or any HTML-significant sequence).
- **Build guarantee**: the marker appears exactly once in the built app document; asserted by a unit test against `index.html` and by `scripts/smoke-build.js` against `dist/index.html`.
- **At boot**, if the slot is non-empty: decode → run the payload through the existing EPUB-import flow (see §2). Decode or import failure shows the standard import error, never a blank app.
- **Trust**: identical to importing any SEED EPUB — the project's transforms run in the existing sandboxed transform context. No consent gate; the asymmetry with READ.html is deliberate and documented (READ opens _other people's_ books into a library; opening a SEED.html file is already full trust in its sender, as with any HTML file).

## 2. Boot-time import semantics (the one real design problem)

Double-clicking the same file twice must not silently mint duplicate projects.

1. After storage init, if the slot is non-empty, parse the payload's OPF far enough to get `dc:identifier` (and title, for the dialog).
2. If no existing project carries that identifier → import (existing flow), navigate to the new project. A one-time notice sets the framing: **"Project imported — your edits live in this browser. Use the package buttons to save your work as files."**
3. If a project with that identifier exists → dialog: **open the existing project** (default) or **import a fresh copy** (suffixed title, per the duplicate flow). Never import silently.
4. The slot is static markup — it cannot be cleared after import — so this check runs on every load of the file. Step 2/3's identifier match is what makes that harmless.

## 3. The export

- **Placement**: fourth button in the project details panel — `Package as SEED.html` — same family, styling, read-only tooltip, and disabled states as its siblings.
- **Payload**: the Active EPUB with `SEED.zip` (`includeSource: true`) and **without** an embedded editor copy (`includeSeedHtml: false` forced) — the wrapper IS the editor; nesting a second one is pure size.
- **Shell**: fetch the app's own document (`/`, which in production is the self-contained single-file build) and inject via the shared injection helper — generalize `src/lib/reader/package-as-read.ts`'s `injectEpubPayload` to take the slot marker as a parameter rather than duplicating it.
- **Filename**: `<slug>.SEED.html` — the plain `.html` name is taken by Package as READ.html, and the double extension makes the artifact type recognizable at a glance ("the SEED.html of this book").
- **Gating**: HTTP-only, same pattern and messaging as PDF / Package as READ.html (a `file://` app cannot fetch its own shell).
- **Feedback**: same success toast with file size (~1 MB app + 1.33× the EPUB) and the >25 MB share-by-link advisory.
- **Dev-mode caveat** (documented, not fixed): under `vite dev` the fetched document is not self-contained, so a dev-generated artifact won't work standalone. The feature is verified against the built app (`vite preview` or the deployment); the slot-presence assertion still protects correctness.

## 4. Known limits (accepted, same family as the READ.html export)

- **Storage from disk rides the app's existing paths** (owner field knowledge, re-verified in §6): OPFS is available to `file://`-loaded apps in Chromium and Firefox, and Safari's OPFS writes go through the app's dedicated worker (`opfs-worker.js`, sync access handles — worker-only in Safari by design) — the same machinery the standalone SEED.html distribution already exercises. The boot import shows the standard degraded-storage messaging in any environment that still denies storage.
- **Offline scope**: editing, preview, and EPUB export work from disk; HTTP-gated features (PDF, Package as READ.html, publish plugins, installing new extensions) are absent offline, exactly as in the standalone build. The project's own transforms and extension assets travel inside the EPUB, so books with clips edit and preview fully.
- **Version freeze**: the artifact snapshots its editor. Softened by the import-vehicle framing — once imported, the project lives in whatever newer SEED the person uses next.
- **Deliverability**: HTML-with-base64-payload is shaped like HTML smuggling; corporate mail filters may quarantine it, and this artifact is the biggest of the family. Links, drives, AirDrop, messaging apps.

## 5. Not in scope

- No embedded READ.html inside the artifact (an offline "Package as READ.html" would mean shipping the reader shell in the editor shell — revisit only if asked).
- No publishing of the slot contract for third-party tools (self-consumed for now; extract to a public doc if anyone else ever builds these).
- No change to the Active EPUB format — `SEED.zip` inside the EPUB stays the durable self-description; this artifact wraps it.

## 6. Verification

- Unit: shared injection helper (slot parameterization, exactly-once assertion against `index.html`), boot-import decision table (no-match / match-open / match-copy), filename mapping.
- Smoke: `scripts/smoke-build.js` asserts the slot survives in `dist/index.html` exactly once.
- Manual (against a build): export a clip-carrying project; double-click the artifact from disk in Chrome, Firefox, and Safari — import notice, project opens, preview plays clips, Package EPUB produces a valid Active EPUB (per-browser storage behavior recorded as found); reopen the same file — dialog offers the existing project.
- i18n: new strings (button, import notice, duplicate dialog) translated in `de` before merge.
- Changelog, product language: "Publish your project as a single web page that opens as its own editor — double-click to continue editing anywhere, no install, no account."
- About diagram: the artifact joins the returning side of the story (a second file below the app with a dashed way back — layout at implementation's discretion; the caption's "only the EPUB can return" sentence must be updated, since two files now return).

## 7. Sequencing

One branch, no cross-repo dependency — SEED publishes and consumes its own contract. Suggested order: slot + smoke assertion → shared injection helper refactor (touches the READ export's tests) → boot import with dedupe → export button → diagram + caption + docs. Merge on the owner's word; `main` deploys.
