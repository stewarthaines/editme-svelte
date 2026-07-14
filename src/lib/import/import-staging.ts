/**
 * Staging area for the two-step import flow.
 *
 * Colliding files are written to OPFS *before* the user confirms the import, so
 * the review dialog reads their content from storage and the commit step has a
 * single source of truth. Staging lives in a reserved `importing` workspace —
 * parallel to the existing reserved `publish` workspace — and is cleared once the
 * import is committed or cancelled.
 */

import { FileStorageAPI } from '../storage/index.js';
import { toEpubSafeFilename } from '../epub/opf-utils.js';

/** Reserved workspace id used purely as an import staging area. */
const IMPORT_WORKSPACE_ID = 'importing';

export interface StagedFile {
  /** Path within the `importing` workspace where the bytes live. */
  stagedPath: string;
  /** Original uploaded file name. */
  originalName: string;
}

/**
 * Write the given files into the staging workspace, replacing any previous
 * staging contents. File names are prefixed with their index to keep distinct
 * incoming files from colliding with each other in the staging directory.
 */
export async function stageFiles(files: File[]): Promise<StagedFile[]> {
  const storage = FileStorageAPI.getInstance();
  await clearImportStaging();
  await storage.createWorkspace(IMPORT_WORKSPACE_ID);

  const staged: StagedFile[] = [];
  let index = 0;
  for (const file of files) {
    const stagedPath = `staged/${index}-${toEpubSafeFilename(file.name)}`;
    await storage.writeFile(IMPORT_WORKSPACE_ID, stagedPath, await file.arrayBuffer());
    staged.push({ stagedPath, originalName: file.name });
    index += 1;
  }
  return staged;
}

/** Read a staged file's raw bytes. */
export async function readStagedBytes(stagedPath: string): Promise<Uint8Array> {
  const storage = FileStorageAPI.getInstance();
  return new Uint8Array(await storage.readFile(IMPORT_WORKSPACE_ID, stagedPath));
}

/** Read a staged file decoded as UTF-8 text. */
export async function readStagedText(stagedPath: string): Promise<string> {
  return new TextDecoder('utf-8').decode(await readStagedBytes(stagedPath));
}

/** Remove the staging workspace and everything in it. Safe to call when empty. */
export async function clearImportStaging(): Promise<void> {
  const storage = FileStorageAPI.getInstance();
  try {
    await storage.deleteWorkspace(IMPORT_WORKSPACE_ID);
  } catch {
    // Nothing staged yet — deleting a missing workspace is a no-op for us.
  }
}
