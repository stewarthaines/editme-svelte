<script lang="ts">
  import type { S3Object } from '../types.js';
  import FileName from './FileName.svelte';

  let {
    objects,
    googleAuthRequired,
    onCopyUrl,
    onDelete,
  }: {
    objects: S3Object[];
    googleAuthRequired: boolean;
    onCopyUrl: (key: string, fileId?: string) => void;
    onDelete: (key: string) => void;
  } = $props();

  let deleteConfirmKey: string | null = $state(null);
</script>

{#if googleAuthRequired}
  <p class="empty-message">Connect to Google Drive to view files.</p>
{:else if objects.length === 0}
  <p class="empty-message">Bucket is empty</p>
{:else}
  <div class="remote-list">
    {#each objects as obj (obj.key)}
      <div class="remote-item">
        <div class="remote-info">
          <FileName name={obj.key} />
          <span class="remote-meta">
            {(obj.size / 1024).toFixed(0)} KB · {new Date(
              obj.lastModified,
            ).toLocaleDateString()}
          </span>
        </div>
        <div class="remote-actions">
          <button
            class="btn-icon"
            onclick={() => onCopyUrl(obj.key, obj.fileId)}
            title="Copy URL">📋</button
          >
          {#if deleteConfirmKey === obj.key}
            <div class="delete-confirm">
              <span>Confirm delete?</span>
              <button
                class="btn-danger-small"
                onclick={() => {
                  onDelete(obj.key);
                  deleteConfirmKey = null;
                }}>Yes</button
              >
              <button
                class="btn-cancel-small"
                onclick={() => (deleteConfirmKey = null)}>No</button
              >
            </div>
          {:else}
            <button
              class="btn-danger-small"
              onclick={() => (deleteConfirmKey = obj.key)}>Delete</button
            >
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .remote-list {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
  }

  .remote-item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    padding: 12px;
    border-bottom: 1px solid #e0e0e0;
  }

  .remote-item:last-child {
    border-bottom: none;
  }

  /* Same responsive pattern as the local list: name takes the width and
     middle-ellipsises; actions wrap below when the pane is too narrow. */
  .remote-info {
    flex: 1 1 200px;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 2px 8px;
    align-items: baseline;
  }

  .remote-meta {
    font-size: 12px;
    color: #999;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .remote-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .delete-confirm {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 12px;
  }
</style>
