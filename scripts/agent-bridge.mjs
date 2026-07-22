/**
 * Agent bridge (dev-only spike) — the process-side half of the W6 live-session
 * bridge (process/AGENT_AUTHORING_WORKFLOWS.md).
 *
 * Speaks MCP (newline-delimited JSON-RPC over stdio) to a coding agent, and
 * relays tool calls to the Agent Bridge plugin running in the author's SEED
 * tab over a localhost WebSocket. Read-only tools; the plugin executes them
 * against the open project's workspace.
 *
 * Run with a dev server + the plugin's panel open, then register e.g.:
 *   claude mcp add seed-bridge -- node scripts/agent-bridge.mjs
 *
 * Hand-rolled JSON-RPC rather than the MCP SDK: three methods, dev-only, no
 * new dependencies (ws is already hoisted by vite).
 */
import { WebSocketServer } from 'ws';
import { createInterface } from 'node:readline';

const PORT = 8747;

// --- tab side -----------------------------------------------------------------

let tab = null; // the one connected plugin socket
let tabProject = null;
let nextRequestId = 1;
const pending = new Map(); // request id → { resolve, reject, timer }

const wss = new WebSocketServer({ host: '127.0.0.1', port: PORT });
wss.on('connection', socket => {
  tab?.close();
  tab = socket;
  socket.on('message', raw => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (message.hello === 'seed-agent-bridge') {
      tabProject = message.projectId ?? null;
      process.stderr.write(`[bridge] tab connected, project ${tabProject}\n`);
      return;
    }
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    clearTimeout(entry.timer);
    if (message.ok) entry.resolve(message.result);
    else entry.reject(new Error(message.error ?? 'tool failed'));
  });
  socket.on('close', () => {
    if (tab === socket) {
      tab = null;
      tabProject = null;
      process.stderr.write('[bridge] tab disconnected\n');
    }
  });
});

function callTab(tool, params) {
  if (!tab || tab.readyState !== 1) {
    return Promise.reject(
      new Error('No SEED tab connected — open the Agent Bridge panel in the app (dev server).')
    );
  }
  const id = nextRequestId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error('tab did not answer within 15s'));
    }, 15000);
    pending.set(id, { resolve, reject, timer });
    tab.send(JSON.stringify({ id, tool, params }));
  });
}

// --- agent side (MCP over stdio) ----------------------------------------------

const TOOLS = [
  {
    name: 'seed_project_info',
    description:
      "The open SEED.html project's identity (workspace id) and bridge connection state.",
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'seed_list_files',
    description:
      "List every file in the open project's workspace (path + size). Paths are workspace-relative: SOURCE/ holds authoring files (text sources, scripts, settings.json), OEBPS/ holds packaged content (styles, images, OPF).",
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'seed_read_file',
    description:
      "Read a file from the open project's workspace as text (workspace-relative path from seed_list_files). Binary or oversized files report { binary: true, size } instead of content.",
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'workspace-relative file path' } },
      required: ['path'],
    },
  },
];

const respond = (id, result) =>
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
const respondError = (id, code, message) =>
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');

async function handleToolCall(name, args) {
  switch (name) {
    case 'seed_project_info': {
      const connected = !!tab && tab.readyState === 1;
      if (!connected) return { connected, hint: 'open the Agent Bridge panel in the SEED tab' };
      return { connected, ...(await callTab('project_info', {})) };
    }
    case 'seed_list_files':
      return callTab('list_files', {});
    case 'seed_read_file':
      return callTab('read_file', { path: args?.path });
    default:
      throw new Error('unknown tool: ' + name);
  }
}

const rl = createInterface({ input: process.stdin });
rl.on('line', async line => {
  if (!line.trim()) return;
  let request;
  try {
    request = JSON.parse(line);
  } catch {
    return;
  }
  const { id, method, params } = request;
  try {
    switch (method) {
      case 'initialize':
        respond(id, {
          protocolVersion: params?.protocolVersion ?? '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'seed-agent-bridge', version: '0.1.0' },
        });
        break;
      case 'notifications/initialized':
        break; // notification, no response
      case 'ping':
        respond(id, {});
        break;
      case 'tools/list':
        respond(id, { tools: TOOLS });
        break;
      case 'tools/call': {
        try {
          const result = await handleToolCall(params?.name, params?.arguments);
          respond(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
        } catch (error) {
          respond(id, {
            content: [{ type: 'text', text: String(error?.message ?? error) }],
            isError: true,
          });
        }
        break;
      }
      default:
        if (id !== undefined) respondError(id, -32601, 'method not found: ' + method);
    }
  } catch (error) {
    if (id !== undefined) respondError(id, -32603, String(error?.message ?? error));
  }
});

process.stderr.write(`[bridge] listening on ws://127.0.0.1:${PORT}, MCP on stdio\n`);
