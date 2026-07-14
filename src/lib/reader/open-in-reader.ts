/**
 * Open a packaged EPUB in the vendored bene reader (public/bene/ → dist/bene/),
 * via bene's `?preload=<url>` loader.
 *
 * In a browser the reader opens as a new tab. In an installed PWA (standalone
 * display mode) a script-opened window renders without browser chrome — no tab
 * bar, no way back — so there the reader opens as an in-app overlay instead
 * (ReaderOverlay.svelte, driven by the `readerOverlayUrl` store below).
 *
 * HTTP-only, like PDF export and plugins: dist/bene/ is unreachable from the
 * file:// single-file build, so gate any Read affordance on isHttpContext().
 */

import { writable } from 'svelte/store';

/** True when the app is served over HTTP(S) — HTTP-only features may be offered. */
export function isHttpContext(): boolean {
  return typeof location !== 'undefined' && location.protocol !== 'file:';
}

/**
 * True when running as an installed app (home-screen PWA): the standard
 * display-mode media query, plus Safari's legacy `navigator.standalone`.
 */
function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    ('standalone' in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

/**
 * The reader URL currently shown as an in-app overlay (standalone mode only);
 * null when no overlay is open. App.svelte renders ReaderOverlay from this.
 */
export const readerOverlayUrl = writable<string | null>(null);

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
  const readerUrl = new URL(`bene/index.html?preload=${encodeURIComponent(url)}`, document.baseURI)
    .href;
  if (isStandaloneDisplayMode()) {
    readerOverlayUrl.set(readerUrl);
  } else {
    window.open(readerUrl, '_blank');
  }
}
