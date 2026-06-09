/**
 * Same-origin WebDAV proxy — Cloudflare Pages Function, route `/dav`.
 *
 * The publish-to-remote plugin runs in a same-origin iframe, so its WebDAV
 * calls are cross-origin and blocked by CORS whenever the user's server doesn't
 * (and often can't) send CORS headers. This Function lets the browser POST to
 * `/dav` (same origin -> no preflight, no CORS) and re-issues the real WebDAV
 * request server-to-server, where CORS doesn't apply.
 *
 * Security: targets are validated by `validateDavTarget` (https-only,
 * private/loopback/link-local hosts rejected, optional DAV_PROXY_ALLOWED_HOSTS
 * allowlist). The Workers runtime has no DNS-resolution API, so DNS-rebinding
 * can't be fully prevented here; the Cloudflare edge not routing to private
 * networks, plus the allowlist for public instances, are the mitigations.
 * Credentials (the Basic-auth header) transit this Function in memory only —
 * never stored or logged.
 */
import {
  validateDavTarget,
  normaliseMethod,
  parseAllowedHosts,
  FORWARD_HEADER_ALLOWLIST,
  DAV_TARGET_HEADER,
  DAV_METHOD_HEADER,
} from './_shared/dav-proxy-core';

interface Env {
  DAV_PROXY_ALLOWED_HOSTS?: string;
}

interface RequestContext {
  request: Request;
  env: Env;
}

/** Capability probe: a same-origin GET /dav resolves only where the proxy exists. */
export function onRequestGet(): Response {
  return new Response(null, { status: 204 });
}

export async function onRequestPost(context: RequestContext): Promise<Response> {
  const { request, env } = context;

  const method = normaliseMethod(request.headers.get(DAV_METHOD_HEADER));
  if (!method) {
    return new Response('Missing or unsupported X-DAV-Method', { status: 400 });
  }

  const check = validateDavTarget(request.headers.get(DAV_TARGET_HEADER), {
    allowedHosts: parseAllowedHosts(env.DAV_PROXY_ALLOWED_HOSTS),
  });
  if (!check.ok) {
    return new Response(check.error, { status: check.status });
  }

  const headers = new Headers();
  for (const name of FORWARD_HEADER_ALLOWLIST) {
    const value = request.headers.get(name);
    if (value !== null) {
      headers.set(name, value);
    }
  }

  const hasBody = method !== 'GET' && method !== 'HEAD';
  const init: RequestInit & { duplex?: 'half' } = {
    method,
    headers,
    redirect: 'manual',
  };
  if (hasBody) {
    init.body = request.body;
    // Required by the runtime when streaming a request body.
    init.duplex = 'half';
  }

  let upstream: Response;
  try {
    upstream = await fetch(check.url.toString(), init);
  } catch (error) {
    return new Response(`Proxy request failed: ${String(error)}`, { status: 502 });
  }

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get('content-type');
  if (contentType) {
    responseHeaders.set('content-type', contentType);
  }
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
