/**
 * Publish to Cloudflare Plugin - Entry Point
 *
 * This plugin receives an OPFS directory handle from the main app via message,
 * and provides a UI to upload EPUBs to S3-compatible storage.
 */

import { mount } from 'svelte';
import App from './App.svelte';
import './styles.css';
import { dirHandle } from './store.js';
import type { InitMessage, MainToPlugin } from './types.js';

function handleMessage(event: MessageEvent) {
  if (event.origin !== window.origin) {
    console.warn('Ignoring message from different origin:', event.origin);
    return;
  }

  const message: MainToPlugin = event.data;

  if (message.type === 'init') {
    handleInit(message);
  }
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
