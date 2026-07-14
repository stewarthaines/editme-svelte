/**
 * Backend contract runs against FAKES in happy-dom — part of `npm run test`
 * and therefore `validate`. The identical assertions run unmocked in real
 * Chromium via `npm run test:storage` (backends.browser.test.ts), which is
 * what certifies these fakes against reality.
 *
 * - IndexedDBBackend ← fake-indexeddb (per-file auto install; reset with a
 *   fresh IDBFactory per test — the pattern proven in legacy-migration.test.ts;
 *   deliberately NOT a global setupFile, see handle-store.test.ts for why).
 * - OPFSAsyncBackend ← opfs-mock (installs navigator.storage.getDirectory;
 *   resetMockOPFS() gives a pristine tree per test).
 */

import 'fake-indexeddb/auto';
import 'opfs-mock';
import { describe, it, expect, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { resetMockOPFS } from 'opfs-mock';
import { IndexedDBBackend, OPFSAsyncBackend, OPFSSyncBackend } from './index.js';
import { describeBackendContract } from './backend-contract.js';
import { FakeOPFSWorker } from './opfs-worker-harness.js';

// The sync backend spins its worker from a Blob URL; happy-dom has no real
// Worker, so the harness evaluates the actual worker script in-process.
vi.stubGlobal('Worker', FakeOPFSWorker);
if (typeof URL.createObjectURL !== 'function') {
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: () => 'blob:fake',
    revokeObjectURL: () => {},
  });
}

describeBackendContract({
  name: 'IndexedDBBackend on fake-indexeddb',
  expectedType: 'indexeddb',
  makeBackend: async () => {
    const backend = new IndexedDBBackend();
    await backend.init();
    return backend;
  },
  cleanup: async () => {
    // A fresh factory drops every database (including 'seedhtml-storage').
    globalThis.indexedDB = new IDBFactory();
  },
  quirks: { deleteMissingFileRejects: false },
});

describeBackendContract({
  name: 'OPFSAsyncBackend on opfs-mock',
  expectedType: 'opfs-async',
  makeBackend: async () => {
    const backend = new OPFSAsyncBackend();
    await backend.init();
    return backend;
  },
  cleanup: async () => {
    resetMockOPFS();
  },
  quirks: { deleteMissingFileRejects: true },
});

// The REAL chain: OPFSSyncBackend → OPFSWorkerManager → opfs-worker.js
// (evaluated by the harness) → opfs-mock. Buffer-transfer semantics are only
// proven by the browser suite — everything else runs for real here.
describeBackendContract({
  name: 'OPFSSyncBackend via worker harness on opfs-mock',
  expectedType: 'opfs-sync',
  makeBackend: async () => new OPFSSyncBackend(),
  cleanup: async () => {
    resetMockOPFS();
  },
  quirks: { deleteMissingFileRejects: true },
});

// ── Targeted edge paths ──────────────────────────────────────────────────────

describe('OPFSAsyncBackend.writeFileWithFallback (Safari path)', () => {
  const content = new TextEncoder().encode('fallback bytes').buffer as ArrayBuffer;

  function makeSyncHandle(calls: string[], opts: { writeThrows?: boolean } = {}) {
    return {
      truncate: vi.fn((size: number) => calls.push(`truncate:${size}`)),
      write: vi.fn(() => {
        calls.push('write');
        if (opts.writeThrows) throw new Error('sync write failed');
      }),
      flush: vi.fn(() => calls.push('flush')),
      close: vi.fn(() => calls.push('close')),
    };
  }

  it('falls back to the sync handle when createWritable rejects: truncate → write → flush → close', async () => {
    const calls: string[] = [];
    const handle = {
      createWritable: vi.fn().mockRejectedValue(new Error('NotAllowedError')),
      createSyncAccessHandle: vi.fn().mockResolvedValue(makeSyncHandle(calls)),
    };

    const backend = new OPFSAsyncBackend();
    await (backend as any).writeFileWithFallback(handle, content);

    expect(calls).toEqual([`truncate:${content.byteLength}`, 'write', 'flush', 'close']);
  });

  it('closes the sync handle even when its write throws', async () => {
    const calls: string[] = [];
    const handle = {
      createWritable: vi.fn().mockRejectedValue(new Error('nope')),
      createSyncAccessHandle: vi
        .fn()
        .mockResolvedValue(makeSyncHandle(calls, { writeThrows: true })),
    };

    const backend = new OPFSAsyncBackend();

    await expect((backend as any).writeFileWithFallback(handle, content)).rejects.toThrow(
      'sync write failed'
    );
    expect(calls[calls.length - 1]).toBe('close');
  });

  it('re-throws the original error when no sync handle exists', async () => {
    const handle = {
      createWritable: vi.fn().mockRejectedValue(new Error('original failure')),
      // no createSyncAccessHandle at all
    };

    const backend = new OPFSAsyncBackend();

    await expect((backend as any).writeFileWithFallback(handle, content)).rejects.toThrow(
      'original failure'
    );
  });
});

describe('OPFSSyncBackend.readFile bad-buffer downgrade', () => {
  it.each([
    ['null content', null],
    ['non-ArrayBuffer content', 'not-a-buffer'],
  ])('downgrades %s to an empty ArrayBuffer with a warning', async (_label, content) => {
    const backend = new OPFSSyncBackend();
    vi.spyOn((backend as any).workerManager, 'readFile').mockResolvedValue({
      success: true,
      content,
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await backend.readFile('ws', 'file.bin');

    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(result.byteLength).toBe(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('OPFSSyncBackend.getQuota wire-shape', () => {
  it('reads the top-level quota field (regression: reading data.quota returned zeros)', async () => {
    const backend = new OPFSSyncBackend();
    vi.spyOn((backend as any).workerManager, 'getQuota').mockResolvedValue({
      success: true,
      quota: { used: 1234, available: 5678 },
    });

    await expect(backend.getQuota()).resolves.toEqual({ used: 1234, available: 5678 });
  });

  it('surfaces the worker error string on failure', async () => {
    const backend = new OPFSSyncBackend();
    vi.spyOn((backend as any).workerManager, 'getQuota').mockResolvedValue({
      success: false,
      error: 'estimate unavailable',
    });

    await expect(backend.getQuota()).rejects.toThrow('estimate unavailable');
  });
});
