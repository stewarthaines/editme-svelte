<script lang="ts">
  import { t } from '../../i18n';

  let {
    isLoading = false,
    onCreateNewRequested,
    onLoadEpubRequested,
    onImportFromOPDSRequested,
    onDuplicateRequested,
    currentProjectTitle,
  }: {
    isLoading?: boolean;
    onCreateNewRequested?: () => void;
    onLoadEpubRequested?: () => void;
    onImportFromOPDSRequested?: () => void;
    onDuplicateRequested?: () => void;
    currentProjectTitle?: string;
  } = $props();

  const handleCreateNew = () => {
    onCreateNewRequested?.();
  };

  const handleLoadEpub = () => {
    onLoadEpubRequested?.();
  };

  const handleImportFromOPDS = () => {
    onImportFromOPDSRequested?.();
  };

  const handleDuplicate = () => {
    onDuplicateRequested?.();
  };

  // Future: import from folder functionality
  const _handleImportFolder = () => {
    // Placeholder for future implementation
    console.log('Import from folder - coming soon');
  };
</script>

<div class="workspace-action-bar">
  <div class="action-buttons">
    <button
      type="button"
      class="action-button"
      onclick={handleCreateNew}
      disabled={isLoading}
      aria-label={$t('Create a new minimal EPUB project')}
    >
      {$t('Create New')}
    </button>

    <button
      type="button"
      class="action-button"
      onclick={handleLoadEpub}
      disabled={isLoading}
      aria-label={$t('Load an existing EPUB file for editing')}
    >
      {$t('Load EPUB')}
    </button>

    <!-- OPDS import reaches the network; shown only when a handler is wired
         (the Projects view omits it when running offline from a file:// URL). -->
    {#if onImportFromOPDSRequested}
      <button
        type="button"
        class="action-button"
        onclick={handleImportFromOPDS}
        disabled={isLoading}
        aria-label={$t('Import an EPUB from an OPDS catalog URL')}
      >
        {$t('Import from OPDS')}
      </button>
    {/if}

    <!-- Duplicate the current project; shown only when a project is loaded. -->
    {#if onDuplicateRequested}
      <button
        type="button"
        class="action-button"
        onclick={handleDuplicate}
        disabled={isLoading}
        aria-label={$t('Duplicate the current project: {name}', {
          name: currentProjectTitle ?? '',
        })}
      >
        {$t('Duplicate')}
      </button>
    {/if}
  </div>
</div>

<style>
  /* Query the pane width (not the viewport) so the grid reflows with the split. */
  .workspace-action-bar {
    container-type: inline-size;
  }

  /* Flat, app-standard CTAs — all identical. Responsive grid: one row → 2×2 →
     single column as the pane narrows. */
  .action-buttons {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-2);
  }

  @container (max-width: 34rem) {
    .action-buttons {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @container (max-width: 17rem) {
    .action-buttons {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .action-button {
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    background-color: var(--color-surface-primary);
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: var(--text-sm);
    font-weight: 500;
    text-align: center;
    cursor: pointer;
    transition:
      background-color var(--duration-fast) ease,
      border-color var(--duration-fast) ease;
  }

  .action-button:not(:disabled):hover {
    border-color: var(--color-border-hover);
    background-color: var(--color-surface-hover);
  }

  .action-button:focus-visible {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: inset 0 0 0 2px var(--color-focus-ring);
  }

  .action-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
