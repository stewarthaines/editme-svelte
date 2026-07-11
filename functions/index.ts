/**
 * Redirect the bare origin to the branded document — Cloudflare Pages
 * Function, route `/`.
 *
 * The app lives at /SEED.html (served by SEED.html.ts) so the address bar
 * names the product. A Function rather than a `_redirects` rule because
 * SEED.html.ts must fetch `/` as the underlying asset — a redirect rule on
 * `/` would loop that fetch, while Functions don't apply to ASSETS.fetch.
 * 302 while the arrangement settles; flip to 301 once permanent.
 */

// onRequest (not onRequestGet): HEAD requests don't fall back to the GET
// handler and would otherwise slip through to the static asset.
export function onRequest(context: { request: Request }): Response {
  return Response.redirect(new URL('/SEED.html', context.request.url).toString(), 302);
}
