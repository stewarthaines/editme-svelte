/**
 * Hunk-level helpers for patchset review.
 *
 * A patchset change carries the reviewer's full new content; on the author's side
 * we diff it against the author's current content and let the user accept/reject
 * individual edits. We use `context: 0` so each contiguous edit is its own unit
 * (one checkbox per edit), synthesizing a few leading context lines from the
 * current text for readability. Built on jsdiff: `structuredPatch` for the hunks
 * and `applyPatch` with a hunk subset to produce the merged result.
 */

import { structuredPatch, applyPatch, diffLines, type StructuredPatch } from 'diff';

export type FilePatch = StructuredPatch;

export interface ReviewGroup {
  /** Index into `patch.hunks` / the selection array. */
  index: number;
  /** Up to `context` unchanged lines immediately before the edit (for orientation). */
  contextBefore: string[];
  /** The edit's removed/added lines. */
  changes: { sign: '+' | '-'; text: string }[];
}

/**
 * Build the review model for a file: a `context: 0` patch (one hunk per contiguous
 * edit, used for selection + apply) and a per-edit display group with leading
 * context. `context` bounds the leading lines so it never dumps the whole file.
 */
export function buildReviewGroups(
  current: string,
  incoming: string,
  context = 3
): { patch: FilePatch; groups: ReviewGroup[] } {
  const patch = structuredPatch('current', 'incoming', current, incoming, '', '', { context: 0 });
  const lines = current.split('\n');
  let prevEnd = 0; // 0-based index just past the previous group's old lines
  const groups: ReviewGroup[] = patch.hunks.map((h, index) => {
    const start = Math.max(0, h.oldStart - 1); // 0-based first old line of this hunk
    const ctxStart = Math.max(prevEnd, start - context, 0);
    const contextBefore = lines.slice(ctxStart, start);
    const changes = h.lines.map(l => ({ sign: (l[0] === '+' ? '+' : '-') as '+' | '-', text: l.slice(1) }));
    prevEnd = start + h.oldLines;
    return { index, contextBefore, changes };
  });
  return { patch, groups };
}

/**
 * A run of the base→current diff: an unchanged `context` block, or a `change`
 * region (removed/added lines) the user can revert. A change region's `index`
 * matches the hunk index in the returned `revertPatch`.
 */
export type DiffSegment =
  | { type: 'context'; lines: string[] }
  | { type: 'change'; index: number; removed: string[]; added: string[] };

function splitLines(value: string): string[] {
  const lines = value.split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/**
 * Segment the base→current diff for display (full context, with each change
 * region isolated) and return a `revertPatch` (current→base, `context: 0`) whose
 * hunks line up 1:1 with the change regions — so reverting region `i` is
 * `applySelectedHunks(current, revertPatch, only i)`.
 */
export function diffSegments(
  base: string,
  current: string
): { segments: DiffSegment[]; revertPatch: FilePatch } {
  const segments: DiffSegment[] = [];
  let changeIndex = -1;
  let pending: { removed: string[]; added: string[] } | null = null;
  const flush = () => {
    if (!pending) return;
    changeIndex += 1;
    segments.push({ type: 'change', index: changeIndex, removed: pending.removed, added: pending.added });
    pending = null;
  };
  for (const part of diffLines(base, current)) {
    const lines = splitLines(part.value);
    if (!part.added && !part.removed) {
      flush();
      if (lines.length) segments.push({ type: 'context', lines });
    } else {
      if (!pending) pending = { removed: [], added: [] };
      if (part.removed) pending.removed.push(...lines);
      else pending.added.push(...lines);
    }
  }
  flush();
  const revertPatch = structuredPatch('current', 'base', current, base, '', '', { context: 0 });
  return { segments, revertPatch };
}

/**
 * Apply only the selected hunks of `patch` onto `current`, yielding the merged
 * text. None selected → `current` unchanged; all selected → the full incoming
 * content. Falls back to `current` if the patch unexpectedly fails to apply.
 */
export function applySelectedHunks(
  current: string,
  patch: FilePatch,
  selected: boolean[]
): string {
  const hunks = patch.hunks.filter((_, i) => selected[i]);
  if (hunks.length === 0) return current;
  const result = applyPatch(current, { ...patch, hunks });
  return result === false ? current : result;
}
