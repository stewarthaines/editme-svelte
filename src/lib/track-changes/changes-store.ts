/**
 * Cross-project patchset store.
 *
 * Patchsets live in a reserved `changes` workspace (parallel to the `importing`
 * and `publish` reserved workspaces) so they survive across projects and can be
 * listed and applied to any matching project.
 */

import { FileStorageAPI } from '../storage/index.js';
import type { Patchset } from './types.js';

/** Reserved workspace id holding all patchsets. */
export const CHANGES_WORKSPACE_ID = 'changes';

const dir = 'patchsets';
const pathFor = (id: string) => `${dir}/${id}.json`;

export async function savePatchset(patchset: Patchset): Promise<void> {
  const storage = FileStorageAPI.getInstance();
  await storage.createWorkspace(CHANGES_WORKSPACE_ID);
  await storage.writeTextFile(
    CHANGES_WORKSPACE_ID,
    pathFor(patchset.id),
    JSON.stringify(patchset, null, 2)
  );
}

/** Load all patchsets, newest first. Malformed entries are skipped. */
export async function listPatchsets(): Promise<Patchset[]> {
  const storage = FileStorageAPI.getInstance();
  let files: string[];
  try {
    files = await storage.listFiles(CHANGES_WORKSPACE_ID, dir);
  } catch {
    return []; // no changes workspace yet
  }
  const patchsets: Patchset[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      patchsets.push(
        JSON.parse(await storage.readTextFile(CHANGES_WORKSPACE_ID, file)) as Patchset
      );
    } catch {
      // Skip unreadable/corrupt patchset files.
    }
  }
  return patchsets.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deletePatchset(id: string): Promise<void> {
  const storage = FileStorageAPI.getInstance();
  try {
    await storage.deleteFile(CHANGES_WORKSPACE_ID, pathFor(id));
  } catch {
    // Already gone — nothing to do.
  }
}
