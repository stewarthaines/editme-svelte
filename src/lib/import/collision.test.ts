/**
 * Unit tests for import collision detection.
 *
 * These exercise pure helpers against an in-memory workspace fixture — we avoid
 * parsing a real OPF (the unit env can't handle namespaced XML), and only the
 * `opf.manifest` array is needed to detect collisions.
 */

import { describe, it, expect } from 'vitest';
import { sanitizeChapterId, chapterCollision, manifestCollision } from './collision.js';
import { generateEPUBPath } from '../epub/opf-utils.js';
import type { WorkspaceState } from '../services/workspace/workspace.service.js';

function workspaceWith(
  manifest: { id: string; href: string; mediaType: string }[]
): WorkspaceState {
  return { opf: { manifest } } as unknown as WorkspaceState;
}

describe('sanitizeChapterId', () => {
  it('drops the extension and lowercases', () => {
    expect(sanitizeChapterId('Chapter01.txt')).toBe('chapter01');
  });

  it('replaces unsafe characters with hyphens', () => {
    expect(sanitizeChapterId('My Chapter!.md')).toBe('my-chapter-');
  });

  it('prefixes ids that would start with a non-letter', () => {
    expect(sanitizeChapterId('1-intro.txt')).toBe('item--intro');
  });

  it('falls back to "chapter" when nothing usable remains', () => {
    expect(sanitizeChapterId('.txt')).toBe('chapter');
  });

  it('does not append a uniquifying suffix', () => {
    // Unlike chapterIdFromName, this is the bare stem — collisions are reported
    // separately, not silently renamed.
    expect(sanitizeChapterId('chapter01.txt')).toBe('chapter01');
  });
});

describe('chapterCollision', () => {
  const ws = workspaceWith([
    { id: 'chapter01', href: 'Text/chapter01.xhtml', mediaType: 'application/xhtml+xml' },
  ]);

  it('returns the existing id on a collision', () => {
    expect(chapterCollision('Chapter01.txt', ws)).toBe('chapter01');
  });

  it('returns null when there is no collision', () => {
    expect(chapterCollision('chapter02.txt', ws)).toBeNull();
  });
});

describe('manifestCollision', () => {
  const href = generateEPUBPath('cover.png', 'image/png'); // e.g. "Images/cover.png"
  const ws = workspaceWith([{ id: 'img1', href, mediaType: 'image/png' }]);

  it('returns the existing href on a collision', () => {
    expect(manifestCollision('cover.png', 'image/png', ws)).toBe(href);
  });

  it('matches case-insensitively (OCF forbids case-only differences)', () => {
    const upper = workspaceWith([{ id: 'img1', href: href.toUpperCase(), mediaType: 'image/png' }]);
    expect(manifestCollision('cover.png', 'image/png', upper)).toBe(href.toUpperCase());
  });

  it('returns null when there is no collision', () => {
    expect(manifestCollision('other.png', 'image/png', ws)).toBeNull();
  });
});
