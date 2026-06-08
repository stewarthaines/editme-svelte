import { describe, it, expect } from 'vitest';
import { snippetAroundClick } from './preview-click.js';

describe('snippetAroundClick', () => {
  const text = 'the quick brown fox jumps over the lazy dog';
  //            0   4     10    16  20    26   31  35   40

  it('centres a 5-word window on the clicked word', () => {
    // Click inside "fox" (offset 17).
    expect(snippetAroundClick(text, 17, 5)).toBe('quick brown fox jumps over');
  });

  it('honours a smaller word count', () => {
    expect(snippetAroundClick(text, 17, 3)).toBe('brown fox jumps');
  });

  it('clamps the window at the start of the node', () => {
    // Click in the first word — window starts at the beginning.
    expect(snippetAroundClick(text, 1, 5)).toBe('the quick brown fox jumps');
  });

  it('clamps the window at the end of the node', () => {
    // Click in the last word — window ends at the last word.
    expect(snippetAroundClick(text, text.length - 1, 5)).toBe('jumps over the lazy dog');
  });

  it('returns the whole text when it has fewer words than the window', () => {
    expect(snippetAroundClick('hello there', 0, 5)).toBe('hello there');
  });

  it('collapses internal/leading/trailing whitespace', () => {
    expect(snippetAroundClick('  one   two\tthree\n four ', 8, 5)).toBe('one two three four');
  });

  it('picks the trailing word when the caret is in trailing whitespace', () => {
    expect(snippetAroundClick('alpha beta', 10, 3)).toBe('alpha beta');
  });

  it('returns empty for whitespace-only or empty input', () => {
    expect(snippetAroundClick('   ', 1)).toBe('');
    expect(snippetAroundClick('', 0)).toBe('');
  });
});
