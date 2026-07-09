<script lang="ts">
  import type { RemoteConfig, RemotesStore } from '../types.js';
  import { t } from '../i18n.js';

  let {
    remotesStore,
    activeRemote,
    googleAuthRequired,
    deviceReconnectRequired = false,
    onAdd,
    onEdit,
    onRemove,
    onSelect,
    onReconnect,
    onReconnectDevice = () => {},
  }: {
    remotesStore: RemotesStore;
    activeRemote: RemoteConfig | null;
    googleAuthRequired: boolean;
    deviceReconnectRequired?: boolean;
    onAdd: () => void;
    onEdit: (id: string) => void;
    onRemove: () => void;
    onSelect: (id: string) => void;
    onReconnect: () => void;
    onReconnectDevice?: () => void;
  } = $props();
</script>

{#if remotesStore.remotes.length > 1}
  <div class="remote-selector-bar">
    <label for="remote-select">{$t('Active Remote:')}</label>
    <select
      id="remote-select"
      value={remotesStore.activeRemoteId}
      onchange={(e) => {
        const remoteId = e.currentTarget.value;
        if (remoteId) onSelect(remoteId);
      }}
    >
      {#each remotesStore.remotes as remote (remote.id)}
        <option value={remote.id}>
          {#if remote.name}
            {remote.name}
          {:else}
            {remote.type === 's3-compatible'
              ? remote.bucket
              : remote.type === 'google-drive'
                ? remote.folderName
                : remote.type === 'dropbox'
                  ? remote.folderPath
                  : remote.type === 'device'
                    ? remote.volumeLabel
                    : remote.url}
          {/if}
        </option>
      {/each}
    </select>
    <button class="btn btn-secondary" onclick={onAdd}>{$t('Add Remote')}</button
    >
    {#if activeRemote?.type === 'device'}
      <button
        class="btn btn-secondary"
        onclick={onReconnectDevice}
        title={$t('Re-check the device and refresh its book list')}
      >
        {$t('Reconnect')}
      </button>
    {/if}
    <button
      class="btn btn-secondary"
      onclick={() => activeRemote && onEdit(activeRemote.id)}
    >
      {$t('Edit')}
    </button>
    <button class="btn btn-danger btn-sm" onclick={onRemove}
      >{$t('Remove')}</button
    >
  </div>
{:else if remotesStore.remotes.length === 1}
  <div class="remote-selector-bar">
    <span>{$t('Remote:')} <strong>{activeRemote?.name}</strong></span>
    <button class="btn btn-secondary" onclick={onAdd}>{$t('Add Remote')}</button
    >
    {#if activeRemote?.type === 'device'}
      <button
        class="btn btn-secondary"
        onclick={onReconnectDevice}
        title={$t('Re-check the device and refresh its book list')}
      >
        {$t('Reconnect')}
      </button>
    {/if}
    <button
      class="btn btn-secondary"
      onclick={() => activeRemote && onEdit(activeRemote.id)}
    >
      {$t('Edit')}
    </button>
    <button class="btn btn-danger btn-sm" onclick={onRemove}
      >{$t('Remove')}</button
    >
  </div>
{/if}

{#if deviceReconnectRequired && activeRemote?.type === 'device'}
  <div class="auth-required-banner">
    <span>{$t('The saved device connection needs to be re-granted.')}</span>
    <button class="btn btn-primary" onclick={onReconnectDevice}>
      {$t('Reconnect device')}
    </button>
  </div>
{/if}

{#if googleAuthRequired && activeRemote?.type === 'google-drive'}
  <div class="auth-required-banner">
    <span>{$t('Google Drive authorization required.')}</span>
    <button class="btn btn-primary" onclick={onReconnect}>
      {$t('Connect to Google Drive')}
    </button>
  </div>
{/if}

<style>
  .remote-selector-bar {
    background: var(--color-surface-secondary);
    border: 1px solid var(--color-border-default);
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .remote-selector-bar label {
    font-weight: 500;
    white-space: nowrap;
  }

  .remote-selector-bar select {
    padding: 6px 8px;
    border: 1px solid var(--color-border-default);
    border-radius: 4px;
    font-size: 14px;
  }

  .remote-selector-bar span {
    flex: 1;
    min-width: 200px;
  }

  .auth-required-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    margin-bottom: 16px;
    background: var(--color-warning-bg);
    border: 1px solid var(--color-warning-border);
    border-radius: 4px;
    font-size: 14px;
  }
</style>
