<script lang="ts">
  import type { S3Object } from '../types.js';
  import type { ValidationReport } from '../epub-validation.js';

  let {
    epubs,
    remoteObjects,
    epubValidationStatus,
    uploading,
    uploadProgress,
    uploadingEpubName,
    onUpload,
    onValidate,
    onViewReport,
  }: {
    epubs: File[];
    remoteObjects: S3Object[];
    epubValidationStatus: Map<
      string,
      {
        isValid: boolean | null;
        isValidating: boolean;
        report: ValidationReport | null;
      }
    >;
    uploading: boolean;
    uploadProgress: number | null;
    uploadingEpubName: string | null;
    onUpload: (epub: File) => void;
    onValidate: (epub: File) => void;
    onViewReport: (epub: File) => void;
  } = $props();

  let confirmOverwrite: { [key: string]: boolean } = $state({});

  function wouldOverwrite(epub: File): boolean {
    return remoteObjects.some((o) => o.key === epub.name);
  }
</script>

{#if epubs.length === 0}
  <p class="empty-message">No EPUB files found in this directory</p>
{:else}
  <div class="epub-list">
    {#each epubs as epub (epub.name)}
      {@const overwrite = wouldOverwrite(epub)}
      <div class="epub-item">
        <div class="epub-info">
          <span class="epub-name">{epub.name}</span>
          <span class="epub-size">({(epub.size / 1024).toFixed(0)} KB)</span>
        </div>
        <div class="epub-actions">
          {#if uploadProgress !== null && uploadingEpubName === epub.name}
            <div class="progress-wrap">
              <progress value={uploadProgress} max={100}></progress>
              <span class="progress-label">{uploadProgress}%</span>
            </div>
          {:else}
            {#if overwrite}
              <label class="checkbox">
                <input
                  type="checkbox"
                  bind:checked={confirmOverwrite[epub.name]}
                />
                Overwrite?
              </label>
            {/if}
            <button
              class="btn-secondary"
              onclick={() => onUpload(epub)}
              disabled={uploading ||
                (overwrite && !confirmOverwrite[epub.name])}
            >
              {overwrite ? 'Replace' : 'Upload'}
            </button>
            <div class="validation-section">
              {#if epubValidationStatus.get(epub.name)?.isValid === true}
                <span class="status-icon status-valid" title="Valid EPUB"
                  >✓</span
                >
              {:else if epubValidationStatus.get(epub.name)?.isValid === false}
                <span class="status-icon status-invalid" title="Invalid EPUB"
                  >✕</span
                >
              {:else}
                <span class="status-icon status-unknown" title="Not validated"
                  >–</span
                >
              {/if}

              <button
                class="btn-secondary btn-sm"
                onclick={() => onValidate(epub)}
                disabled={epubValidationStatus.get(epub.name)?.isValidating ||
                  uploading}
                title="Validate EPUB"
              >
                {epubValidationStatus.get(epub.name)?.isValidating
                  ? 'Validating...'
                  : 'Validate'}
              </button>

              {#if epubValidationStatus.get(epub.name)?.report}
                <button
                  class="btn-secondary btn-sm"
                  onclick={() => onViewReport(epub)}
                  title="View validation report"
                >
                  Report
                </button>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .epub-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .epub-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #f8f8f8;
    border-radius: 4px;
    gap: 16px;
  }

  .epub-info {
    flex: 1;
    display: flex;
    gap: 8px;
    align-items: baseline;
  }

  .epub-name {
    font-weight: 500;
    word-break: break-all;
  }

  .epub-size {
    font-size: 12px;
    color: #999;
  }

  .epub-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    white-space: nowrap;
  }

  .checkbox {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    cursor: pointer;
  }

  .checkbox input {
    margin: 0;
    width: auto;
  }

  .validation-section {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }

  .status-icon {
    font-size: 16px;
    font-weight: bold;
    min-width: 20px;
    text-align: center;
  }

  .status-unknown {
    color: #999;
  }

  .progress-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  progress {
    width: 120px;
    height: 8px;
  }

  .progress-label {
    font-size: 12px;
    color: #666;
    min-width: 32px;
  }
</style>
