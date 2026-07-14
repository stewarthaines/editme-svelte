/**
 * OPFSWorkerManager lifecycle tests: request/response correlation, the 10s
 * per-operation timeout, teardown semantics, and worker-error fan-out. Uses a
 * controllable stub worker (not the harness) so responses can be withheld.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/** A worker stub whose responses the test releases by hand. */
class ManualWorker {
  static current: ManualWorker | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: { message?: string }) => void) | null = null;
  onmessageerror: ((event: unknown) => void) | null = null;
  posted: Array<{ type: string; data: unknown; id: number }> = [];
  terminated = false;

  constructor(_url: string) {
    ManualWorker.current = this;
  }

  postMessage(message: { type: string; data: unknown; id: number }): void {
    this.posted.push(message);
  }

  respond(id: number, result: unknown): void {
    this.onmessage?.({ data: { type: 'any', result, id } });
  }

  terminate(): void {
    this.terminated = true;
  }
}

vi.stubGlobal('Worker', ManualWorker);
if (typeof URL.createObjectURL !== 'function') {
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: () => 'blob:fake',
    revokeObjectURL: () => {},
  });
}

// Import AFTER the Worker stub is installed.
const { OPFSWorkerManager } = await import('./worker-manager.js');

describe('OPFSWorkerManager', () => {
  let manager: InstanceType<typeof OPFSWorkerManager>;
  let worker: ManualWorker;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new OPFSWorkerManager();
    worker = ManualWorker.current!;
  });

  afterEach(() => {
    manager.destroy();
    vi.useRealTimers();
  });

  it('correlates responses to requests by id', async () => {
    const first = manager.sendMessage('listWorkspaces');
    const second = manager.sendMessage('getQuota');
    const [firstId, secondId] = worker.posted.map(m => m.id);

    // Answer out of order.
    worker.respond(secondId, { success: true, which: 'second' });
    worker.respond(firstId, { success: true, which: 'first' });

    expect(await first).toMatchObject({ which: 'first' });
    expect(await second).toMatchObject({ which: 'second' });
  });

  it('times out an unanswered operation after 10s', async () => {
    const pending = manager.sendMessage('readFile', { workspaceId: 'w', path: 'p' });
    const assertion = expect(pending).rejects.toThrow('timed out after 10000ms');

    await vi.advanceTimersByTimeAsync(10_001);

    await assertion;
  });

  it('a response after the timeout is ignored, not resurrected', async () => {
    const pending = manager.sendMessage('readFile', { workspaceId: 'w', path: 'p' });
    const assertion = expect(pending).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(10_001);
    await assertion;

    // Late reply must not throw or corrupt state.
    worker.respond(worker.posted[0].id, { success: true });

    const next = manager.sendMessage('getQuota');
    worker.respond(worker.posted[1].id, { success: true, quota: { used: 0, available: 0 } });
    await expect(next).resolves.toMatchObject({ success: true });
  });

  it('setTimeout shortens the operation deadline', async () => {
    manager.setTimeout(500);
    const pending = manager.sendMessage('getQuota');
    const assertion = expect(pending).rejects.toThrow('timed out after 500ms');

    await vi.advanceTimersByTimeAsync(501);

    await assertion;
  });

  it('destroy() rejects pending operations and blocks new sends', async () => {
    const pending = manager.sendMessage('listWorkspaces');
    const assertion = expect(pending).rejects.toThrow('Worker terminated');

    manager.destroy();

    await assertion;
    expect(worker.terminated).toBe(true);
    await expect(manager.sendMessage('getQuota')).rejects.toThrow('Worker terminated');
  });

  it('a worker error rejects every pending operation', async () => {
    const a = manager.sendMessage('listWorkspaces');
    const b = manager.sendMessage('getQuota');
    const assertions = Promise.all([
      expect(a).rejects.toThrow('Worker error: catastrophic'),
      expect(b).rejects.toThrow('Worker error: catastrophic'),
    ]);

    worker.onerror?.({ message: 'catastrophic' });

    await assertions;
  });

  it('a message deserialization error rejects pending operations', async () => {
    const pending = manager.sendMessage('readFile', { workspaceId: 'w', path: 'p' });
    const assertion = expect(pending).rejects.toThrow('Failed to deserialize');

    worker.onmessageerror?.({});

    await assertion;
  });
});
