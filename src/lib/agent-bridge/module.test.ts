/**
 * Tests for the agent bridge module asset (src/assets/agent-bridge/module.js).
 * The asset is plain ESM, imported directly; the WebSocket is a scripted fake
 * and the workspace directory is a plain-object handle tree.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { start } from './module.js';

class FakeWebSocket {
  static last: FakeWebSocket | null = null;
  sent: string[] = [];
  readyState = 0;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  constructor(public url: string) {
    FakeWebSocket.last = this;
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
  // test helpers
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  async receive(message: object): Promise<object> {
    const before = this.sent.length;
    this.onmessage?.({ data: JSON.stringify(message) });
    for (let i = 0; i < 50 && this.sent.length === before; i++) await Promise.resolve();
    return JSON.parse(this.sent[this.sent.length - 1]);
  }
}

const fakeFile = (bytes: Uint8Array | string) => {
  const data = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes;
  return {
    kind: 'file' as const,
    getFile: async () => ({
      size: data.length,
      arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.length),
    }),
  };
};

function fakeDir(entries: Record<string, ReturnType<typeof fakeFile> | object>): object {
  return {
    kind: 'directory' as const,
    entries: async function* () {
      for (const [name, entry] of Object.entries(entries)) yield [name, entry];
    },
    getDirectoryHandle: async (name: string) => {
      const entry = entries[name] as { kind: string } | undefined;
      if (!entry || entry.kind !== 'directory') throw new Error('not found: ' + name);
      return entry;
    },
    getFileHandle: async (name: string) => {
      const entry = entries[name] as { kind: string } | undefined;
      if (!entry || entry.kind !== 'file') throw new Error('not found: ' + name);
      return entry;
    },
  };
}

function makeContext(overrides: Record<string, unknown> = {}) {
  const workspace = fakeDir({
    OEBPS: fakeDir({
      Styles: fakeDir({ 'page.css': fakeFile('body { color: red }') }),
      'audio.mp3': fakeFile(new Uint8Array([0, 1, 2, 0])),
    }),
    SOURCE: fakeDir({ 'settings.json': fakeFile('{}') }),
  });
  const statuses: Array<[string, string | undefined]> = [];
  const ctx = {
    wsUrl: 'ws://localhost:8747',
    mountEl: document.createElement('div'),
    onStatus: (status: string, detail?: string) => statuses.push([status, detail]),
    getProjectInfo: () => ({ workspaceId: 'ws-1', title: 'Bulletin', language: 'en' }),
    getWorkspaceDir: async () => workspace,
    getRenderedXhtml: () => ({ chapterId: 'ch-1', xhtml: '<html/>' }),
    getLastClick: () => null,
    ...overrides,
  };
  return { ctx, statuses };
}

beforeEach(() => {
  vi.stubGlobal('WebSocket', FakeWebSocket);
  FakeWebSocket.last = null;
});

describe('agent bridge module', () => {
  it('connects, reports status, and sends the hello with the project id', () => {
    const { ctx, statuses } = makeContext();
    start(ctx);
    const socket = FakeWebSocket.last!;
    expect(socket.url).toBe('ws://localhost:8747');
    socket.open();
    expect(JSON.parse(socket.sent[0])).toEqual({ hello: 'seed-agent-bridge', projectId: 'ws-1' });
    expect(statuses.map(s => s[0])).toEqual(['connecting', 'connected']);
  });

  it('serves project_info, rendered xhtml, and selection', async () => {
    const { ctx } = makeContext();
    start(ctx);
    const socket = FakeWebSocket.last!;
    socket.open();
    expect(await socket.receive({ id: 1, tool: 'project_info' })).toEqual({
      id: 1,
      ok: true,
      result: { workspaceId: 'ws-1', title: 'Bulletin', language: 'en' },
    });
    expect(await socket.receive({ id: 2, tool: 'get_rendered_xhtml' })).toEqual({
      id: 2,
      ok: true,
      result: { chapterId: 'ch-1', xhtml: '<html/>' },
    });
    expect(await socket.receive({ id: 3, tool: 'get_selection' })).toEqual({
      id: 3,
      ok: true,
      result: { kind: 'none' },
    });
  });

  it('lists files sorted with sizes', async () => {
    const { ctx } = makeContext();
    start(ctx);
    const socket = FakeWebSocket.last!;
    socket.open();
    const response = (await socket.receive({ id: 1, tool: 'list_files' })) as {
      result: { files: Array<{ path: string; size: number }> };
    };
    // localeCompare: case-insensitive, so audio.mp3 sorts before Styles/
    expect(response.result.files.map(f => f.path)).toEqual([
      'OEBPS/audio.mp3',
      'OEBPS/Styles/page.css',
      'SOURCE/settings.json',
    ]);
    expect(response.result.files[1].size).toBe(19);
  });

  it('reads text files, flags binary, rejects traversal and missing paths', async () => {
    const { ctx } = makeContext();
    start(ctx);
    const socket = FakeWebSocket.last!;
    socket.open();
    expect(
      await socket.receive({ id: 1, tool: 'read_file', params: { path: 'OEBPS/Styles/page.css' } })
    ).toEqual({ id: 1, ok: true, result: { text: 'body { color: red }', size: 19 } });
    expect(
      await socket.receive({ id: 2, tool: 'read_file', params: { path: 'OEBPS/audio.mp3' } })
    ).toEqual({ id: 2, ok: true, result: { binary: true, size: 4 } });
    const traversal = await socket.receive({
      id: 3,
      tool: 'read_file',
      params: { path: '../escape' },
    });
    expect(traversal).toMatchObject({ id: 3, ok: false });
    const missing = await socket.receive({
      id: 4,
      tool: 'read_file',
      params: { path: 'OEBPS/nope.css' },
    });
    expect(missing).toMatchObject({ id: 4, ok: false });
  });

  it('answers unknown tools with an error, not silence', async () => {
    const { ctx } = makeContext();
    start(ctx);
    const socket = FakeWebSocket.last!;
    socket.open();
    const response = await socket.receive({ id: 9, tool: 'write_file', params: {} });
    expect(response).toMatchObject({ id: 9, ok: false });
  });

  it('renders the overlay, logs actions, and tears down on stop', async () => {
    const { ctx } = makeContext();
    const handle = start(ctx);
    const socket = FakeWebSocket.last!;
    socket.open();
    expect(ctx.mountEl.querySelector('[role="region"]')).toBeTruthy();
    await socket.receive({ id: 1, tool: 'list_files' });
    await socket.receive({ id: 2, tool: 'read_file', params: { path: 'SOURCE/settings.json' } });
    const items = [...ctx.mountEl.querySelectorAll('li')].map(li => li.textContent);
    expect(items).toEqual(['listed project files', 'read SOURCE/settings.json']);
    handle.stop();
    expect(ctx.mountEl.children.length).toBe(0);
  });

  it('parks at disconnected on an unexpected close — no reconnect attempt', () => {
    const { ctx, statuses } = makeContext();
    start(ctx);
    const socket = FakeWebSocket.last!;
    socket.open();
    socket.close();
    expect(statuses[statuses.length - 1][0]).toBe('disconnected');
    // overlay stays mounted (parked), and no new socket was created
    expect(ctx.mountEl.children.length).toBe(1);
    expect(FakeWebSocket.last).toBe(socket);
  });
});
