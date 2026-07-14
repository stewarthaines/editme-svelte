/**
 * Shared behavioral contract for StorageBackend implementations.
 *
 * The same assertions run in two environments:
 *  - backends.unit.test.ts (happy-dom): backends on fakes — fake-indexeddb for
 *    IndexedDBBackend, opfs-mock for the OPFS backends — inside `npm run test`
 *    and therefore `validate`.
 *  - backends.browser.test.ts (real Chromium via `npm run test:storage`): the
 *    unmodified backends against real OPFS/IndexedDB/Worker. This run
 *    certifies the fakes: any fidelity gap shows up as a unit-vs-browser diff.
 *
 * Known, deliberate divergence is encoded in `quirks` rather than papered
 * over: deleting a missing file rejects on both OPFS backends (NotFoundError)
 * but resolves on IndexedDB (IDB delete of an absent key succeeds).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { StorageBackend, BackendType } from './types.js';

export interface BackendContractDef {
  name: string;
  expectedType: BackendType;
  makeBackend(): Promise<StorageBackend>;
  /** Wipe all persisted state; runs before each test. */
  cleanup(): Promise<void>;
  quirks: {
    /** true: opfs-async, opfs-sync; false: indexeddb */
    deleteMissingFileRejects: boolean;
  };
}

const toBuffer = (bytes: Uint8Array): ArrayBuffer => bytes.buffer as ArrayBuffer;
const textBuffer = (s: string): ArrayBuffer => toBuffer(new TextEncoder().encode(s));

export function describeBackendContract(def: BackendContractDef): void {
  describe(`StorageBackend contract: ${def.name}`, () => {
    const WS = 'contract-ws';
    let backend: StorageBackend;

    beforeEach(async () => {
      await def.cleanup();
      backend = await def.makeBackend();
      await backend.createWorkspace(WS);
    });

    it('reports its backend type', () => {
      expect(backend.getBackendType()).toBe(def.expectedType);
    });

    // ── Workspaces ─────────────────────────────────────────────────────────

    it('lists created workspaces sorted', async () => {
      await backend.createWorkspace('b-ws');
      await backend.createWorkspace('a-ws');

      const list = await backend.listWorkspaces();

      expect(list).toEqual(['a-ws', 'b-ws', WS]);
    });

    it('deleteWorkspace removes the workspace and its files', async () => {
      await backend.writeFile(WS, 'OEBPS/ch1.xhtml', textBuffer('x'));

      await backend.deleteWorkspace(WS);

      expect(await backend.listWorkspaces()).toEqual([]);
      await expect(backend.readFile(WS, 'OEBPS/ch1.xhtml')).rejects.toThrow();
    });

    it('deleting a nonexistent workspace resolves', async () => {
      await expect(backend.deleteWorkspace('never-existed')).resolves.toBeUndefined();
    });

    // ── Write / read round-trips ───────────────────────────────────────────

    it('round-trips binary content including 0x00 and 0xff bytes', async () => {
      const payload = new Uint8Array(256).map((_, i) => i);
      await backend.writeFile(WS, 'bin.dat', toBuffer(payload));

      const read = new Uint8Array(await backend.readFile(WS, 'bin.dat'));

      expect(read).toEqual(payload);
    });

    it('round-trips multi-byte unicode text', async () => {
      const text = 'ქართული — ½ Æ 📚 «SEED»';
      await backend.writeFile(WS, 'SOURCE/text/ch1.txt', textBuffer(text));

      const read = await backend.readFile(WS, 'SOURCE/text/ch1.txt');

      expect(new TextDecoder().decode(read)).toBe(text);
    });

    it('round-trips the empty file', async () => {
      await backend.writeFile(WS, 'empty.txt', new ArrayBuffer(0));

      const read = await backend.readFile(WS, 'empty.txt');

      expect(read.byteLength).toBe(0);
      expect((await backend.getFileInfo(WS, 'empty.txt')).size).toBe(0);
    });

    it('overwriting with shorter content truncates the file', async () => {
      await backend.writeFile(WS, 'shrink.txt', toBuffer(new Uint8Array(64).fill(0xaa)));
      await backend.writeFile(WS, 'shrink.txt', textBuffer('abc'));

      const read = await backend.readFile(WS, 'shrink.txt');

      expect(new TextDecoder().decode(read)).toBe('abc');
      expect((await backend.getFileInfo(WS, 'shrink.txt')).size).toBe(3);
    });

    // ── Listing ────────────────────────────────────────────────────────────

    it('lists nested paths fully qualified and sorted', async () => {
      await backend.writeFile(WS, 'OEBPS/text/ch2.xhtml', textBuffer('2'));
      await backend.writeFile(WS, 'OEBPS/text/ch1.xhtml', textBuffer('1'));
      await backend.writeFile(WS, 'mimetype', textBuffer('application/epub+zip'));

      const all = await backend.listFiles(WS);

      expect(all).toEqual(['OEBPS/text/ch1.xhtml', 'OEBPS/text/ch2.xhtml', 'mimetype']);
    });

    it('filters by basePath and normalizes a trailing slash', async () => {
      await backend.writeFile(WS, 'OEBPS/text/ch1.xhtml', textBuffer('1'));
      await backend.writeFile(WS, 'SOURCE/text/ch1.txt', textBuffer('src'));

      const bare = await backend.listFiles(WS, 'OEBPS');
      const slashed = await backend.listFiles(WS, 'OEBPS/');

      expect(bare).toEqual(['OEBPS/text/ch1.xhtml']);
      expect(slashed).toEqual(bare);
    });

    it('listing a nonexistent basePath returns []', async () => {
      await backend.writeFile(WS, 'OEBPS/ch1.xhtml', textBuffer('1'));

      expect(await backend.listFiles(WS, 'no-such-dir')).toEqual([]);
    });

    // ── Missing files & deletion ───────────────────────────────────────────

    it('readFile of a missing file rejects', async () => {
      await expect(backend.readFile(WS, 'missing.txt')).rejects.toThrow();
    });

    it('getFileInfo of a missing file rejects', async () => {
      await expect(backend.getFileInfo(WS, 'missing.txt')).rejects.toThrow();
    });

    it('getFileInfo reports exact size and a Date', async () => {
      await backend.writeFile(WS, 'sized.bin', toBuffer(new Uint8Array(1234)));

      const info = await backend.getFileInfo(WS, 'sized.bin');

      expect(info.size).toBe(1234);
      expect(info.lastModified).toBeInstanceOf(Date);
    });

    it('deleteFile removes the file', async () => {
      await backend.writeFile(WS, 'OEBPS/goner.txt', textBuffer('x'));

      await backend.deleteFile(WS, 'OEBPS/goner.txt');

      await expect(backend.readFile(WS, 'OEBPS/goner.txt')).rejects.toThrow();
      expect(await backend.listFiles(WS)).toEqual([]);
    });

    it(`deleteFile of a missing file ${def.quirks.deleteMissingFileRejects ? 'rejects' : 'resolves'} (backend quirk)`, async () => {
      if (def.quirks.deleteMissingFileRejects) {
        await expect(backend.deleteFile(WS, 'missing.txt')).rejects.toThrow();
      } else {
        await expect(backend.deleteFile(WS, 'missing.txt')).resolves.toBeUndefined();
      }
    });

    // ── Quota ──────────────────────────────────────────────────────────────

    it('getQuota returns numeric used/available', async () => {
      const quota = await backend.getQuota();

      expect(typeof quota.used).toBe('number');
      expect(typeof quota.available).toBe('number');
      expect(quota.used).toBeGreaterThanOrEqual(0);
    });
  });
}
