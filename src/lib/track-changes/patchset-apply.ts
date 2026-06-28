/**
 * Apply resolved patchset changes to a target workspace.
 *
 * The review dialog resolves each accepted change to the exact content to write
 * (the author's current content with the selected hunks applied), so this step is
 * a plain writer: chapter text via SpineService.overwriteChapter (which also
 * regenerates the chapter XHTML), other files via writeFile. Returns the changed
 * source paths so the caller can nudge an open editor to re-read.
 */

import type { WorkspaceService, WorkspaceState } from '../services/workspace/workspace.service.js';
import type { SpineService } from '../services/spine/spine.service.js';
import type { ChangeItem, ResolvedChange } from './types.js';

/** Stable identity of a change, used for review-dialog row keys. */
export function changeKey(change: ChangeItem): string {
  return change.kind === 'chapter-modify' ? `chapter:${change.id}` : `file:${change.path}`;
}

export interface ApplyDeps {
  spineService: SpineService;
  workspaceService: WorkspaceService;
}

export async function applyPatchset(
  deps: ApplyDeps,
  workspace: WorkspaceState,
  resolved: ResolvedChange[]
): Promise<{ changedPaths: string[] }> {
  const changedPaths: string[] = [];
  for (const change of resolved) {
    if (change.kind === 'chapter-modify') {
      await deps.spineService.overwriteChapter(workspace, change.id, {
        title: change.title,
        sourceText: change.content,
      });
      changedPaths.push(`SOURCE/text/${change.id}.txt`);
    } else {
      await deps.workspaceService.writeFile(workspace.id, change.path, change.content);
      changedPaths.push(change.path);
    }
  }
  return { changedPaths };
}
