# Local patch: `public/paged.polyfill.js` (Paged.js v0.4.3)

The vendored Paged.js polyfill has **one local modification**. If you ever
re-download / upgrade `public/paged.polyfill.js`, re-apply this patch (there is
also a banner comment at the top of that file pointing here).

## The change

Exactly one occurrence of `size: letter;` in the polyfill's built-in base
stylesheet was changed:

```diff
- @page { size: letter; margin: 0; }
+ @page { size: var(--pagedjs-width) var(--pagedjs-height); margin: 0; }
```

Re-apply with:

```bash
python3 - <<'PY'
p = "public/paged.polyfill.js"
s = open(p, encoding="utf-8").read()
assert s.count("size: letter;") == 1
s = s.replace("size: letter;", "size: var(--pagedjs-width) var(--pagedjs-height);", 1)
open(p, "w", encoding="utf-8").write(s)
PY
```

## Why

Our PDF export and the in-app "Print" preview both paginate with Paged.js and let
the user choose a page size (Settings → Print → Page size; written to
`SOURCE/settings.json`, applied via `printPageCss` in `src/lib/pdf/pdf-export.ts`).

Paged.js reads the author `@page { size: … }` and folds it into its
`--pagedjs-width` / `--pagedjs-height` CSS variables, which correctly size the
on-screen `.pagedjs_page` boxes. **But v0.4.3 never propagates that size to the
actual print `@page`** — it keeps its built-in `@page { size: letter }`. So the
browser's "Save as PDF" printed onto its *default* paper (e.g. A4/Letter) with the
(e.g. A6) page sitting in the top-left corner.

This can't be fixed from outside the polyfill: Paged.js's MutationObserver strips
`size` from any author/added `@page` rule, the browser drops the `size` descriptor
from `@page` rules edited via CSSOM, and `!important` is invalid on `size`. The
only `@page { size }` that survives is the polyfill's own base rule — hence the
patch. Paged.js already sets `--pagedjs-width/height` to the chosen size, so
tying the base print `@page` size to those variables makes the printed paper match.

## Scope / caveats

- **Chromium only.** Verified in Chrome: the print dialog's paper size follows the
  chosen page size. Firefox's "Save to PDF" ignores `@page { size }` entirely and
  only offers a fixed built-in paper list (no A6), so the user picks the closest
  size there — this is why the Page-size options exclude A6
  (`PAGE_SIZE_OPTIONS` in `src/lib/navigation/views/SettingsView.svelte`).
- Verify after re-applying: open a project, Settings → Print → Page size → A5,
  click **PDF**, and confirm the print preview's paper is A5 (content fills the
  sheet rather than sitting in a corner).
