/**
 * Generator: the preview-only flag-overlay <head> fragment.
 *
 * Do NOT insert this into a chapter — use the panel's "Copy" button, then paste it
 * into SOURCE/preview/head.xml (select it from the file dropdown above the panel).
 * preview/head.xml is injected into the preview <head> only and is never added to
 * the packaged EPUB, so this stays out of the book. It overlays a country flag and
 * a language `title` on every [lang] element in the preview.
 *
 * @param {object} ctx - unused
 * @param {object} options - unused
 * @returns {string} the <script>/<style> fragment to copy into preview/head.xml
 */
function generateText(ctx, options) {
  return `<!-- LanguageSwitching flag overlay — preview only, never packaged. -->
<script>
function flagFor(langTag) {
  try {
    const loc = new Intl.Locale(langTag);
    const region = loc.region || loc.maximize().region;
    if (!region) return '';
    return String.fromCodePoint(
      ...[...region.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
    );
  } catch { return ''; }
}

window.addEventListener('load', () => {
  document.querySelectorAll('[lang]').forEach(el => {
    const code = el.getAttribute('lang');
    el.dataset.flag = flagFor(code);
    el.setAttribute('title', code.toUpperCase());
  });
});
</script>
<style>
[data-flag] { position: relative; }
[class*=lang-] { background-color: #eef; }
[data-flag]::after {
  content: attr(data-flag);
  position: absolute;
  opacity: 0.4;
  left: -1.2em;
  top: -0.5em;
  pointer-events: none;
}
</style>
`;
}
