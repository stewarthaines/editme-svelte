# Vendored: bene (EPUB reading system)

- **Upstream**: https://github.com/nota-lang/bene (nota-lang)
- **Source of this snapshot**: the upstream web deployment at https://nota-lang.github.io/bene/, retrieved 2026-07-04 (bene v0.1.3 era; upstream publishes no standalone web-build artifact — the Pages deployment is the built `bene-web` app)
- **License**: dual Apache-2.0 / MIT (see upstream repository)
- **Local modification**: one patch fixing a warm-service-worker preload race — see `patches/bene-shell.md`. Re-apply after any re-vendor.

## What it is here for

SEED.html's Publish surfaces open a packaged EPUB in a new tab via `bene/index.html?preload=<url>` for quick review of the artefact. bene fetches the URL (blob URLs from the app work), hands the bytes to its own service worker (scoped to `/bene/`, coexisting with the app's root-scope worker), and renders the book.

HTTP-only: like PDF export and plugins, this directory is not reachable from the `file://` single-file build.

## Upgrading

Mirror the deployment (index.html, worker.js, assets/, bene-reader/ — check the shell bundle for new asset references), or build `bene-web` from source (Rust + wasm-pack + depot; artifacts at `js/packages/bene-web/dist`). Then re-apply the patch above if upstream hasn't fixed the race, and update this note's retrieval date/version.
