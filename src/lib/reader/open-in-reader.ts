/**
 * Open a packaged EPUB in the vendored bene reader (public/bene/ → dist/bene/)
 * in a new tab, via bene's `?preload=<url>` loader.
 *
 * HTTP-only, like PDF export and plugins: dist/bene/ is unreachable from the
 * file:// single-file build, so gate any Read affordance on isHttpContext().
 */

/** True when the app is served over HTTP(S) — HTTP-only features may be offered. */
export function isHttpContext(): boolean {
  return typeof location !== 'undefined' && location.protocol !== 'file:';
}

/**
 * Open the reader tab for the given EPUB bytes.
 *
 * The blob URL is deliberately never revoked: the reader tab fetches it after
 * this function returns, and it must stay resolvable for reloads of that tab.
 * It is released automatically when this document unloads.
 */
export function openEpubInReader(blob: Blob): void {
  const blobUrl = URL.createObjectURL(blob);
  openEpubUrlInReader(blobUrl);
}

/**
 * Open the reader tab for an EPUB the reader can fetch itself — a blob URL, a
 * same-origin path, or a remote object's public URL. Cross-origin URLs work
 * only when the remote allows cross-origin reads (CORS).
 */
export function openEpubUrlInReader(url: string): void {
  const readerUrl = new URL(
    `bene/index.html?preload=${encodeURIComponent(url)}`,
    document.baseURI
  ).href;
  window.open(readerUrl, '_blank');
}
