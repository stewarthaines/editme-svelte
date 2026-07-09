import { describe, it, expect } from 'vitest';
import { buildReviewGroups, applySelectedHunks, diffSegments } from './hunks.js';

// Three edits separated by unchanged lines → three independent groups.
const current = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join('\n') + '\n';
const incoming = current
  .replace('line 3', 'line 3 EDIT')
  .replace('line 10', 'line 10 EDIT')
  .replace('line 17', 'line 17 EDIT');

describe('buildReviewGroups', () => {
  it('produces one group per separated edit, each with leading context', () => {
    const { groups } = buildReviewGroups(current, incoming);
    expect(groups).toHaveLength(3);
    for (const g of groups) {
      expect(g.changes.length).toBeGreaterThan(0);
      expect(g.contextBefore.length).toBeGreaterThan(0); // some orientation context
      expect(g.contextBefore.length).toBeLessThanOrEqual(3);
    }
    // The first group's change is the line-3 edit.
    expect(groups[0].changes.some(c => c.sign === '+' && c.text === 'line 3 EDIT')).toBe(true);
  });
});

describe('applySelectedHunks', () => {
  it('applies only the selected edit', () => {
    const { patch } = buildReviewGroups(current, incoming);
    const firstOnly = applySelectedHunks(current, patch, [true, false, false]);
    expect(firstOnly).toContain('line 3 EDIT');
    expect(firstOnly).not.toContain('line 10 EDIT');
    expect(firstOnly).not.toContain('line 17 EDIT');
  });

  it('all selected === incoming, none selected === current', () => {
    const { patch } = buildReviewGroups(current, incoming);
    expect(applySelectedHunks(current, patch, [true, true, true])).toBe(incoming);
    expect(applySelectedHunks(current, patch, [false, false, false])).toBe(current);
  });
});

describe('diffSegments (editor revert view)', () => {
  const base = 'line 1\nline 2\nline 3\nline 4\nline 5\n';
  const edited = 'line 1\nline 2 EDIT\nline 3\nline 4\nline 5 EDIT\n';

  it('isolates each change region with context between them', () => {
    const { segments } = diffSegments(base, edited);
    expect(segments.filter(s => s.type === 'change')).toHaveLength(2);
    expect(segments.some(s => s.type === 'context')).toBe(true);
  });

  it('reverting one region restores base there and keeps the other edit', () => {
    const { revertPatch } = diffSegments(base, edited);
    const next = applySelectedHunks(
      edited,
      revertPatch,
      revertPatch.hunks.map((_, i) => i === 0)
    );
    expect(next).toContain('line 2\n');
    expect(next).not.toContain('line 2 EDIT');
    expect(next).toContain('line 5 EDIT');
  });

  it('reverting all regions restores the base exactly', () => {
    const { revertPatch } = diffSegments(base, edited);
    expect(
      applySelectedHunks(
        edited,
        revertPatch,
        revertPatch.hunks.map(() => true)
      )
    ).toBe(base);
  });
});
