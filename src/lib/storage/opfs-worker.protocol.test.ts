/**
 * Wire-protocol tests for opfs-worker.js, driven through the in-process
 * harness (FakeOPFSWorker) against opfs-mock.
 *
 * These pin the protocol's QUIRKS precisely, because the reader in
 * OPFSSyncBackend depends on them:
 *  - most ops return TOP-LEVEL fields (content/files/workspaces/quota)…
 *  - …but getFileInfo nests under data.fileInfo (the one shape the backend's
 *    result.data read actually matches);
 *  - error is a plain STRING (error.message), not a StorageError object;
 *  - the response envelope is { type, result, id }.
 *
 * NOTE on coverage: the worker script executes via new Function, so v8
 * coverage does not attribute its lines even though this suite genuinely
 * runs them.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import 'opfs-mock';
import { resetMockOPFS } from 'opfs-mock';
import { FakeOPFSWorker } from './opfs-worker-harness.js';

/** Send one message to a fresh worker and await its response envelope. */
function roundTrip(
  worker: FakeOPFSWorker,
  type: string,
  data?: unknown
): Promise<{ type: string; result: any; id: number }> {
  return new Promise(resolve => {
    const id = Math.floor(Math.random() * 1e9);
    worker.onmessage = event => {
      const response = event.data as { type: string; result: any; id: number };
      if (response.id === id) resolve(response);
    };
    worker.postMessage({ type, data, id });
  });
}

describe('opfs-worker wire protocol', () => {
  let worker: FakeOPFSWorker;
  const WS = 'proto-ws';
  const bytes = new TextEncoder().encode('hello').buffer as ArrayBuffer;

  beforeEach(() => {
    resetMockOPFS();
    worker = new FakeOPFSWorker('blob:ignored');
  });

  it('echoes type and id in the response envelope', async () => {
    const response = await roundTrip(worker, 'createWorkspace', { workspaceId: WS });

    expect(response.type).toBe('createWorkspace');
    expect(typeof response.id).toBe('number');
    expect(response.result).toEqual({ success: true });
  });

  it('readFile returns the content TOP-LEVEL (not under data)', async () => {
    await roundTrip(worker, 'writeFile', { workspaceId: WS, path: 'a.txt', content: bytes });

    const { result } = await roundTrip(worker, 'readFile', { workspaceId: WS, path: 'a.txt' });

    expect(result.success).toBe(true);
    expect(result.content).toBeInstanceOf(ArrayBuffer);
    expect(result.data).toBeUndefined();
    expect(new TextDecoder().decode(result.content)).toBe('hello');
  });

  it('listFiles and listWorkspaces return top-level sorted arrays', async () => {
    await roundTrip(worker, 'writeFile', { workspaceId: WS, path: 'b/z.txt', content: bytes });
    await roundTrip(worker, 'writeFile', { workspaceId: WS, path: 'b/a.txt', content: bytes });

    const files = await roundTrip(worker, 'listFiles', { workspaceId: WS });
    const workspaces = await roundTrip(worker, 'listWorkspaces');

    expect(files.result).toEqual({ success: true, files: ['b/a.txt', 'b/z.txt'] });
    expect(workspaces.result).toEqual({ success: true, workspaces: [WS] });
  });

  it('getFileInfo — uniquely — nests under data.fileInfo', async () => {
    await roundTrip(worker, 'writeFile', { workspaceId: WS, path: 'a.txt', content: bytes });

    const { result } = await roundTrip(worker, 'getFileInfo', { workspaceId: WS, path: 'a.txt' });

    expect(result.success).toBe(true);
    expect(result.fileInfo).toBeUndefined();
    expect(result.data.fileInfo.size).toBe(5);
    expect(result.data.fileInfo.lastModified).toBeInstanceOf(Date);
  });

  it('getQuota returns quota TOP-LEVEL — which the backend reads from result.data, always falling back to zeros', async () => {
    const { result } = await roundTrip(worker, 'getQuota');

    expect(result.success).toBe(true);
    expect(typeof result.quota.used).toBe('number');
    // The mismatch OPFSSyncBackend.getQuota currently papers over:
    expect(result.data).toBeUndefined();
  });

  it('errors are plain strings, not error objects', async () => {
    const { result } = await roundTrip(worker, 'readFile', { workspaceId: WS, path: 'nope.txt' });

    expect(result.success).toBe(false);
    expect(typeof result.error).toBe('string');
    expect(result.error.length).toBeGreaterThan(0);
  });

  it('an unknown operation reports success:false with a string error', async () => {
    const { result } = await roundTrip(worker, 'defragmentFloppy', {});

    expect(result).toEqual({ success: false, error: 'Unknown operation: defragmentFloppy' });
  });

  it('deleting a missing workspace reports success (already deleted)', async () => {
    const { result } = await roundTrip(worker, 'deleteWorkspace', { workspaceId: 'ghost' });

    expect(result).toEqual({ success: true });
  });
});
