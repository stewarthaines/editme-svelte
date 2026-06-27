/**
 * Unit tests for track-changes pure logic: the trackable-path predicate, the
 * change-key identity, and patchset generation against an in-memory storage +
 * workspace fixture (no real OPF parsing — the unit env can't handle namespaced
 * XML, and generation only needs the manifest array + path info).
 */

import { describe, it, expect } from 'vitest';
import { isTrackable, BASE_PREFIX } from './base-snapshot.js';
import { changeKey } from './patchset-apply.js';
import { generatePatchset } from './patchset-generate.js';
import type { FileStorageAPI } from '../storage/index.js';
import type { WorkspaceState } from '../services/workspace/workspace.service.js';

describe('isTrackable', () => {
  it('tracks chapter source text', () => {
    expect(isTrackable('SOURCE/text/chapter01.txt')).toBe(true);
  });

  it('tracks EPUB stylesheets and scripts outside SOURCE/', () => {
    expect(isTrackable('OEBPS/Styles/style.css')).toBe(true);
    expect(isTrackable('OEBPS/Scripts/main.js')).toBe(true);
  });

  it('does not track the base snapshot itself (no recursion)', () => {
    expect(isTrackable(`${BASE_PREFIX}SOURCE/text/chapter01.txt`)).toBe(false);
    expect(isTrackable(`${BASE_PREFIX}OEBPS/Styles/style.css`)).toBe(false);
  });

  it('does not track derived data, transform scripts, the OPF, or images', () => {
    expect(isTrackable('SOURCE/data/output.json')).toBe(false);
    expect(isTrackable('SOURCE/scripts/transformText.js')).toBe(false); // under SOURCE/
    expect(isTrackable('OEBPS/content.opf')).toBe(false);
    expect(isTrackable('OEBPS/Images/cover.png')).toBe(false);
  });
});

describe('changeKey', () => {
  it('keys chapters by id and files by path', () => {
    expect(changeKey({ kind: 'chapter-modify', id: 'ch1', title: 'ch1', newText: 'x' })).toBe(
      'chapter:ch1'
    );
    expect(
      changeKey({ kind: 'file-modify', path: 'OEBPS/Styles/s.css', mediaType: 'text/css', newContent: 'x' })
    ).toBe('file:OEBPS/Styles/s.css');
  });
});

describe('generatePatchset', () => {
  // Minimal in-memory storage covering listFiles + readTextFile.
  function fakeStorage(files: Record<string, string>): FileStorageAPI {
    return {
      listFiles: async (_id: string, prefix?: string) =>
        Object.keys(files).filter(p => (prefix ? p.startsWith(prefix) : true)),
      readTextFile: async (_id: string, path: string) => {
        if (!(path in files)) throw new Error('not found');
        return files[path];
      },
    } as unknown as FileStorageAPI;
  }

  const workspace = {
    id: 'ws1',
    pathInfo: { rootfilePath: 'OEBPS/content.opf', basePath: 'OEBPS', opfFileName: 'content.opf' },
    opf: {
      metadata: { identifier: 'urn:uuid:abc', title: 'My Book' },
      manifest: [{ id: 'style', href: 'Styles/style.css', mediaType: 'text/css' }],
      spine: [],
    },
  } as unknown as WorkspaceState;

  it('emits chapter-modify and file-modify only for changed files', async () => {
    const storage = fakeStorage({
      // base snapshots
      [`${BASE_PREFIX}SOURCE/text/chapter01.txt`]: 'old chapter',
      [`${BASE_PREFIX}SOURCE/text/chapter02.txt`]: 'unchanged',
      [`${BASE_PREFIX}OEBPS/Styles/style.css`]: 'body{}',
      // current content
      'SOURCE/text/chapter01.txt': 'new chapter',
      'SOURCE/text/chapter02.txt': 'unchanged',
      'OEBPS/Styles/style.css': 'body{color:red}',
    });

    const patchset = await generatePatchset(workspace, storage);

    expect(patchset.projectIdentifier).toBe('urn:uuid:abc');
    expect(patchset.projectTitle).toBe('My Book');
    expect(patchset.changes).toHaveLength(2); // chapter02 unchanged → skipped

    const chapter = patchset.changes.find(c => c.kind === 'chapter-modify');
    expect(chapter).toMatchObject({ kind: 'chapter-modify', id: 'chapter01', newText: 'new chapter' });

    const file = patchset.changes.find(c => c.kind === 'file-modify');
    expect(file).toMatchObject({
      kind: 'file-modify',
      path: 'OEBPS/Styles/style.css',
      mediaType: 'text/css',
      newContent: 'body{color:red}',
    });
  });

  it('returns no changes when nothing differs', async () => {
    const storage = fakeStorage({
      [`${BASE_PREFIX}SOURCE/text/chapter01.txt`]: 'same',
      'SOURCE/text/chapter01.txt': 'same',
    });
    const patchset = await generatePatchset(workspace, storage);
    expect(patchset.changes).toHaveLength(0);
  });
});
