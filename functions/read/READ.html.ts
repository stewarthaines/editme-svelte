/**
 * Serve the vendored reader at its branded URL — Cloudflare Pages Function,
 * route `/read/READ.html`.
 *
 * Pages force-normalizes `.html` asset URLs (the static file 308s to
 * `/read/READ`), so the branded path must be owned by a Function — Functions
 * run before asset routing. Mirrors functions/SEED.html.ts, which owns
 * `/SEED.html` for the same reason. The query string (`?book=`, `?catalog=`)
 * rides along untouched; the reader reads it client-side.
 */

interface Env {
  ASSETS: { fetch: (input: URL | Request) => Promise<Response> };
}

// onRequest (not onRequestGet) so HEAD behaves like GET; ASSETS.fetch
// preserves the original method.
export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const asset = new URL(context.request.url);
  asset.pathname = '/read/READ';
  const response = await context.env.ASSETS.fetch(new Request(asset, context.request));
  // A saved copy of this page IS a working READ.html (empty payload slot), so
  // name it that when the browser derives a Save As filename. `inline` keeps
  // normal rendering.
  const headers = new Headers(response.headers);
  headers.set('Content-Disposition', 'inline; filename="READ.html"');
  return new Response(response.body, { status: response.status, headers });
}
