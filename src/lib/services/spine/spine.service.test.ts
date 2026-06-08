import { describe, it, expect, vi } from 'vitest';
import { SpineService } from './spine.service.js';
import type { WorkspaceService, WorkspaceState } from '../workspace/workspace.service.js';

const enc = new TextEncoder();

function makeWorkspace(): WorkspaceState {
  return {
    id: 'ws',
    pathInfo: { rootfilePath: 'OEBPS/content.opf', basePath: 'OEBPS', opfFileName: 'content.opf' },
    opf: {
      version: '3.0',
      metadata: { title: 'Book', language: ['en'], identifier: 'id' },
      manifest: [
        { id: 'chap01', href: 'Text/chap01.xhtml', mediaType: 'application/xhtml+xml' },
        { id: 'chap02', href: 'Text/chap02.xhtml', mediaType: 'application/xhtml+xml' },
      ],
      spine: [{ idref: 'chap01' }, { idref: 'chap02' }],
      guide: [],
    },
  } as unknown as WorkspaceState;
}

describe('SpineService.loadSpineItems titles (read-only EPUB)', () => {
  it('labels a source-less chapter from its stored XHTML <title>', async () => {
    const xhtml =
      '<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><head>' +
      '<title>Chapter One</title></head><body><h1>Ignored</h1></body></html>';

    const readFile = vi.fn(async () => enc.encode(xhtml).buffer);
    const ws = {
      // No source files exist — every chapter is source-less (a regular EPUB).
      fileExists: vi.fn(async () => false),
      readFile,
    } as unknown as WorkspaceService;

    const items = await new SpineService(ws).loadSpineItems(makeWorkspace());

    expect(items[0].hasSourceFile).toBe(false);
    expect(items[0].title).toBe('Chapter One');
    // Reads the stored XHTML at the OEBPS-resolved path.
    expect(readFile).toHaveBeenCalledWith('ws', 'OEBPS/Text/chap01.xhtml');
  });

  it('falls back to a heading when there is no <title>', async () => {
    const xhtml =
      '<html xmlns="http://www.w3.org/1999/xhtml"><head></head>' +
      '<body><h1>Heading Title</h1></body></html>';
    const ws = {
      fileExists: vi.fn(async () => false),
      readFile: vi.fn(async () => enc.encode(xhtml).buffer),
    } as unknown as WorkspaceService;

    const items = await new SpineService(ws).loadSpineItems(makeWorkspace());
    expect(items[0].title).toBe('Heading Title');
  });

  it('does not read XHTML or set a title when a source file exists (editable chapter)', async () => {
    const readFile = vi.fn(async () => new ArrayBuffer(0));
    const ws = {
      fileExists: vi.fn(async () => true), // every chapter has a SOURCE/text/*.txt
      readFile,
    } as unknown as WorkspaceService;

    const items = await new SpineService(ws).loadSpineItems(makeWorkspace());

    expect(items[0].hasSourceFile).toBe(true);
    expect(items[0].title).toBeUndefined();
    expect(readFile).not.toHaveBeenCalled();
  });
});
