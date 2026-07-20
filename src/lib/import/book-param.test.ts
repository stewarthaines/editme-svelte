/**
 * Unit tests for the `?book=` deep-link parser (the READ.html hand-off).
 * The scheme guarantee is the point: the param is attacker-suppliable.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseBookParam } from './book-param.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('parseBookParam', () => {
  it('returns an https book URL', () => {
    expect(parseBookParam('?book=https://example.com/books/tale.epub')).toBe(
      'https://example.com/books/tale.epub'
    );
  });

  it('returns an http book URL', () => {
    expect(parseBookParam('?book=http://localhost:8080/tale.epub')).toBe(
      'http://localhost:8080/tale.epub'
    );
  });

  it('decodes an encoded URL value', () => {
    expect(parseBookParam('?book=https%3A%2F%2Fexample.com%2Ftale.epub')).toBe(
      'https://example.com/tale.epub'
    );
  });

  it('returns null when the param is absent', () => {
    expect(parseBookParam('')).toBeNull();
    expect(parseBookParam('?catalog=https://example.com/feed.xml')).toBeNull();
  });

  it('ignores non-http(s) schemes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseBookParam('?book=javascript:alert(1)')).toBeNull();
    expect(parseBookParam('?book=data:application/epub%2Bzip;base64,AAAA')).toBeNull();
    expect(parseBookParam('?book=file:///etc/passwd')).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('ignores relative and malformed URLs', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseBookParam('?book=/books/tale.epub')).toBeNull();
    expect(parseBookParam('?book=not a url')).toBeNull();
  });
});
