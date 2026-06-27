/**
 * Packaging optimization for track-changes base snapshots.
 *
 * In the live workspace a base snapshot is a full copy at `SOURCE/main/<path>`.
 * When that ships inside SEED.zip it duplicates near-identical content, so at
 * package time we substitute a unified diff (current → base) when that's smaller,
 * and rehydrate the full base on import. Diffs are stored at
 * `SOURCE/main/<path>.patch` so each entry is self-describing (a plain entry is a
 * full copy — also what pre-optimization EPUBs contain).
 */

import { createPatch, applyPatch } from 'diff';
import { BASE_PREFIX } from './base-snapshot.js';

/** Marks a `SOURCE/main` entry stored as a unified diff rather than a full copy. */
export const BASE_PATCH_SUFFIX = '.patch';

/** The package path for a base diff of `original` (the workspace-relative path). */
export function basePatchPath(original: string): string {
  return `${BASE_PREFIX}${original}${BASE_PATCH_SUFFIX}`;
}

/** The original workspace path encoded by a `SOURCE/main/<path>.patch` entry. */
export function originalFromBasePatch(patchPath: string): string {
  return patchPath.slice(BASE_PREFIX.length, -BASE_PATCH_SUFFIX.length);
}

/**
 * Encode a base as a unified diff against the current content — but only when it's
 * a net win: the diff must reconstruct the base exactly *and* be smaller than the
 * full base. Returns the patch text, or null meaning "ship the full copy instead".
 */
export function encodeBaseDiff(
  original: string,
  currentText: string,
  baseText: string
): string | null {
  const patch = createPatch(original, currentText, baseText); // current → base
  if (patch.length >= baseText.length) return null; // not smaller — keep full copy
  if (applyPatch(currentText, patch) !== baseText) return null; // wouldn't reconstruct
  return patch;
}

/**
 * Reconstruct a base from the current content + a stored diff. Returns null if the
 * patch does not apply (shouldn't happen — verified at encode time).
 */
export function decodeBaseDiff(currentText: string, patchText: string): string | null {
  const result = applyPatch(currentText, patchText);
  return result === false ? null : result;
}
