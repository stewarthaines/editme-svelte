<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { t } from '../../i18n';
  import { X } from 'phosphor-svelte';

  let {
    defaultTitle,
    onDuplicate,
    onClose,
  }: {
    /** Pre-filled title — the current project's title with " (copy)" appended. */
    defaultTitle: string;
    onDuplicate: (title: string) => Promise<void>;
    onClose: () => void;
  } = $props();

  // The dialog is mounted fresh each time it opens, so this seeds the field once.
  let title = $state(untrack(() => defaultTitle));
  let duplicating = $state(false);
  let error = $state<string | null>(null);

  let titleInput = $state<HTMLInputElement | null>(null);

  onMount(() => {
    titleInput?.focus();
    titleInput?.select();
  });

  async function duplicate() {
    if (duplicating) return;
    const next = title.trim();
    if (!next) return;
    duplicating = true;
    error = null;
    try {
      await onDuplicate(next);
      // On success the app selects the copy and this dialog unmounts.
    } catch (e) {
      error = e instanceof Error ? e.message : $t('Failed to duplicate project.');
      duplicating = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onClose();
    else if (event.key === 'Enter') duplicate();
  }

  function handleBackdropKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onClose();
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="dup-backdrop" onclick={onClose} onkeydown={handleBackdropKeydown} role="presentation">
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    class="dup-dialog"
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby="dup-dialog-title"
    onclick={event => event.stopPropagation()}
    onkeydown={handleKeydown}
  >
    <header class="dup-header">
      <h2 id="dup-dialog-title">{$t('Duplicate Project')}</h2>
      <button type="button" class="dup-close" onclick={onClose} aria-label={$t('Close')}
        ><X size={16} aria-hidden="true" /></button
      >
    </header>

    <div class="dup-field">
      <label class="dup-label" for="dup-title">{$t('Title')}</label>
      <input
        bind:this={titleInput}
        bind:value={title}
        id="dup-title"
        type="text"
        class="dup-input"
        disabled={duplicating}
      />
    </div>

    {#if error}
      <p class="dup-error" role="alert">{error}</p>
    {/if}

    <footer class="dup-footer">
      <button type="button" class="dup-btn-secondary" onclick={onClose} disabled={duplicating}>
        {$t('Cancel')}
      </button>
      <button
        type="button"
        class="dup-btn-primary"
        onclick={duplicate}
        disabled={duplicating || !title.trim()}
      >
        {duplicating ? $t('Duplicating…') : $t('Duplicate')}
      </button>
    </footer>
  </div>
</div>

<style>
  .dup-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal, 1000);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    background-color: rgb(0 0 0 / 0.5);
  }

  .dup-dialog {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    inline-size: min(28rem, 100%);
    padding: var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    background-color: var(--color-surface-primary);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-lg);
  }

  .dup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .dup-header h2 {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 600;
  }

  .dup-close {
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    font-size: var(--text-lg);
    cursor: pointer;
    line-height: 1;
    padding: var(--space-1);
    border-radius: var(--radius-xs);
  }

  .dup-close:hover {
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .dup-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .dup-label {
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    color: var(--color-text-secondary);
  }

  .dup-input {
    inline-size: 100%;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    background-color: var(--color-surface-primary);
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: var(--text-sm);
  }

  .dup-input:focus {
    outline: none;
    border-color: var(--color-focus);
    box-shadow: inset 0 0 0 2px var(--color-focus-ring);
  }

  .dup-error {
    margin: 0;
    color: var(--color-error-text, var(--color-text-primary));
    font-size: var(--text-sm);
  }

  .dup-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }

  .dup-btn-secondary {
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    background-color: var(--color-surface-primary);
    color: var(--color-text-secondary);
    font-family: inherit;
    cursor: pointer;
  }

  .dup-btn-secondary:not(:disabled):hover {
    border-color: var(--color-border-hover);
    background-color: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  .dup-btn-primary {
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-sm);
    background-color: var(--color-primary);
    color: var(--color-surface);
    font-family: inherit;
    cursor: pointer;
  }

  .dup-btn-primary:disabled,
  .dup-btn-secondary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
