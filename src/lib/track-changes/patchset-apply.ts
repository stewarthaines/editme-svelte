/**
 * Apply accepted patchset changes to a target workspace.
 *
 * Accept = whole-file replace: chapter text via SpineService.overwriteChapter
 * (which also regenerates the chapter XHTML), other files via writeFile. Returns
 * the changed source paths so the caller can nudge an open editor to re-read.
 */

import type { WorkspaceService, WorkspaceState } from '../services/workspace/workspace.service.js';
import type { SpineService } from '../services/spine/spine.service.js';
import type { ChangeItem, Patchset } from './types.js';

/** Stable identity of a change, used to select which items are accepted. */
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
  patchset: Patchset,
  accepted: Set<string>
): Promise<{ changedPaths: string[] }> {
  const changedPaths: string[] = [];
  for (const change of patchset.changes) {
    if (!accepted.has(changeKey(change))) continue;
    if (change.kind === 'chapter-modify') {
      await deps.spineService.overwriteChapter(workspace, change.id, {
        title: change.title,
        sourceText: change.newText,
      });
      changedPaths.push(`SOURCE/text/${change.id}.txt`);
    } else {
      await deps.workspaceService.writeFile(workspace.id, change.path, change.newContent);
      changedPaths.push(change.path);
    }
  }
  return { changedPaths };
}
