/**
 * StorageManager + FileStorageAPI facade tests, backed by a REAL
 * IndexedDBBackend on fake-indexeddb injected through the factory cache
 * (no detector mocking). Folds in the only assertions worth keeping from the
 * old interface-shape files (file-storage.test.ts / integration.test.ts):
 * uninitialized-state errors and destroy semantics.
 */

import 'fake-indexeddb/auto';
import 'opfs-mock';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { resetMockOPFS } from 'opfs-mock';
import {
  FileStorageAPI,
  StorageManager,
  StorageBackendFactory,
  IndexedDBBackend,
  OPFSAsyncBackend,
} from './index.js';
import type { StorageBackend } from './types.js';

const textBuffer = (s: string): ArrayBuffer => new TextEncoder().encode(s).buffer as ArrayBuffer;

/** Pre-seed the factory cache so init() resolves to the given backend. */
function installBackend(backend: StorageBackend): void {
  (StorageBackendFactory as any).cachedBackend = backend;
}

async function freshIdbBackend(): Promise<IndexedDBBackend> {
  globalThis.indexedDB = new IDBFactory();
  const backend = new IndexedDBBackend();
  await backend.init();
  return backend;
}

afterEach(() => {
  FileStorageAPI.resetInstance();
  StorageBackendFactory.clearCache();
  vi.restoreAllMocks();
});

describe('StorageManager', () => {
  it('throws on every operation before init', async () => {
    const manager = new StorageManager();

    expect(manager.isInitialized()).toBe(false);
    expect(() => manager.getBackendType()).toThrow('not initialized');
    await expect(manager.createWorkspace()).rejects.toThrow('not initialized');
    await expect(manager.readFile('w', 'p')).rejects.toThrow('not initialized');
    await expect(manager.listWorkspaces()).rejects.toThrow('not initialized');
  });

  it('destroy() is safe when uninitialized and de-initializes after init', async () => {
    const manager = new StorageManager();
    expect(() => manager.destroy()).not.toThrow();

    installBackend(await freshIdbBackend());
    await manager.init();
    expect(manager.isInitialized()).toBe(true);

    manager.destroy();
    expect(manager.isInitialized()).toBe(false);
  });

  it('createWorkspace without an id generates a workspace-UUID', async () => {
    installBackend(await freshIdbBackend());
    const manager = new StorageManager();
    await manager.init();

    const id = await manager.createWorkspace();

    expect(id).toMatch(
      /^workspace-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
    expect(await manager.listWorkspaces()).toContain(id);
  });
});

describe('FileStorageAPI', () => {
  let api: FileStorageAPI;

  beforeEach(async () => {
    installBackend(await freshIdbBackend());
    FileStorageAPI.resetInstance();
    api = FileStorageAPI.getInstance();
    await api.init();
    await api.createWorkspace('ws');
  });

  it('is a singleton; getInitializedInstance initializes lazily', async () => {
    expect(FileStorageAPI.getInstance()).toBe(api);

    FileStorageAPI.resetInstance();
    installBackend(await freshIdbBackend());
    const fresh = await FileStorageAPI.getInitializedInstance();

    expect(fresh).not.toBe(api);
    expect(fresh.isInitialized()).toBe(true);
  });

  it('concurrent init() calls share one initialization', async () => {
    FileStorageAPI.resetInstance();
    StorageBackendFactory.clearCache();
    const backend = await freshIdbBackend();
    const createSpy = vi
      .spyOn(StorageBackendFactory, 'create')
      .mockImplementation(async () => backend);

    const fresh = FileStorageAPI.getInstance();
    await Promise.all([fresh.init(), fresh.init(), fresh.init()]);

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(fresh.isInitialized()).toBe(true);
  });

  it('round-trips unicode text through writeTextFile/readTextFile', async () => {
    await api.writeTextFile('ws', 'SOURCE/text/ch1.txt', 'ქართული 📚');

    expect(await api.readTextFile('ws', 'SOURCE/text/ch1.txt')).toBe('ქართული 📚');
    expect(await api.fileExists('ws', 'SOURCE/text/ch1.txt')).toBe(true);
    expect(await api.fileExists('ws', 'SOURCE/text/nope.txt')).toBe(false);
  });

  it('renameFile moves content and removes the old path', async () => {
    await api.writeFile('ws', 'old/name.bin', textBuffer('payload'));

    await api.renameFile('ws', 'old/name.bin', 'new/name.bin');

    expect(new TextDecoder().decode(await api.readFile('ws', 'new/name.bin'))).toBe('payload');
    expect(await api.fileExists('ws', 'old/name.bin')).toBe(false);
  });

  it('renameFile onto the same path keeps the file intact', async () => {
    await api.writeFile('ws', 'same.bin', textBuffer('stay'));

    await api.renameFile('ws', 'same.bin', 'same.bin');

    // Without the same-path guard, read→write→delete deleted the file.
    expect(new TextDecoder().decode(await api.readFile('ws', 'same.bin'))).toBe('stay');
  });

  it('renameFile of a missing source rejects without creating the target', async () => {
    await expect(api.renameFile('ws', 'ghost.bin', 'target.bin')).rejects.toThrow();
    expect(await api.fileExists('ws', 'target.bin')).toBe(false);
  });

  it('estimateWorkspaceSize sums file sizes', async () => {
    await api.writeFile('ws', 'a.bin', new ArrayBuffer(100));
    await api.writeFile('ws', 'dir/b.bin', new ArrayBuffer(23));

    expect(await api.estimateWorkspaceSize('ws')).toBe(123);
  });

  it('getWorkspaceDirectoryHandle returns null on the IndexedDB backend', async () => {
    expect(await api.getWorkspaceDirectoryHandle('ws')).toBeNull();
    expect(api.supportsDirectBlobURLs()).toBe(false);
  });

  it('getFile throws on the IndexedDB backend (no direct file access)', async () => {
    await api.writeFile('ws', 'x.bin', textBuffer('x'));

    await expect(api.getFile('ws', 'x.bin')).rejects.toThrow('not supported');
  });
});

describe('FileStorageAPI on the OPFS async backend', () => {
  beforeEach(async () => {
    resetMockOPFS();
    StorageBackendFactory.clearCache();
    FileStorageAPI.resetInstance();
    const backend = new OPFSAsyncBackend();
    await backend.init();
    installBackend(backend);
  });

  it('hands out a live workspace directory handle and supports direct blob URLs', async () => {
    const api = await FileStorageAPI.getInitializedInstance();
    await api.createWorkspace('ws');
    await api.writeTextFile('ws', 'OEBPS/ch1.xhtml', '<html />');

    const handle = await api.getWorkspaceDirectoryHandle('ws');

    expect(handle).not.toBeNull();
    expect(handle!.kind).toBe('directory');
    expect(api.supportsDirectBlobURLs()).toBe(true);

    const oebps = await handle!.getDirectoryHandle('OEBPS');
    const file = await (await oebps.getFileHandle('ch1.xhtml')).getFile();
    expect(await file.text()).toBe('<html />');
  });

  it('getFile returns a real File for direct blob-URL creation', async () => {
    const api = await FileStorageAPI.getInitializedInstance();
    await api.createWorkspace('ws');
    await api.writeTextFile('ws', 'Images/cover.svg', '<svg />');

    const file = await api.getFile('ws', 'Images/cover.svg');

    expect(await file.text()).toBe('<svg />');
  });
});
