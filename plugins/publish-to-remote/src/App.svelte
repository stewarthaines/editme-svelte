<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { dirHandle } from './store.js';
  import { readRemotes, writeRemotes } from './opfs.js';
  import {
    uploadFile,
    listFiles,
    deleteFile,
    getPublicUrl,
    uploadTextFile,
  } from './remote-ops.js';
  import { loadGoogleScripts, authorizeGoogleDrive } from './google-drive.js';
  import { generateOpdsFeed } from './opds.js';
  import {
    validateEpub,
    saveValidationReport,
    loadValidationReport,
  } from './epub-validation.js';
  import type { RemoteConfig, RemotesStore, S3Object } from './types.js';
  import type { ValidationReport } from './epub-validation.js';
  import ConfigureForm from './components/ConfigureForm.svelte';
  import LocalEpubList from './components/LocalEpubList.svelte';
  import RemoteFileList from './components/RemoteFileList.svelte';
  import RemoteSelector from './components/RemoteSelector.svelte';
  import ValidationModal from './components/ValidationModal.svelte';

  const GOOGLE_CLIENT_ID =
    (import.meta.env as Record<string, string>).VITE_GOOGLE_CLIENT_ID || '';
  const GOOGLE_API_KEY =
    (import.meta.env as Record<string, string>).VITE_GOOGLE_API_KEY || '';
  const DROPBOX_APP_KEY = (
    (import.meta.env as Record<string, string>).VITE_DROPBOX_APP_KEY || ''
  ).toString();
  const DROPBOX_REDIRECT_URI =
    (import.meta.env as Record<string, string>).VITE_DROPBOX_REDIRECT_URI || '';

  type ViewState = 'init' | 'configure' | 'loading' | 'ready';

  let view: ViewState = $state('init');
  let remotesStore: RemotesStore = $state({
    remotes: [],
    activeRemoteId: null,
  });
  const activeRemote = $derived(
    remotesStore.remotes.find((r) => r.id === remotesStore.activeRemoteId) ??
      null,
  );

  let remoteObjects: S3Object[] = $state([]);
  let localEpubs: File[] = $state([]);
  let uploading = $state(false);
  let uploadProgress: number | null = $state(null);
  let uploadingEpubName: string | null = $state(null);
  let epubValidationStatus: Map<
    string,
    {
      isValid: boolean | null;
      isValidating: boolean;
      report: ValidationReport | null;
    }
  > = new SvelteMap();
  let showValidationModal = $state(false);
  let validationModalReport: ValidationReport | null = $state(null);
  let generatingFeed = $state(false);
  let googleAuthRequired = $state(false);
  let editingRemote: RemoteConfig | null = $state(null);
  let statusMessage: {
    text: string;
    type: 'info' | 'success' | 'error';
  } | null = $state(null);

  let lastDirHandle: FileSystemDirectoryHandle | null = null;
  $effect(() => {
    if ($dirHandle && $dirHandle !== lastDirHandle) {
      lastDirHandle = $dirHandle;
      loadLocalEpubs().catch((err) => {
        console.error('Failed to load local EPUBs:', err);
        showStatus(`Failed to load EPUBs: ${String(err)}`, 'error');
      });
    }
  });

  onMount(async () => {
    const params = new URLSearchParams(window.location.search);
    if (window.opener && params.has('code') && params.has('state')) {
      window.opener.postMessage(
        {
          type: 'dropbox-auth',
          code: params.get('code'),
          state: params.get('state'),
        },
        window.location.origin,
      );
      window.close();
      return;
    }

    if (GOOGLE_CLIENT_ID) {
      loadGoogleScripts().catch((err) =>
        console.warn('Failed to preload Google scripts:', err),
      );
    }

    const saved = await readRemotes();
    remotesStore = saved;
    const active = saved.remotes.find((r) => r.id === saved.activeRemoteId);
    if (!active) {
      view = 'configure';
    } else {
      await refreshObjectList(active);
    }
  });

  async function loadLocalEpubs() {
    if (!$dirHandle) return;
    try {
      const entries: FileSystemHandle[] = [];
      for await (const entry of $dirHandle.values()) {
        entries.push(entry);
      }
      const epubFiles = entries.filter(
        (entry): entry is FileSystemFileHandle =>
          entry.kind === 'file' && entry.name.endsWith('.epub'),
      );
      const files: File[] = [];
      for (const fileHandle of epubFiles) {
        files.push(await fileHandle.getFile());
      }
      localEpubs = files;

      for (const file of files) {
        const report = await loadValidationReport(file.name);
        if (report) report.isValid = report.errorCount === 0;
        epubValidationStatus.set(file.name, {
          isValid: report?.isValid ?? null,
          isValidating: false,
          report: report ?? null,
        });
      }
    } catch (err) {
      console.error('Error reading local EPUBs:', err);
      throw err;
    }
  }

  async function refreshObjectList(remote?: RemoteConfig) {
    const target = remote || activeRemote;
    if (!target) return;
    const result = await listFiles(target);
    if (result.error === 'GOOGLE_AUTH_REQUIRED') {
      googleAuthRequired = true;
      remoteObjects = [];
      await loadLocalEpubs();
      view = 'ready';
    } else if (result.error) {
      showStatus(result.error, 'error');
      view = 'configure';
    } else {
      googleAuthRequired = false;
      remoteObjects = result.objects;
      await loadLocalEpubs();
      view = 'ready';
    }
  }

  async function onSaveRemote(remote: RemoteConfig, isNew: boolean) {
    try {
      let updated = remotesStore.remotes;
      if (isNew) {
        updated = [...updated, remote];
        remotesStore = {
          ...remotesStore,
          remotes: updated,
          activeRemoteId: remote.id,
        };
      } else {
        updated = updated.map((r) => (r.id === remote.id ? remote : r));
        remotesStore = { ...remotesStore, remotes: updated };
      }
      await writeRemotes(remotesStore);
      view = 'loading';
      await refreshObjectList();
    } catch (error) {
      showStatus(`Failed to save config: ${String(error)}`, 'error');
    }
  }

  function onOpenConfigure(remoteId?: string) {
    editingRemote = remoteId
      ? (remotesStore.remotes.find((r) => r.id === remoteId) ?? null)
      : null;
    view = 'configure';
  }

  function onCancelConfig() {
    view = remotesStore.remotes.length > 0 ? 'ready' : 'init';
  }

  async function onReconnectGoogleDrive() {
    if (!activeRemote || activeRemote.type !== 'google-drive') return;
    try {
      await loadGoogleScripts();
      const token = await authorizeGoogleDrive(activeRemote.clientId);
      remotesStore = {
        ...remotesStore,
        remotes: remotesStore.remotes.map((r) =>
          r.id === activeRemote!.id ? { ...r, accessToken: token } : r,
        ),
      };
      await writeRemotes(remotesStore);
      googleAuthRequired = false;
      await refreshObjectList();
    } catch (error) {
      showStatus(`Authorization failed: ${String(error)}`, 'error');
    }
  }

  async function onValidateEpub(epub: File) {
    const status = epubValidationStatus.get(epub.name) || {
      isValid: null,
      isValidating: false,
      report: null,
    };
    status.isValidating = true;
    epubValidationStatus.set(epub.name, status);

    try {
      const report = await validateEpub(epub);
      await saveValidationReport(report);
      status.isValid = report.isValid;
      status.report = report;
      status.isValidating = false;
      epubValidationStatus.set(epub.name, status);
      showStatus(
        `${epub.name}: ${report.errorCount} errors, ${report.warningCount} warnings`,
        report.isValid ? 'success' : 'info',
      );
    } catch (error) {
      status.isValidating = false;
      epubValidationStatus.set(epub.name, status);
      showStatus(`Validation failed: ${String(error)}`, 'error');
    }
  }

  function onViewValidationReport(epub: File) {
    const status = epubValidationStatus.get(epub.name);
    if (!status?.report) return;
    validationModalReport = status.report;
    showValidationModal = true;
  }

  async function onUploadEpub(epub: File) {
    if (!activeRemote) return;
    uploading = true;
    uploadProgress = 0;
    uploadingEpubName = epub.name;

    try {
      const result = await uploadFile(
        activeRemote,
        epub.name,
        epub,
        'application/epub+zip',
        (percent: number) => {
          uploadProgress = percent;
        },
      );
      if (result.success) {
        showStatus(`${epub.name} uploaded successfully`, 'success');
        await refreshObjectList();
      } else {
        showStatus(result.error || 'Upload failed', 'error');
      }
    } catch (error) {
      showStatus(`Upload error: ${String(error)}`, 'error');
    } finally {
      uploading = false;
      uploadProgress = null;
      uploadingEpubName = null;
    }
  }

  async function onDeleteObject(key: string) {
    if (!activeRemote) return;
    try {
      const result = await deleteFile(activeRemote, key);
      if (result.success) {
        remoteObjects = remoteObjects.filter((o) => o.key !== key);
        showStatus(`${key} deleted`, 'success');
      } else {
        showStatus(result.error || 'Delete failed', 'error');
      }
    } catch (error) {
      showStatus(`Delete error: ${String(error)}`, 'error');
    }
  }

  async function onSignOut() {
    if (!activeRemote) return;
    try {
      const name = activeRemote.name;
      const updated = remotesStore.remotes.filter(
        (r) => r.id !== activeRemote!.id,
      );
      remotesStore = {
        remotes: updated,
        activeRemoteId: updated.length > 0 ? updated[0].id : null,
      };
      await writeRemotes(remotesStore);
      remoteObjects = [];
      showStatus(`Removed ${name}`, 'info');
      view = remotesStore.remotes.length > 0 ? 'ready' : 'configure';
    } catch (error) {
      showStatus(`Sign out error: ${String(error)}`, 'error');
    }
  }

  async function onSetActiveRemote(remoteId: string) {
    const remote = remotesStore.remotes.find((r) => r.id === remoteId);
    if (!remote) return;
    remotesStore = { ...remotesStore, activeRemoteId: remoteId };
    await writeRemotes(remotesStore);
    await refreshObjectList(remote);
  }

  function onCopyUrl(key: string, fileId?: string) {
    if (!activeRemote) return;
    const url = getPublicUrl(activeRemote, key, fileId);
    if (url) {
      navigator.clipboard.writeText(url).then(() => {
        showStatus('URL copied to clipboard', 'success');
      });
    }
  }

  async function onUpdateCatalog() {
    if (!activeRemote) return;
    generatingFeed = true;
    try {
      let feedUrl = '';
      if (activeRemote.type === 's3-compatible') {
        feedUrl = getPublicUrl(activeRemote, 'catalog.xml');
      } else if (activeRemote.type === 'google-drive') {
        feedUrl = 'https://drive.google.com/catalog.xml';
      } else if (activeRemote.type === 'dropbox') {
        feedUrl = 'https://www.dropbox.com/catalog.xml';
      }
      const xml = generateOpdsFeed(activeRemote, remoteObjects, feedUrl);
      const result = await uploadTextFile(activeRemote, 'catalog.xml', xml);
      if (result.success) {
        showStatus(`Catalog updated: ${result.url || feedUrl}`, 'success');
        await refreshObjectList();
      } else {
        showStatus(result.error || 'Catalog update failed', 'error');
      }
    } catch (error) {
      showStatus(`Catalog update error: ${String(error)}`, 'error');
    } finally {
      generatingFeed = false;
    }
  }

  function showStatus(text: string, type: 'info' | 'success' | 'error') {
    statusMessage = { text, type };
    if (type === 'success') {
      setTimeout(() => {
        if (statusMessage?.text === text) statusMessage = null;
      }, 3000);
    }
  }
</script>

<div class="plugin-container">
  {#if statusMessage}
    <div
      class="status"
      class:error={statusMessage.type === 'error'}
      class:success={statusMessage.type === 'success'}
    >
      {statusMessage.text}
    </div>
  {/if}

  {#if view === 'init'}
    <div class="loading">Initializing...</div>
  {/if}

  {#if view === 'configure'}
    <ConfigureForm
      {editingRemote}
      googleClientId={GOOGLE_CLIENT_ID}
      googleApiKey={GOOGLE_API_KEY}
      dropboxAppKey={DROPBOX_APP_KEY}
      dropboxRedirectUri={DROPBOX_REDIRECT_URI}
      canCancel={remotesStore.remotes.length > 0}
      onSave={onSaveRemote}
      onCancel={onCancelConfig}
      onStatus={showStatus}
    />
  {/if}

  {#if view === 'loading'}
    <div class="loading">Connecting to storage...</div>
  {/if}

  {#if view === 'ready'}
    <div class="ready-container">
      <div class="section">
        <h3>Local EPUBs</h3>
        <LocalEpubList
          epubs={localEpubs}
          {remoteObjects}
          {epubValidationStatus}
          {uploading}
          {uploadProgress}
          {uploadingEpubName}
          onUpload={onUploadEpub}
          onValidate={onValidateEpub}
          onViewReport={onViewValidationReport}
        />
      </div>

      <RemoteSelector
        {remotesStore}
        {activeRemote}
        {googleAuthRequired}
        onAdd={() => onOpenConfigure()}
        onEdit={(id) => onOpenConfigure(id)}
        onRemove={onSignOut}
        onSelect={onSetActiveRemote}
        onReconnect={onReconnectGoogleDrive}
      />

      <div class="section">
        <h3>Remote Files</h3>
        <RemoteFileList
          objects={remoteObjects}
          {googleAuthRequired}
          {onCopyUrl}
          onDelete={onDeleteObject}
        />
      </div>

      <div class="footer">
        {#if activeRemote?.type !== 'google-drive'}
          <button
            class="btn-secondary"
            onclick={onUpdateCatalog}
            disabled={generatingFeed}
          >
            {generatingFeed ? 'Updating...' : 'Update Catalog'}
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <ValidationModal
    report={validationModalReport}
    show={showValidationModal}
    onClose={() => (showValidationModal = false)}
  />
</div>

<style>
  .plugin-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 16px;
  }

  .status {
    margin-bottom: 16px;
    padding: 12px;
    border-radius: 4px;
    border-left: 4px solid #0074d9;
    background: #e8f1ff;
    color: #0074d9;
  }

  .status.success {
    border-left-color: #28a745;
    background: #e8f5e9;
    color: #28a745;
  }

  .status.error {
    border-left-color: #dc3545;
    background: #ffebee;
    color: #dc3545;
  }

  .loading {
    text-align: center;
    padding: 40px 20px;
    color: #666;
  }

  .ready-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .section {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 16px;
  }

  .section h3 {
    margin: 0 0 16px 0;
    font-size: 16px;
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
  }
</style>
