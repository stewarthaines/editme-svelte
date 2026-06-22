# TODO / status

The core editor is implemented and shipping: OPFS/IndexedDB storage, EPUB
unpacking/packaging, the workspace + OPF/manifest/spine model, the text→DOM→XHTML
transform pipeline, manifest/metadata/spine editing, multi-device + PDF preview,
extensions, plugins, and the i18n system. Detailed per-feature design notes used to
live under `plans/`; that historical tree was retired — use git history and the
co-located `src/lib/<module>/API.md` docs for current behaviour.

## Deferred test work

Some unit tests are intentionally skipped (search the suite: `grep -rn "\.skip(" src`).
They fall into a few buckets:

- **happy-dom limitations** — APIs the unit env doesn't model (e.g. `matchMedia`,
  CSSOM `@import` extraction, namespaced OPF/XML parsing). These need a real browser
  or a Storybook/Playwright-based test.
- **Integration / full-workflow scenarios** — better expressed as Storybook stories
  than happy-dom unit tests (e.g. extension batch-conflict rollback, i18n first-run
  extraction, view-transition behaviour).
- **Resource-intensive checks** — memory-capacity and large-file paths.

Re-enable these opportunistically as the browser-based test setup grows.
