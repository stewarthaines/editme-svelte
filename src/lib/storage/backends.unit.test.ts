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
import { IDBFactory } from 'fake-indexeddb';
import { resetMockOPFS } from 'opfs-mock';
import { IndexedDBBackend, OPFSAsyncBackend } from './index.js';
import { describeBackendContract } from './backend-contract.js';

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
