/**
 * Publish sidecars
 *
 * At packaging time we write a small JSON metadata file (and, when the project
 * has a cover, a downscaled thumbnail PNG) next to each `<base>.epub` in the
 * shared publish output directory. The publish-to-remote plugin reads these to
 * build rich OPDS catalog entries (cover thumbnail + description + Dublin Core
 * metadata) that it otherwise couldn't derive from a remote file listing.
 *
 * Sidecars stay local (they are not uploaded); the plugin matches them to remote
 * objects by filename.
 */

import type { FileStorageAPI } from '../../storage/index.js';
import type { EPUBMetadata } from '../../epub/opf-utils.js';
import { resizeImageToPng } from '../../epub/image-thumbnail.js';
import { PUBLISH_WORKSPACE_ID } from '../../workspace/types.js';

/** Shape of the `<base>.json` sidecar. Mirrored by the plugin's CatalogEntryMeta. */
export interface PublishSidecar {
  title: string;
  authors?: string[];
  description?: string;
  language?: string;
  publisher?: string;
  issued?: string;
  identifier?: string;
  subjects?: string[];
  /** Sibling thumbnail filename (`<base>.thumb.png`), present only with a cover. */
  thumbnail?: string;
}

const THUMB_MAX_DIM = 256;

/** Strip the `.epub` extension to get the shared sidecar basename. */
function baseName(epubFilename: string): string {
  return epubFilename.replace(/\.epub$/i, '');
}

/**
 * Write `<base>.json` (and `<base>.thumb.png` when a cover is supplied) into the
 * publish directory. Best-effort — callers should not let a sidecar failure
 * break packaging.
 */
export async function writePublishSidecar(
  fileStorage: FileStorageAPI,
  coverImageData: { buffer: ArrayBuffer; mediaType: string } | undefined,
  metadata: EPUBMetadata,
  epubFilename: string
): Promise<void> {
  const base = baseName(epubFilename);

  const sidecar: PublishSidecar = {
    title: metadata.title,
    authors: metadata.creator?.map(c => c.name).filter(Boolean),
    description: metadata.description,
    language: metadata.language?.[0],
    publisher: metadata.publisher,
    issued: metadata.date,
    identifier: metadata.identifier,
    subjects: metadata.subject
      ?.map(s => (typeof s === 'string' ? s : s.value))
      .filter(Boolean),
  };

  // Drop empty arrays/undefined for a tidy sidecar.
  if (!sidecar.authors?.length) delete sidecar.authors;
  if (!sidecar.subjects?.length) delete sidecar.subjects;

  if (coverImageData) {
    try {
      const thumb = await resizeImageToPng(
        coverImageData.buffer,
        coverImageData.mediaType,
        THUMB_MAX_DIM
      );
      const thumbName = `${base}.thumb.png`;
      await fileStorage.writeFile(PUBLISH_WORKSPACE_ID, thumbName, thumb);
      sidecar.thumbnail = thumbName;
    } catch {
      // No thumbnail — the entry will still carry its text metadata.
    }
  }

  await fileStorage.writeTextFile(
    PUBLISH_WORKSPACE_ID,
    `${base}.json`,
    JSON.stringify(sidecar, null, 2)
  );
}

/** Remove a published EPUB's sidecar files (best-effort, idempotent). */
export async function deletePublishSidecar(
  fileStorage: FileStorageAPI,
  epubFilename: string
): Promise<void> {
  const base = baseName(epubFilename);
  for (const name of [`${base}.json`, `${base}.thumb.png`]) {
    try {
      await fileStorage.deleteFile(PUBLISH_WORKSPACE_ID, name);
    } catch {
      // Sidecar may not exist (e.g. coverless project) — ignore.
    }
  }
}
