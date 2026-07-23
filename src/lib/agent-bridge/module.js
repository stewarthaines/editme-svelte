/* eslint-disable @typescript-eslint/ban-ts-comment -- runtime asset, not a
   lib module: served raw by the dev middleware (never bundled) and typed at
   its boundary (AgentBridgeModuleContext in loader.svelte.ts). The unit tests
   exercise it; TS doesn't vet its internals. */
// @ts-nocheck
/**
 * Agent bridge module (dev-only) — the app-realm half of the live-session
 * bridge (process/AGENT_BRIDGE.md). Lazily fetched by the core loader stub
 * when the author clicks "Allow agent assistance"; never part of the bundle.
 *
 * Connects OUT to the local MCP bridge process (scripts/agent-bridge.mjs)
 * over ws://localhost:8747, serves read-only tool requests against the
 * context object the app hands over, and owns the activity overlay UI —
 * the pill + action feed painted into the host-provided mount element.
 *
 * No auto-reconnect by design: a dropped socket parks the overlay at
 * disconnected and reattaching is a fresh click on the sidebar button.
 * Deliberately untranslated (dev tool, outside the app's catalogs).
 */

const FEED_LIMIT = 100;

/** Start with an AgentBridgeModuleContext (loader.svelte.ts); returns { stop }. */
export function start(ctx) {
  const ui = buildOverlay(ctx.mountEl, () => stop());
  let socket = null;
  let stopped = false;

  function setStatus(status, detail) {
    ui.setStatus(status, detail);
    ctx.onStatus(status, detail);
  }

  setStatus('connecting');
  let opened = false;
  socket = new WebSocket(ctx.wsUrl);
  socket.onopen = () => {
    opened = true;
    setStatus('connected');
    socket.send(
      JSON.stringify({ hello: 'seed-agent-bridge', projectId: ctx.getProjectInfo().workspaceId })
    );
  };
  socket.onclose = () => {
    // Unexpected drop or bridge exit: park at disconnected (no auto-reconnect).
    // A connect failure fires error-then-close, so the message is chosen here,
    // by whether a connection ever opened — never overwritten by close.
    if (!stopped) {
      setStatus(
        'disconnected',
        opened ? 'bridge closed the connection' : 'bridge not reachable — is it running?'
      );
    }
  };
  socket.onmessage = async event => {
    let request;
    try {
      request = JSON.parse(event.data);
    } catch {
      return;
    }
    if (!request || typeof request.id !== 'number' || typeof request.tool !== 'string') return;
    try {
      const result = await handleTool(ctx, request.tool, request.params ?? {});
      ui.addAction(describeAction(request.tool, request.params));
      socket.send(JSON.stringify({ id: request.id, ok: true, result }));
    } catch (error) {
      ui.addAction(`${describeAction(request.tool, request.params)} — failed`);
      socket.send(
        JSON.stringify({ id: request.id, ok: false, error: String(error?.message ?? error) })
      );
    }
  };

  function stop() {
    // Deliberate teardown (toggle off): close and remove the overlay.
    stopped = true;
    try {
      socket?.close();
    } catch {
      /* already closed */
    }
    ui.destroy();
    ctx.onStatus('disconnected', 'stopped');
  }

  return { stop };
}

// --- read-only tools ------------------------------------------------------------

async function handleTool(ctx, tool, params) {
  switch (tool) {
    case 'project_info':
      return ctx.getProjectInfo();
    case 'list_files': {
      const dir = await ctx.getWorkspaceDir();
      if (!dir) throw new Error('no project open');
      const files = [];
      await walk(dir, '', files);
      files.sort((a, b) => a.path.localeCompare(b.path));
      return { files };
    }
    case 'read_file': {
      if (typeof params.path !== 'string') throw new Error('path required');
      const dir = await ctx.getWorkspaceDir();
      if (!dir) throw new Error('no project open');
      const file = await (await resolveFile(dir, params.path)).getFile();
      if (file.size > 512 * 1024) return { binary: true, size: file.size };
      const bytes = new Uint8Array(await file.arrayBuffer());
      // NUL byte in the first KB → binary; report size only
      if (bytes.slice(0, 1024).includes(0)) return { binary: true, size: file.size };
      return { text: new TextDecoder().decode(bytes), size: file.size };
    }
    case 'get_rendered_xhtml': {
      const rendered = ctx.getRenderedXhtml();
      if (!rendered) throw new Error('no chapter rendered');
      return rendered;
    }
    case 'get_selection': {
      const click = ctx.getLastClick();
      return click ?? { kind: 'none' };
    }
    default:
      throw new Error('unknown tool: ' + tool);
  }
}

async function walk(dir, prefix, out) {
  for await (const [name, entry] of dir.entries()) {
    const path = prefix ? prefix + '/' + name : name;
    if (entry.kind === 'directory') await walk(entry, path, out);
    else out.push({ path, size: (await entry.getFile()).size });
  }
}

async function resolveFile(root, path) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0 || parts.some(p => p === '..')) throw new Error('invalid path');
  let dir = root;
  for (const part of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(part);
  return dir.getFileHandle(parts[parts.length - 1]);
}

function describeAction(tool, params) {
  if (tool === 'read_file' && params && typeof params.path === 'string')
    return `read ${params.path}`;
  if (tool === 'list_files') return 'listed project files';
  if (tool === 'get_rendered_xhtml') return 'read rendered chapter';
  if (tool === 'get_selection') return 'read last click';
  if (tool === 'project_info') return 'read project info';
  return tool;
}

// --- overlay (module-owned; sr-caption family: dark in both themes) -------------

function buildOverlay(mountEl, onDisconnect) {
  mountEl.textContent = '';
  const root = document.createElement('div');
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', 'Agent activity');
  Object.assign(root.style, {
    position: 'fixed',
    insetBlockEnd: '16px',
    insetInlineStart: '50%',
    transform: 'translateX(-50%)',
    zIndex: '1600',
    font: '12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace',
    color: '#f5f5f6',
    background: 'rgba(20, 20, 22, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    maxInlineSize: 'min(90vw, 480px)',
  });

  const pill = document.createElement('button');
  pill.type = 'button';
  pill.setAttribute('aria-expanded', 'false');
  Object.assign(pill.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    border: '0',
    background: 'none',
    color: 'inherit',
    font: 'inherit',
    cursor: 'pointer',
    maxInlineSize: '100%',
  });
  const dot = document.createElement('span');
  Object.assign(dot.style, {
    inlineSize: '8px',
    blockSize: '8px',
    borderRadius: '50%',
    background: '#fbc02d',
    flex: 'none',
  });
  const label = document.createElement('span');
  label.textContent = 'agent: connecting…';
  Object.assign(label.style, {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  });
  pill.append(dot, label);

  const panel = document.createElement('div');
  panel.hidden = true;
  Object.assign(panel.style, {
    borderBlockStart: '1px solid rgba(255,255,255,0.15)',
    padding: '4px 0',
  });
  const feed = document.createElement('ol');
  Object.assign(feed.style, {
    margin: '0',
    padding: '4px 0',
    listStyle: 'none',
    maxBlockSize: '30vh',
    overflowY: 'auto',
  });
  const disconnect = document.createElement('button');
  disconnect.type = 'button';
  disconnect.textContent = 'Disconnect';
  Object.assign(disconnect.style, {
    margin: '4px 12px 6px',
    padding: '3px 10px',
    font: 'inherit',
    color: 'inherit',
    background: 'rgba(255,255,255,0.12)',
    border: '0',
    borderRadius: '4px',
    cursor: 'pointer',
  });
  disconnect.addEventListener('click', onDisconnect);
  panel.append(feed, disconnect);

  pill.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    pill.setAttribute('aria-expanded', String(!panel.hidden));
  });

  root.append(pill, panel);
  mountEl.appendChild(root);

  let lastAction = '';
  return {
    setStatus(status, detail) {
      dot.style.background =
        status === 'connected' ? '#2e7d32' : status === 'connecting' ? '#fbc02d' : '#b3261e';
      label.textContent =
        status === 'connected'
          ? lastAction
            ? `agent: ${lastAction}`
            : 'agent: connected'
          : `agent: ${status}${detail ? ` — ${detail}` : ''}`;
    },
    addAction(text) {
      lastAction = text;
      label.textContent = `agent: ${text}`;
      const li = document.createElement('li');
      li.textContent = text;
      Object.assign(li.style, { padding: '1px 12px', overflowWrap: 'anywhere' });
      feed.appendChild(li);
      while (feed.children.length > FEED_LIMIT) feed.removeChild(feed.firstChild);
      li.scrollIntoView({ block: 'nearest' });
    },
    destroy() {
      root.remove();
    },
  };
}
