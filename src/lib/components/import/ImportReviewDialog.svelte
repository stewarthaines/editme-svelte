<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { t } from '../../i18n';
  import { X } from 'phosphor-svelte';
  import InlineTextDiff from './InlineTextDiff.svelte';
  import type {
    ImportKind,
    ImportResolution,
    ReviewDecision,
    ReviewItem,
  } from '../../import/types';

  let {
    items,
    kind,
    onConfirm,
    onCancel,
  }: {
    /** The colliding files to review (at least one). */
    items: ReviewItem[];
    /** Which surface these came from — tunes the wording. */
    kind: ImportKind;
    /** Commit the chosen resolutions. The parent closes the dialog on success. */
    onConfirm: (decisions: ReviewDecision[]) => Promise<void> | void;
    onCancel: () => void;
  } = $props();

  // Per-file decisions, seeded once from the incoming items (default: overwrite).
  let decisions = $state<Record<string, ImportResolution>>(
    untrack(() => Object.fromEntries(items.map(item => [item.key, item.resolution])))
  );
  let selectedKey = $state(untrack(() => items[0]?.key ?? ''));
  let saving = $state(false);
  let error = $state<string | null>(null);

  const selected = $derived(items.find(item => item.key === selectedKey) ?? items[0]);

  // Blob URLs for image previews, created once and revoked on teardown.
  let imageUrls = $state<Record<string, { current: string; incoming: string }>>({});

  onMount(() => {
    const created: string[] = [];
    const map: Record<string, { current: string; incoming: string }> = {};
    for (const item of items) {
      if (item.preview.type === 'image') {
        const current = URL.createObjectURL(
          new Blob([item.preview.current], { type: item.preview.mediaType })
        );
        const incoming = URL.createObjectURL(
          new Blob([item.preview.incoming], { type: item.preview.mediaType })
        );
        map[item.key] = { current, incoming };
        created.push(current, incoming);
      }
    }
    imageUrls = map;
    return () => created.forEach(url => URL.revokeObjectURL(url));
  });

  function setResolution(key: string, resolution: ImportResolution) {
    decisions = { ...decisions, [key]: resolution };
  }

  async function confirm() {
    if (saving) return;
    saving = true;
    error = null;
    try {
      await onConfirm(items.map(item => ({ key: item.key, resolution: decisions[item.key] })));
      // On success the parent commits the import and unmounts this dialog.
    } catch (e) {
      error = e instanceof Error ? e.message : $t('Failed to import files');
      saving = false;
    }
  }

  function formatBytes(n: number): string {
    if (n < 1024) return $t('{n} bytes', { n });
    if (n < 1024 * 1024) return $t('{n} KB', { n: Math.round(n / 1024) });
    return $t('{n} MB', { n: Math.round(n / (1024 * 1024)) });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onCancel();
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="import-backdrop" onclick={onCancel} role="presentation">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="import-dialog"
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby="import-review-title"
    onclick={event => event.stopPropagation()}
    onkeydown={handleKeydown}
  >
    <header class="import-header">
      <div>
        <h2 id="import-review-title">{$t('Review import conflicts')}</h2>
        <p class="import-subtitle">
          {kind === 'chapter'
            ? $t('These files match existing chapters. Choose what to do with each.')
            : $t('These files match existing manifest items. Choose what to do with each.')}
        </p>
      </div>
      <button type="button" class="btn btn-icon" onclick={onCancel} aria-label={$t('Close')}
        ><X size={16} aria-hidden="true" /></button
      >
    </header>

    <div class="import-body">
      <!-- Left: file list -->
      <ul class="import-list" aria-label={$t('Conflicting files')}>
        {#each items as item (item.key)}
          <li>
            <button
              type="button"
              class="import-list-item"
              class:selected={item.key === selectedKey}
              onclick={() => (selectedKey = item.key)}
            >
              <span class="import-list-name">{item.title}</span>
              <span class="import-list-badge import-badge-{decisions[item.key]}">
                {decisions[item.key] === 'overwrite'
                  ? $t('Overwrite')
                  : decisions[item.key] === 'keep-both'
                    ? $t('Keep both')
                    : $t('Ignore')}
              </span>
            </button>
          </li>
        {/each}
      </ul>

      <!-- Right: preview + per-file choice -->
      <div class="import-preview">
        {#if selected}
          <fieldset class="import-choice">
            <legend class="import-choice-legend">
              {$t('Conflicts with {label}', { label: selected.collisionLabel })}
            </legend>
            <label class="import-radio">
              <input
                type="radio"
                name="resolution-{selected.key}"
                checked={decisions[selected.key] === 'overwrite'}
                onchange={() => setResolution(selected.key, 'overwrite')}
                disabled={saving}
              />
              <span>{$t('Overwrite the existing item')}</span>
            </label>
            <label class="import-radio">
              <input
                type="radio"
                name="resolution-{selected.key}"
                checked={decisions[selected.key] === 'keep-both'}
                onchange={() => setResolution(selected.key, 'keep-both')}
                disabled={saving}
              />
              <span>{$t('Keep both (import as a new item)')}</span>
            </label>
            <label class="import-radio">
              <input
                type="radio"
                name="resolution-{selected.key}"
                checked={decisions[selected.key] === 'skip'}
                onchange={() => setResolution(selected.key, 'skip')}
                disabled={saving}
              />
              <span>{$t("Ignore changes (don't import)")}</span>
            </label>
          </fieldset>

          <div class="import-preview-body">
            {#if selected.preview.type === 'text'}
              <InlineTextDiff
                current={selected.preview.current}
                incoming={selected.preview.incoming}
              />
            {:else if selected.preview.type === 'image'}
              <div class="import-image-pair">
                <figure>
                  <figcaption>{$t('Current')}</figcaption>
                  <img src={imageUrls[selected.key]?.current} alt={$t('Current')} />
                </figure>
                <figure>
                  <figcaption>{$t('Incoming')}</figcaption>
                  <img src={imageUrls[selected.key]?.incoming} alt={$t('Incoming')} />
                </figure>
              </div>
            {:else}
              <div class="import-binary">
                <p>{$t('Current')}: {formatBytes(selected.preview.currentSize)}</p>
                <p>{$t('Incoming')}: {formatBytes(selected.preview.incomingSize)}</p>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    {#if error}
      <p class="import-error" role="alert">{error}</p>
    {/if}

    <footer class="import-footer">
      <button type="button" class="btn btn-secondary" onclick={onCancel} disabled={saving}>
        {$t('Cancel')}
      </button>
      <button type="button" class="btn btn-primary" onclick={confirm} disabled={saving}>
        {saving ? $t('Importing…') : $t('Import')}
      </button>
    </footer>
  </div>
</div>

<style>
  .import-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal, 1000);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    background-color: rgb(0 0 0 / 0.5);
  }

  .import-dialog {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    inline-size: min(56rem, 100%);
    block-size: min(40rem, 90vh);
    padding: var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    background-color: var(--color-surface-primary);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-lg);
  }

  .import-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .import-header h2 {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 600;
  }

  .import-subtitle {
    margin: var(--space-1) 0 0;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .import-body {
    display: flex;
    gap: var(--space-4);
    flex: 1;
    min-block-size: 0;
  }

  .import-list {
    list-style: none;
    margin: 0;
    padding: 0;
    inline-size: 16rem;
    flex-shrink: 0;
    overflow: auto;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
  }

  .import-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    inline-size: 100%;
    padding: var(--space-2) var(--space-3);
    border: none;
    background: transparent;
    color: inherit;
    text-align: start;
    cursor: pointer;
    font-size: var(--text-sm);
    border-block-end: 1px solid var(--color-border-subtle, var(--color-border-default));
  }

  .import-list-item.selected {
    background-color: var(--color-bg-accent, var(--color-surface-secondary));
  }

  .import-list-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .import-list-badge {
    flex-shrink: 0;
    padding: 0 var(--space-2);
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    background-color: var(--color-surface-secondary);
  }

  .import-badge-overwrite {
    color: var(--color-error-text, var(--color-text-primary));
  }

  .import-preview {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    flex: 1;
    min-inline-size: 0;
  }

  .import-choice {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin: 0;
    padding: var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
  }

  .import-choice-legend {
    padding: 0 var(--space-2);
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    color: var(--color-text-secondary);
  }

  .import-radio {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    cursor: pointer;
  }

  .import-preview-body {
    flex: 1;
    min-block-size: 0;
    overflow: auto;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
  }

  .import-image-pair {
    display: flex;
    gap: var(--space-4);
    padding: var(--space-3);
  }

  .import-image-pair figure {
    margin: 0;
    flex: 1;
    text-align: center;
  }

  .import-image-pair figcaption {
    margin-block-end: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .import-image-pair img {
    max-inline-size: 100%;
    max-block-size: 16rem;
    object-fit: contain;
    border: 1px solid var(--color-border-subtle, var(--color-border-default));
  }

  .import-binary {
    padding: var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .import-error {
    margin: 0;
    color: var(--color-error-text, var(--color-text-primary));
    font-size: var(--text-sm);
  }

  .import-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }
</style>
