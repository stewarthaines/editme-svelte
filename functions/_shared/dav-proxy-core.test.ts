import { describe, it, expect } from 'vitest';
import { validateDavTarget, normaliseMethod, parseAllowedHosts } from './dav-proxy-core';

describe('validateDavTarget', () => {
  it('accepts a normal https host', () => {
    const r = validateDavTarget('https://dav.example.com/files/books/');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url.hostname).toBe('dav.example.com');
  });

  it('rejects a missing or unparseable target', () => {
    expect(validateDavTarget(undefined)).toMatchObject({ ok: false, status: 400 });
    expect(validateDavTarget('not a url')).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects http by default but allows it when allowInsecure', () => {
    expect(validateDavTarget('http://dav.example.com/')).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(validateDavTarget('http://dav.example.com/', { allowInsecure: true }).ok).toBe(true);
  });

  it('rejects private / loopback / link-local / metadata IPv4 literals', () => {
    for (const host of [
      'https://127.0.0.1/',
      'https://10.0.0.5/',
      'https://192.168.1.10/',
      'https://172.16.0.1/',
      'https://169.254.169.254/',
      'https://0.0.0.0/',
    ]) {
      expect(validateDavTarget(host)).toMatchObject({ ok: false, status: 403 });
    }
  });

  it('rejects localhost, *.local and IPv6 loopback/private literals', () => {
    for (const host of [
      'https://localhost/',
      'https://nas.local/',
      'https://[::1]/',
      'https://[fe80::1]/',
      'https://[fc00::1]/',
    ]) {
      expect(validateDavTarget(host)).toMatchObject({ ok: false, status: 403 });
    }
  });

  it('enforces the allowlist when one is set (exact + dot-suffix)', () => {
    const opts = { allowedHosts: ['example.com'] };
    expect(validateDavTarget('https://example.com/', opts).ok).toBe(true);
    expect(validateDavTarget('https://dav.example.com/', opts).ok).toBe(true);
    expect(validateDavTarget('https://evil.com/', opts)).toMatchObject({
      ok: false,
      status: 403,
    });
    // notexample.com must not match a `example.com` suffix entry.
    expect(validateDavTarget('https://notexample.com/', opts)).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it('imposes no host restriction when the allowlist is empty', () => {
    expect(validateDavTarget('https://anywhere.example.org/', { allowedHosts: [] }).ok).toBe(true);
  });
});

describe('normaliseMethod', () => {
  it('upper-cases and accepts known WebDAV methods', () => {
    expect(normaliseMethod('propfind')).toBe('PROPFIND');
    expect(normaliseMethod('PUT')).toBe('PUT');
    expect(normaliseMethod('delete')).toBe('DELETE');
  });

  it('rejects unknown or missing methods', () => {
    expect(normaliseMethod('TRACE')).toBeNull();
    expect(normaliseMethod('')).toBeNull();
    expect(normaliseMethod(null)).toBeNull();
  });
});

describe('parseAllowedHosts', () => {
  it('splits, trims and drops empties', () => {
    expect(parseAllowedHosts(' a.com, b.com ,, c.com ')).toEqual(['a.com', 'b.com', 'c.com']);
    expect(parseAllowedHosts(undefined)).toEqual([]);
    expect(parseAllowedHosts('')).toEqual([]);
  });
});
