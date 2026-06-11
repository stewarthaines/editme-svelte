/**
 * Publish to Cloudflare Plugin - Entry Point
 *
 * This plugin receives an OPFS directory handle from the main app via message,
 * and provides a UI to upload EPUBs to S3-compatible storage.
 */

import { mount } from 'svelte';
import App from './App.svelte';
import './styles.css';
import { dirHandle, activeIdentifier } from './store.js';
import { setPluginMessages } from './i18n.js';
import type { ContextMessage, InitMessage, MainToPlugin } from './types.js';

function handleMessage(event: MessageEvent) {
  if (event.origin !== window.origin) {
    console.warn('Ignoring message from different origin:', event.origin);
    return;
  }

  const message: MainToPlugin = event.data;

  if (message.type === 'init') {
    handleInit(message);
  } else if (message.type === 'context') {
    handleContext(message);
  }
}

// Mirror the host's ambient environment onto our own document root: theme drives
// the [data-theme] CSS, lang/dir keep the iframe in sync with the app's locale.
function handleContext(message: ContextMessage) {
  const root = document.documentElement;
  root.setAttribute('data-theme', message.theme);
  root.lang = message.locale;
  root.dir = message.dir;
  // Feed the active locale's dictionary to the plugin's `t` store.
  setPluginMessages(message.messages ?? {});
  // Track the open project so its published rows can be outlined.
  activeIdentifier.set(message.activeIdentifier);
}

function handleInit(message: InitMessage) {
  const { projectId, opfsDirHandle } = message;

  if (!projectId || !opfsDirHandle) {
    console.error('Invalid init message: missing projectId or opfsDirHandle');
    return;
  }

  if (typeof opfsDirHandle !== 'object') {
    console.error('Invalid OPFS directory handle');
    return;
  }

  dirHandle.set(opfsDirHandle);
}

function initPlugin() {
  mount(App, { target: document.getElementById('app')! });
  window.addEventListener('message', handleMessage);
  window.parent.postMessage(
    {
      type: 'plugin-ready',
      pluginType: 'publish-to-remote',
    },
    window.origin,
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPlugin);
} else {
  initPlugin();
}

// Export for use in module systems
export type {
  InitMessage,
  MainToPlugin,
  S3Credentials,
  S3Object,
} from './types.js';
export {
  findEpubFile,
  readEpubFile,
  getEpubBlob,
  readCredentials,
  writeCredentials,
  deleteCredentials,
} from './opfs.js';
export {
  uploadToS3,
  listObjects,
  deleteObject,
  getPublicUrl,
} from './s3-upload.js';
