<script lang="ts">
  import type { S3Object } from '../types.js';

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
  <div class="objects-table">
    <div class="table-header">
      <div class="col-name">Name</div>
      <div class="col-size">Size</div>
      <div class="col-modified">Modified</div>
      <div class="col-actions">Actions</div>
    </div>
    {#each objects as obj (obj.key)}
      <div class="table-row">
        <div class="col-name">{obj.key}</div>
        <div class="col-size">{(obj.size / 1024).toFixed(0)} KB</div>
        <div class="col-modified">
          {new Date(obj.lastModified).toLocaleDateString()}
        </div>
        <div class="col-actions">
          <div class="url-section">
            <button
              class="btn-icon"
              onclick={() => onCopyUrl(obj.key, obj.fileId)}
              title="Copy URL">📋</button
            >
          </div>
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
  .objects-table {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
  }

  .table-header {
    display: grid;
    grid-template-columns: 1fr 80px 110px 85px;
    gap: 12px;
    padding: 12px;
    background: #f0f0f0;
    font-weight: 600;
    border-bottom: 1px solid #e0e0e0;
  }

  .table-row {
    display: grid;
    grid-template-columns: 1fr 80px 110px 85px;
    gap: 12px;
    padding: 12px;
    border-bottom: 1px solid #e0e0e0;
    align-items: center;
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .col-name {
    word-break: break-all;
  }

  .col-size,
  .col-modified {
    text-align: right;
  }

  .col-actions {
    text-align: right;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    align-items: center;
  }

  .delete-confirm {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 12px;
  }

  .url-section {
    display: flex;
    align-items: center;
    gap: 6px;
  }
</style>
