# Advanced documentation

Reference material for power users who write their own transform scripts,
extensions, and other project customizations. This is a standalone collection for
now; individual pages may later be surfaced in the app.

## Contents

- [Transform context API (`ctx`)](transform-context-api.md) — the file-access
  object passed to `transformText` / `transformDOM` scripts: read manifest items,
  read and write project `SOURCE/` data.
- [Generators and their options](generators.md) — declaring a generator in an
  extension and the `options` form schema (`string` / `number` / `boolean` /
  `select`), including how to wire up a `select` dropdown.
