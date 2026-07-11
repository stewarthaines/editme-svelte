/**
 * Serve the app document at the branded URL — Cloudflare Pages Function,
 * route `/SEED.html`.
 *
 * Pages force-normalizes `.html` asset URLs (a static `SEED.html` would 308 to
 * `/SEED`), so the branded path must be owned by a Function — Functions run
 * before asset routing. It serves the single-file app by fetching the root
 * asset (`index.html`), which stays the build artifact; `index.ts` redirects
 * the bare origin here, so the address bar names the product.
 */

interface Env {
  ASSETS: { fetch: (input: URL | Request) => Promise<Response> };
}

// onRequest (not onRequestGet) so HEAD behaves like GET; ASSETS.fetch
// preserves the original method.
export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const root = new URL('/', context.request.url);
  const response = await context.env.ASSETS.fetch(new Request(root, context.request));
  // Browsers derive the Save As filename from Content-Disposition before the
  // URL or the document title (which is "Book Title · SEED.html" and would
  // otherwise name the file). `inline` keeps normal rendering; the filename
  // only applies when saving — and a saved page IS the standalone-HTML
  // distribution of the app, so it should be called SEED.html.
  const headers = new Headers(response.headers);
  headers.set('Content-Disposition', 'inline; filename="SEED.html"');
  return new Response(response.body, { status: response.status, headers });
}
