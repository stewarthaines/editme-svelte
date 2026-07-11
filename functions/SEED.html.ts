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
  return context.env.ASSETS.fetch(new Request(root, context.request));
}
