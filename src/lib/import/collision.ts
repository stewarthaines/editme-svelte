/**
 * Collision detection for the two-step import flow.
 *
 * Both import surfaces derive a target identifier from an incoming filename and,
 * today, silently auto-rename on a clash (chapters via `chapterIdFromName`,
 * manifest items via `ensureUniqueHref`). To offer an overwrite, we first need to
 * know the *un-suffixed* target and whether it already exists.
 */

import type { WorkspaceState } from '../services/workspace/workspace.service.js';
import { generateEPUBPath } from '../epub/opf-utils.js';

/**
 * Derive an XML-safe chapter id stem from a name (e.g. a filename) — without the
 * uniquifying `-1`, `-2` suffix. Shared with `SpineService.chapterIdFromName` so
 * collision checks and chapter creation agree on the base id.
 */
export function sanitizeChapterId(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, '') // drop extension
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/^[^a-zA-Z]/, 'item-') // ids must start with a letter
      .toLowerCase() || 'chapter'
  );
}

/**
 * The chapter id an imported file would target. Returns the existing manifest id
 * it collides with, or `null` when there is no collision.
 */
export function chapterCollision(name: string, workspace: WorkspaceState): string | null {
  const id = sanitizeChapterId(name);
  return workspace.opf.manifest.some(item => item.id === id) ? id : null;
}

/**
 * The manifest href an imported file would target (the pre-`ensureUniqueHref`
 * path). Returns the existing href it collides with (case-insensitively, per the
 * OCF spec), or `null` when there is no collision.
 */
export function manifestCollision(
  name: string,
  mediaType: string,
  workspace: WorkspaceState
): string | null {
  const href = generateEPUBPath(name, mediaType);
  const existing = workspace.opf.manifest.find(
    item => item.href.toLowerCase() === href.toLowerCase()
  );
  return existing ? existing.href : null;
}
