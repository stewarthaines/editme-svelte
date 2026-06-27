import { describe, it, expect } from 'vitest';
import {
  encodeBaseDiff,
  decodeBaseDiff,
  basePatchPath,
  originalFromBasePatch,
  BASE_PATCH_SUFFIX,
} from './base-diff.js';

// A long file so a one-line edit produces a diff much smaller than the full base.
const baseLines = Array.from({ length: 60 }, (_, i) => `line ${i + 1}`).join('\n') + '\n';
const currentLines = baseLines.replace('line 30', 'line 30 — edited by reviewer');

describe('encodeBaseDiff', () => {
  it('returns a diff that reconstructs the base, smaller than the full copy', () => {
    const patch = encodeBaseDiff('SOURCE/text/ch01.txt', currentLines, baseLines);
    expect(patch).not.toBeNull();
    expect(patch!.length).toBeLessThan(baseLines.length);
    expect(decodeBaseDiff(currentLines, patch!)).toBe(baseLines);
  });

  it('returns null for tiny files where the diff would be larger', () => {
    expect(encodeBaseDiff('SOURCE/text/x.txt', 'a\n', 'b\n')).toBeNull();
  });
});

describe('decodeBaseDiff', () => {
  it('round-trips an encoded diff', () => {
    const patch = encodeBaseDiff('f', currentLines, baseLines)!;
    expect(decodeBaseDiff(currentLines, patch)).toBe(baseLines);
  });

  it('returns null when the patch does not apply to the given current text', () => {
    const patch = encodeBaseDiff('f', currentLines, baseLines)!;
    expect(decodeBaseDiff('completely different content\n', patch)).toBeNull();
  });
});

describe('base patch path helpers', () => {
  it('round-trips a SOURCE/main path through the .patch suffix', () => {
    const original = 'SOURCE/text/ch01.txt';
    const packaged = basePatchPath(original);
    expect(packaged).toBe(`SOURCE/main/${original}${BASE_PATCH_SUFFIX}`);
    expect(originalFromBasePatch(packaged)).toBe(original);
  });
});
