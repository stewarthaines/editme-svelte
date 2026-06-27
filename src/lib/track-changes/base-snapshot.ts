/**
 * Track-changes base snapshot (copy-on-first-change).
 *
 * When a workspace is in review mode, the first time a *trackable* source file is
 * about to be overwritten we copy its current bytes to `SOURCE/main/<path>`. That
 * snapshot is the base a patchset diffs against, and it travels inside the EPUB
 * (under SOURCE/, packaged into SEED.zip) so a returned review copy is
 * self-describing.
 *
 * Trackable content this iteration: chapter plain text (`SOURCE/text/*.txt`) and
 * the EPUB's stylesheets / reading-system scripts (`*.css` / `*.js` outside
 * SOURCE/). Structure (`content.opf`) and metadata are deliberately *not* tracked —
 * review mode locks them in the UI instead.
 */

import type { FileStorageAPI } from '../storage/index.js';

/** Directory (workspace-relative) that holds base snapshots. */
export const BASE_PREFIX = 'SOURCE/main/';

// Workspaces currently in review mode. Maintained by app-state on workspace load
// and by the Track Changes toggle, so the write hook can check synchronously
// without an async settings read on every write.
const reviewModeWorkspaces = new Set<string>();

export function setReviewMode(workspaceId: string, enabled: boolean): void {
  if (enabled) reviewModeWorkspaces.add(workspaceId);
  else reviewModeWorkspaces.delete(workspaceId);
}

export function isReviewMode(workspaceId: string): boolean {
  return reviewModeWorkspaces.has(workspaceId);
}

/** Whether a workspace-relative path is trackable content. */
export function isTrackable(path: string): boolean {
  if (path.startsWith(BASE_PREFIX)) return false; // never snapshot the base itself
  if (path.startsWith('SOURCE/data/')) return false; // transform output, derived
  if (/^SOURCE\/text\/[^/]+\.txt$/.test(path)) return true; // chapter source text
  // EPUB stylesheet / reading-system script (lives under OEBPS, not SOURCE/)
  if (!path.startsWith('SOURCE/') && (path.endsWith('.css') || path.endsWith('.js'))) return true;
  return false;
}

/**
 * If the workspace is in review mode and `path` is trackable and has no base yet,
 * snapshot its current on-disk content to `SOURCE/main/<path>` — but only when the
 * incoming write actually changes it. The editor autosaves identical content on
 * load/selection, which would otherwise create a spurious base for files the user
 * only viewed. No-op when nothing changed, when there's nothing to snapshot (new
 * file), or when a base already exists. Best-effort: never throws into the caller's
 * write path.
 */
export async function captureBaseIfNeeded(
  fileStorage: FileStorageAPI,
  workspaceId: string,
  path: string,
  newContent: string
): Promise<void> {
  try {
    if (!isReviewMode(workspaceId) || !isTrackable(path)) return;
    const basePath = BASE_PREFIX + path;
    if (await fileStorage.fileExists(workspaceId, basePath)) return;
    let current: string;
    try {
      current = await fileStorage.readTextFile(workspaceId, path);
    } catch {
      return; // new file — nothing to snapshot
    }
    if (current === newContent) return; // identical write (no real edit) — don't snapshot
    await fileStorage.writeTextFile(workspaceId, basePath, current);
    // Let the editor surface a "Changes" affordance for this file immediately.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('seed:base-captured', { detail: { path } }));
    }
  } catch {
    // Transient read/write error — skip silently.
  }
}

/** Remove the entire base snapshot (used when track changes is turned off). */
export async function deleteBase(fileStorage: FileStorageAPI, workspaceId: string): Promise<void> {
  const files = await fileStorage.listFiles(workspaceId, 'SOURCE/main');
  for (const filePath of files) {
    await fileStorage.deleteFile(workspaceId, filePath);
  }
}
