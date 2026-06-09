/**
 * Shared, runtime-agnostic logic for the same-origin WebDAV proxy.
 *
 * Used by both the Cloudflare Pages Function (`functions/dav.ts`, Workers
 * runtime) and the Vite dev-server middleware (`vite.config.ts`, Node), so the
 * two agree on the request contract and the SSRF guards. Only the web-standard
 * `URL` is referenced here — no Node or Workers APIs — so it type-checks and
 * runs unchanged in both.
 *
 * Request contract (browser -> proxy, same-origin POST):
 *   X-DAV-URL    full destination URL of the WebDAV resource/collection
 *   X-DAV-Method the real WebDAV method to issue (PROPFIND/PUT/DELETE/...)
 *   plus any FORWARD_HEADER_ALLOWLIST headers, forwarded verbatim, and the body.
 */

/** Control header naming the real WebDAV target URL. Lower-case (Node lowercases). */
export const DAV_TARGET_HEADER = 'x-dav-url';

/** Control header naming the real WebDAV method to issue. */
export const DAV_METHOD_HEADER = 'x-dav-method';

/** Request headers the proxy forwards verbatim to the WebDAV server. */
export const FORWARD_HEADER_ALLOWLIST = [
  'authorization',
  'depth',
  'content-type',
  'destination',
  'overwrite',
] as const;

/** WebDAV methods the proxy is willing to issue on the user's behalf. */
export const ALLOWED_DAV_METHODS = [
  'GET',
  'HEAD',
  'PUT',
  'DELETE',
  'PROPFIND',
  'MKCOL',
  'MOVE',
  'COPY',
] as const;

export type ValidateResult = { ok: true; url: URL } | { ok: false; status: number; error: string };

export interface ValidateOptions {
  /**
   * When non-empty, the target host must match one of these entries (exact, or
   * a dot-suffix match so `example.com` also permits `dav.example.com`).
   */
  allowedHosts?: string[];
  /** Allow `http:` targets. Dev-only; production requires `https:`. */
  allowInsecure?: boolean;
}

/** Private/loopback/link-local IPv4 literal prefixes (and the cloud-metadata IP). */
const PRIVATE_IPV4 = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
];

/** True when the host is a loopback/private/link-local literal we must not reach. */
function isPrivateHost(host: string): boolean {
  // URL.hostname keeps the surrounding brackets on IPv6 literals; strip them.
  const h = host.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')) {
    return true;
  }
  if (h.includes(':')) {
    // IPv6 literal (URL.hostname strips the surrounding brackets).
    if (h === '::1' || h === '0:0:0:0:0:0:0:1') return true;
    // fe80::/10 link-local (fe80–febf) and fc00::/7 unique-local (fc/fd).
    if (/^fe[89ab]/.test(h) || h.startsWith('fc') || h.startsWith('fd')) {
      return true;
    }
    if (h.startsWith('::ffff:')) {
      const v4 = h.slice('::ffff:'.length);
      return PRIVATE_IPV4.some(re => re.test(v4));
    }
    return false;
  }
  return PRIVATE_IPV4.some(re => re.test(h));
}

function hostMatchesAllowlist(host: string, allowed: string[]): boolean {
  const h = host.toLowerCase();
  return allowed.some(entry => {
    const item = entry.trim().toLowerCase();
    if (!item) return false;
    return h === item || h.endsWith(`.${item}`);
  });
}

/**
 * Validate a user-supplied WebDAV target before the proxy will forward to it:
 * require https (unless `allowInsecure`), reject private/loopback/link-local
 * hosts, and enforce the optional allowlist.
 *
 * Note: the Workers runtime has no DNS-resolution API, so a public hostname that
 * resolves to a private address can't be caught here (DNS-rebinding). This is
 * mitigated because Cloudflare's edge won't route a Function's fetch into
 * private networks, and by the allowlist for public deployments.
 */
export function validateDavTarget(
  urlStr: string | null | undefined,
  opts: ValidateOptions = {}
): ValidateResult {
  if (!urlStr) {
    return { ok: false, status: 400, error: 'Missing target URL' };
  }
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    return { ok: false, status: 400, error: 'Invalid target URL' };
  }
  const insecureOk = opts.allowInsecure === true && url.protocol === 'http:';
  if (url.protocol !== 'https:' && !insecureOk) {
    return { ok: false, status: 400, error: 'Target must use https' };
  }
  if (isPrivateHost(url.hostname)) {
    return { ok: false, status: 403, error: 'Target host is not allowed' };
  }
  const allow = (opts.allowedHosts ?? []).filter(Boolean);
  if (allow.length > 0 && !hostMatchesAllowlist(url.hostname, allow)) {
    return { ok: false, status: 403, error: 'Target host is not in the allowlist' };
  }
  return { ok: true, url };
}

/** Normalise/validate the requested WebDAV method; null when unsupported. */
export function normaliseMethod(method: string | null | undefined): string | null {
  if (!method) return null;
  const upper = method.toUpperCase();
  return (ALLOWED_DAV_METHODS as readonly string[]).includes(upper) ? upper : null;
}

/** Parse a comma-separated DAV_PROXY_ALLOWED_HOSTS env value into a host list. */
export function parseAllowedHosts(value: string | undefined | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}
