import { describe, it, expect, vi } from 'vitest';
import type { FileStorageAPI } from '../../storage/index.js';
import { WorkspaceService, type WorkspaceState } from './workspace.service.js';
import type { ManifestItem } from '../../epub/opf-utils.js';

/**
 * The blanket 'scripted' property must be applied consistently: whenever a
 * reading-system JavaScript file is present in the manifest, every non-nav XHTML
 * chapter carries 'scripted' — including chapters ADDED AFTER the JS file, which
 * previously slipped through because the reconcile only fired on JS-file adds.
 */

/** Minimal FileStorage — addManifestItem only needs writeTextFile (via saveWorkspace). */
function makeFileStorage() {
  const api = {
    writeTextFile: vi.fn(async () => {}),
    writeFile: vi.fn(async () => {}),
  } as unknown as FileStorageAPI;
  return api;
}

function stateWith(manifest: ManifestItem[]): WorkspaceState {
  return {
    id: 'ws',
    opf: {
      version: '3.0',
      metadata: {
        title: 'Book',
        identifier: 'urn:uuid:x',
        language: ['en'],
        epubVersion: '3.0',
      },
      manifest,
      spine: [],
      guide: [],
    },
    pathInfo: { rootfilePath: 'OEBPS/content.opf', basePath: 'OEBPS', opfFileName: 'content.opf' },
  };
}

const props = (ws: WorkspaceState, id: string) =>
  ws.opf.manifest.find(m => m.id === id)?.properties ?? [];

describe('WorkspaceService — scripted reconciliation on add', () => {
  it('flags a chapter added AFTER the reading-system JS already exists', async () => {
    const service = new WorkspaceService(makeFileStorage());
    const start = stateWith([
      { id: 'reader-js', href: 'Scripts/reader.js', mediaType: 'application/javascript' },
      {
        id: 'ch1',
        href: 'Text/ch1.xhtml',
        mediaType: 'application/xhtml+xml',
        properties: ['scripted'],
      },
      { id: 'nav', href: 'nav.xhtml', mediaType: 'application/xhtml+xml', properties: ['nav'] },
    ]);

    const updated = await service.addManifestItem(start, {
      id: 'ch2',
      href: 'Text/ch2.xhtml',
      mediaType: 'application/xhtml+xml',
    });

    expect(props(updated, 'ch2')).toContain('scripted'); // the fix
    expect(props(updated, 'ch1')).toContain('scripted'); // unchanged
    expect(props(updated, 'nav')).not.toContain('scripted'); // nav excluded
  });

  it('does NOT flag a new chapter when no JS file is present', async () => {
    const service = new WorkspaceService(makeFileStorage());
    const start = stateWith([
      { id: 'ch1', href: 'Text/ch1.xhtml', mediaType: 'application/xhtml+xml' },
    ]);

    const updated = await service.addManifestItem(start, {
      id: 'ch2',
      href: 'Text/ch2.xhtml',
      mediaType: 'application/xhtml+xml',
    });

    expect(props(updated, 'ch2')).not.toContain('scripted');
  });

  it('still flags existing chapters when the JS file itself is added', async () => {
    const service = new WorkspaceService(makeFileStorage());
    const start = stateWith([
      { id: 'ch1', href: 'Text/ch1.xhtml', mediaType: 'application/xhtml+xml' },
    ]);

    const updated = await service.addManifestItem(start, {
      id: 'reader-js',
      href: 'Scripts/reader.js',
      mediaType: 'application/javascript',
    });

    expect(props(updated, 'ch1')).toContain('scripted');
  });

  it('leaves a non-owned property (svg) intact while adding scripted', async () => {
    const service = new WorkspaceService(makeFileStorage());
    const start = stateWith([
      { id: 'reader-js', href: 'Scripts/reader.js', mediaType: 'application/javascript' },
    ]);

    const updated = await service.addManifestItem(start, {
      id: 'ch2',
      href: 'Text/ch2.xhtml',
      mediaType: 'application/xhtml+xml',
      properties: ['svg'],
    });

    expect(props(updated, 'ch2')).toEqual(expect.arrayContaining(['svg', 'scripted']));
  });
});
