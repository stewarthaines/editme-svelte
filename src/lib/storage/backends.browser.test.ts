/**
 * Backend contract against the REAL browser APIs — the certification run.
 *
 * Runs the exact assertions of backends.unit.test.ts, unmocked, in headless
 * Chromium (`npm run test:storage`): real OPFS (async handles AND the sync
 * worker with structured clone / buffer transfer) and real IndexedDB. If the
 * fakes (opfs-mock / fake-indexeddb) drift from reality, this suite and the
 * unit suite disagree — that diff is the point.
 */

import { describeBackendContract } from './backend-contract.js';
import { IndexedDBBackend, OPFSAsyncBackend, OPFSSyncBackend } from './index.js';

/** Remove every entry under the OPFS root so each test starts pristine. */
async function wipeOPFS(): Promise<void> {
  const root = await navigator.storage.getDirectory();
  const names: string[] = [];
  for await (const [name] of (root as any).entries()) {
    names.push(name);
  }
  for (const name of names) {
    await root.removeEntry(name, { recursive: true });
  }
}

/** Drop the backing database; close the given connection first or the delete hangs. */
async function wipeIndexedDB(db?: IDBDatabase | null): Promise<void> {
  db?.close();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('seedhtml-storage');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('deleteDatabase failed'));
    request.onblocked = () => resolve(); // a lingering connection; the fresh open still upgrades
  });
}

let lastIdb: IndexedDBBackend | null = null;

describeBackendContract({
  name: 'IndexedDBBackend on real IndexedDB',
  expectedType: 'indexeddb',
  makeBackend: async () => {
    const backend = new IndexedDBBackend();
    await backend.init();
    lastIdb = backend;
    return backend;
  },
  cleanup: async () => {
    await wipeIndexedDB((lastIdb as any)?.db ?? null);
    lastIdb = null;
  },
  quirks: { deleteMissingFileRejects: false },
});

describeBackendContract({
  name: 'OPFSAsyncBackend on real OPFS',
  expectedType: 'opfs-async',
  makeBackend: async () => {
    const backend = new OPFSAsyncBackend();
    await backend.init();
    return backend;
  },
  cleanup: wipeOPFS,
  quirks: { deleteMissingFileRejects: true },
});

let lastSync: OPFSSyncBackend | null = null;

describeBackendContract({
  name: 'OPFSSyncBackend on a real Worker + real OPFS',
  expectedType: 'opfs-sync',
  makeBackend: async () => {
    lastSync = new OPFSSyncBackend();
    return lastSync;
  },
  cleanup: async () => {
    // Terminate the previous test's worker so its OPFS handles release.
    lastSync?.destroy();
    lastSync = null;
    await wipeOPFS();
  },
  quirks: { deleteMissingFileRejects: true },
});
