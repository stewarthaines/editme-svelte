/**
 * Legacy reader path — permanent redirect to the branded root URL.
 *
 * /read/READ.html was the reader's address before it moved to /READ.html;
 * links from earlier deployments (including in-app Read tabs opened from
 * older SEED builds) land here. The query string (`?book=`, `?catalog=`)
 * is preserved.
 */

export async function onRequest(context: { request: Request }): Promise<Response> {
  const url = new URL(context.request.url);
  url.pathname = '/READ.html';
  return Response.redirect(url.href, 301);
}
