/**
 * Per-chapter metadata sidecar (`SOURCE/text/{id}.json`).
 *
 * Holds authorable head metadata for a spine item — currently just the chapter
 * title used in the content document's `<title>`. It lives next to the chapter's
 * plain-text source so it travels with the SOURCE set (packed into SOURCE.zip /
 * the Active EPUB) and round-trips, while keeping the `.txt` pure prose.
 *
 * Shaped as an object so it can grow (e.g. per-chapter stylesheet/viewport
 * overrides) without another storage decision later.
 */

import type { FileStorageAPI } from '../storage/index.js';

export interface ChapterMeta {
  /** Chapter title for the content document `<title>`; falls back to the spine id. */
  title?: string;
}

/** Path of a chapter's metadata sidecar, beside its `SOURCE/text/{id}.txt` source. */
export function chapterMetaPath(id: string): string {
  return `SOURCE/text/${id}.json`;
}

/**
 * Read a chapter's sidecar metadata. Returns `{}` when the file is absent or
 * unparseable — never throws, never creates anything.
 */
export async function readChapterMeta(
  fileStorage: FileStorageAPI,
  workspaceId: string,
  id: string
): Promise<ChapterMeta> {
  try {
    const raw = await fileStorage.readTextFile(workspaceId, chapterMetaPath(id));
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const meta: ChapterMeta = {};
    const title = (parsed as { title?: unknown }).title;
    if (typeof title === 'string') meta.title = title;
    return meta;
  } catch {
    // No sidecar yet, or it's unreadable/malformed — treat as empty.
    return {};
  }
}

/**
 * Persist a chapter's sidecar metadata. Empty/whitespace fields are dropped, and
 * the sidecar is removed entirely when nothing meaningful remains, so we never
 * leave an empty `{}` file behind.
 */
export async function writeChapterMeta(
  fileStorage: FileStorageAPI,
  workspaceId: string,
  id: string,
  meta: ChapterMeta
): Promise<void> {
  const clean: ChapterMeta = {};
  const title = meta.title?.trim();
  if (title) clean.title = title;

  const path = chapterMetaPath(id);
  if (Object.keys(clean).length === 0) {
    try {
      await fileStorage.deleteFile(workspaceId, path);
    } catch {
      // Nothing to remove — fine.
    }
    return;
  }
  await fileStorage.writeTextFile(workspaceId, path, JSON.stringify(clean, null, 2));
}
