# Agent-assisted authoring: where the agent operates

Working analysis (July 2026) of how a coding agent (Claude Code, claude.ai, or any AGENTS.md-reading tool) can help a SEED.html author create custom layouts and transforms. Captured before building anything; the concrete scenario driving it:

> An author in a normal desktop (or mobile) browser — the app possibly offline — has an existing project with content and manifest media. They have an idea for how to present something, describe it to an agent with some sample markup, and want back a `page.css` and maybe a `transformDOM()` body. Not more than that.

## The landscape, briefly

Four conventions dominate agent-facing capability description in mid-2026, and they answer different questions:

- **AGENTS.md** (in a project directory) — "how to work on _this_ project". Read by effectively every coding agent; ~60k repos.
- **llms.txt** (at a site root) — "what this product is, and where the agent-readable markdown docs are". ~10% adoption; serving markdown instead of HTML measurably improves agent accuracy and token cost.
- **Agent Skills** (SKILL.md package) — "how to perform this workflow, repeatably", portable across Claude Code / claude.ai / other tools.
- **MCP** — live tools over a protocol. The weakest fit for SEED: the app is local-first with no server-side project state, so there is nothing for a remote server to act on. Knowledge-shaped assets are where SEED's leverage is.

## What exists today

- The in-app editor already edits `page.css` and `transformDom.js`; the preview's Source view already exposes the generated XHTML; the preview, accessibility check, and screen reader preview are the verification loop.
- `SEED.zip` (embedded in every exported EPUB) carries the complete SOURCE/ tree — settings, text sources, scripts, styles, extensions. It is the full-fidelity transport.
- Folder linking is **one-way, content-only, manual**: the linked folder carries chapter text sources; scripts/CSS/settings never appear there, and the app never writes anything out. For the layout scenario it is a non-pathway.
- Transforms are plain `transformDOM(document, idref, ctx)` functions, headlessly testable in Node (`src/lib/transform/test/event-dates-sample.test.ts` is the harness pattern).
- The transform contract is documented (`src/lib/transform/TRANSFORM_CONTEXT.md`), but there is no end-to-end authoring contract, no llms.txt, no AGENTS.md anywhere on the authoring surface — and `settings.json` is documented inconsistently (`src/lib/source/types.ts` `SourceSettings` vs `src/lib/settings/API.md` `EPUBSettings`; bare filenames vs `SOURCE/`-relative paths). That discrepancy burns an agent immediately and must be resolved before any contract ships.

## The workflows

### W1 — Clipboard round-trip (primary: any agent, any device, app stays offline)

Author copies a **context pack**, pastes it into any chat agent with their layout description, pastes the returned `page.css` / `transformDOM()` into the in-app editor, and iterates against the live preview with the checks as verification. Only the agent conversation needs network; the app does not.

The context pack is the buildable affordance — one "Copy context for AI" action assembling:

- the transform contract, **inlined** (agent web access not assumed): `transformDOM` signature, sandbox limits, `ctx` capabilities (`readManifestDataURL` for media, `ctx.language`)
- EPUB-CSS guidance: reading-system constraints, pagination/multicol realities (the hanging-float/negative-margin class of mistakes agents make writing "web CSS" for books)
- a sample chapter source and its generated XHTML (the pair that teaches the agent the pipeline by example)
- current `page.css` and active transform sources
- `settings.json`, the manifest media listing, the book language

Everything in the pack is already reachable in-app; the affordance is assembly plus the knowledge text.

### W2 — Project archive in Claude Code (desktop power path)

Export `SEED.zip` (or hand over the EPUB that embeds it) → agent edits real files, **tests transforms headlessly** with the Node harness → author re-imports. Full fidelity, versionable, right for complex transforms; friction is the export→reimport loop. This is where a generated `AGENTS.md` inside SOURCE/ belongs — a project handed to any agent arrives self-describing.

### W3 — Browser automation beside the app

Claude in Chrome / Playwright driving the hosted app. Works now with zero app changes (proven extensively while building the screen reader preview), but fragile and slow as an authoring channel. Treat as **verification**: preview screenshots, running the checks, reading the screen-reader transcript.

### W4 — In-app assistant (future, as a plugin)

The plugin architecture already hands trusted plugins the workspace handle. A layout-assistant plugin assembles the same context pack, calls an API with the author's key, and writes results back with a reviewed diff. Tightest loop; online-only; the biggest commitment. Note: it _consumes the same context pack as W1_.

### W5 — App embedded in an agent-driven parent frame

Two flavors, split by origin and by cross-site storage partitioning:

- **Same-origin harness** — a page on readitinabook.com wrapping the app in an iframe. The parent has full DOM reach through the app frame into the nested preview iframe; same OPFS, so the author's real projects are visible; it watches the preview as DOM and geometry (richer than pixels for an agent). Missing piece is only a "refresh after external write" poke. Effectively W4 built beside the app instead of inside it.
- **Cross-origin embed** — an agent's own page or sandbox iframes the hosted app. Same-origin policy forces a deliberate postMessage **embed bridge** (read-file / write-file / get-rendered-xhtml / refresh), and cross-site storage partitioning means the author's projects are _not_ visible — the project travels through the bridge (post the archive in, get it back out). This turns SEED into an embeddable EPUB engine (the StackBlitz/CodeSandbox embed-SDK shape) and upgrades W3 from UI-driving to a programmatic surface for agent sandboxes. In-repo precedents for the message pattern: the plugin 4-message contract, the transform-iframe broker, the Paged.js handshake. Security: origin allowlist plus explicit user consent, following the reader's trust-prompt pattern.

## The design insight

Every workflow consumes the same capability surface: _read SOURCE files, read rendered XHTML, write SOURCE files, refresh the preview_ — plus the same knowledge: _the authoring contract_. W1 ships the surface as clipboard text, W2 as files in an archive, W4 as a plugin's broker, W5 as a postMessage bridge. Build the context pack and the contract once; transports vary.

## Sequencing implied (not started)

1. Resolve the `settings.json` schema discrepancy; write the canonical end-to-end authoring contract.
2. W1's "Copy context for AI" affordance (smallest build, serves the stated scenario directly, works on mobile and offline-app).
3. Distribution: `/llms.txt` + hosted markdown contract; `AGENTS.md` generated into SOURCE/; a seed-authoring Agent Skill (SKILL.md + contract + harness template).
4. W5 bridge / W4 plugin when the demand is proven — same brokered surface, so nothing in 1–3 is throwaway.
