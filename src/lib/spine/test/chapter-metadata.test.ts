import { describe, it, expect, beforeEach } from 'vitest';
import { MockFileStorage } from '../../test/mocks/file-storage.mock.js';
import type { FileStorageAPI } from '../../storage/index.js';
import { readChapterMeta, writeChapterMeta, chapterMetaPath } from '../chapter-metadata.js';

describe('chapter-metadata sidecar', () => {
  let storage: FileStorageAPI;
  const ws = 'ws1';
  const id = 'chapter1';

  beforeEach(() => {
    storage = new MockFileStorage() as unknown as FileStorageAPI;
  });

  it('sidecar path sits beside the source .txt', () => {
    expect(chapterMetaPath('chapter1')).toBe('SOURCE/text/chapter1.json');
  });

  it('reads {} when the sidecar is absent', async () => {
    expect(await readChapterMeta(storage, ws, id)).toEqual({});
  });

  it('round-trips a title', async () => {
    await writeChapterMeta(storage, ws, id, { title: 'The Lighthouse' });
    expect(await readChapterMeta(storage, ws, id)).toEqual({ title: 'The Lighthouse' });
  });

  it('trims the title on write', async () => {
    await writeChapterMeta(storage, ws, id, { title: '  Spaced  ' });
    expect(await readChapterMeta(storage, ws, id)).toEqual({ title: 'Spaced' });
  });

  it('removes the sidecar when the title is cleared (no empty {} left behind)', async () => {
    await writeChapterMeta(storage, ws, id, { title: 'Temp' });
    expect(await storage.fileExists(ws, chapterMetaPath(id))).toBe(true);

    await writeChapterMeta(storage, ws, id, { title: '   ' });
    expect(await storage.fileExists(ws, chapterMetaPath(id))).toBe(false);
    expect(await readChapterMeta(storage, ws, id)).toEqual({});
  });

  it('clearing a never-written sidecar is a no-op', async () => {
    await writeChapterMeta(storage, ws, id, { title: '' });
    expect(await storage.fileExists(ws, chapterMetaPath(id))).toBe(false);
  });

  it('reads {} on malformed JSON', async () => {
    await storage.writeTextFile(ws, chapterMetaPath(id), '{ not json');
    expect(await readChapterMeta(storage, ws, id)).toEqual({});
  });

  it('ignores a non-string title field', async () => {
    await storage.writeTextFile(ws, chapterMetaPath(id), JSON.stringify({ title: 42 }));
    expect(await readChapterMeta(storage, ws, id)).toEqual({});
  });
});
