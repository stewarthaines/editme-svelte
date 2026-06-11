<script lang="ts">
  import type { S3Object } from '../types.js';
  import FileName from './FileName.svelte';
  import { t } from '../i18n.js';

  let {
    objects,
    thumbnailUrls,
    googleAuthRequired,
    onCopyUrl,
    onDelete,
  }: {
    objects: S3Object[];
    thumbnailUrls: Map<string, string>;
    googleAuthRequired: boolean;
    onCopyUrl: (key: string, fileId?: string) => void;
    onDelete: (key: string) => void;
  } = $props();

  let deleteConfirmKey: string | null = $state(null);

  // Hide the uploaded cover thumbnails (.png) from the list; they remain on the
  // remote to back the OPDS covers. Books and catalog.xml stay visible.
  const visibleObjects = $derived(
    objects.filter((o) => !o.key.toLowerCase().endsWith('.png')),
  );
</script>

{#if googleAuthRequired}
  <p class="empty-message">{$t('Connect to Google Drive to view files.')}</p>
{:else if visibleObjects.length === 0}
  <p class="empty-message">{$t('Bucket is empty')}</p>
{:else}
  <div class="remote-list">
    {#each visibleObjects as obj (obj.key)}
      <div class="remote-item">
        {#if thumbnailUrls.get(obj.key)}
          <img
            src={thumbnailUrls.get(obj.key)}
            alt=""
            class="remote-cover"
            aria-hidden="true"
            onerror={(e) =>
              ((e.currentTarget as HTMLImageElement).style.display = 'none')}
          />
        {/if}
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
            class="btn btn-secondary btn-sm"
            onclick={() => onCopyUrl(obj.key, obj.fileId)}
            title={$t('Copy URL')}>{$t('Copy')}</button
          >
          {#if deleteConfirmKey === obj.key}
            <div class="delete-confirm">
              <span>{$t('Confirm delete?')}</span>
              <button
                class="btn btn-danger btn-sm"
                onclick={() => {
                  onDelete(obj.key);
                  deleteConfirmKey = null;
                }}>{$t('Yes')}</button
              >
              <button
                class="btn btn-secondary btn-sm"
                onclick={() => (deleteConfirmKey = null)}>{$t('No')}</button
              >
            </div>
          {:else}
            <button
              class="btn btn-danger btn-sm"
              onclick={() => (deleteConfirmKey = obj.key)}
              >{$t('Delete')}</button
            >
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .remote-list {
    border: 1px solid var(--color-border-default);
    border-radius: 4px;
    overflow: hidden;
  }

  .remote-item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    padding: 12px;
    border-bottom: 1px solid var(--color-border-default);
  }

  .remote-item:last-child {
    border-bottom: none;
  }

  .remote-cover {
    flex-shrink: 0;
    width: 32px;
    height: 48px;
    object-fit: cover;
    border-radius: 3px;
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
    color: var(--color-text-tertiary);
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
