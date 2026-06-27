<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '../../i18n';
  import { X } from 'phosphor-svelte';
  import InlineTextDiff from '../import/InlineTextDiff.svelte';
  import { FileStorageAPI } from '../../storage/index.js';
  import { changeKey } from '../../track-changes/patchset-apply.js';
  import type { ChangeItem } from '../../track-changes/types.js';

  let {
    workspaceId,
    changes,
    onConfirm,
    onCancel,
  }: {
    workspaceId: string;
    changes: ChangeItem[];
    onConfirm: (acceptedKeys: string[]) => Promise<void> | void;
    onCancel: () => void;
  } = $props();

  type Row = { key: string; label: string; current: string; incoming: string; accepted: boolean };

  let rows = $state<Row[]>([]);
  let selectedKey = $state('');
  let loading = $state(true);
  let saving = $state(false);
  let error = $state<string | null>(null);

  const selected = $derived(rows.find(r => r.key === selectedKey) ?? rows[0]);

  onMount(async () => {
    const storage = FileStorageAPI.getInstance();
    const built: Row[] = [];
    for (const change of changes) {
      const currentPath =
        change.kind === 'chapter-modify' ? `SOURCE/text/${change.id}.txt` : change.path;
      const incoming = change.kind === 'chapter-modify' ? change.newText : change.newContent;
      const label = change.kind === 'chapter-modify' ? change.title : change.path;
      let current = '';
      try {
        current = await storage.readTextFile(workspaceId, currentPath);
      } catch {
        // No current file (diff against empty).
      }
      built.push({ key: changeKey(change), label, current, incoming, accepted: true });
    }
    rows = built;
    selectedKey = built[0]?.key ?? '';
    loading = false;
  });

  async function confirm() {
    if (saving) return;
    saving = true;
    error = null;
    try {
      await onConfirm(rows.filter(r => r.accepted).map(r => r.key));
    } catch (e) {
      error = e instanceof Error ? e.message : $t('Failed to apply changes');
      saving = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onCancel();
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="review-backdrop" onclick={onCancel} role="presentation">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="review-dialog"
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby="patchset-review-title"
    onclick={event => event.stopPropagation()}
    onkeydown={handleKeydown}
  >
    <header class="review-header">
      <h2 id="patchset-review-title">{$t('Review changes')}</h2>
      <button type="button" class="btn btn-icon" onclick={onCancel} aria-label={$t('Close')}
        ><X size={16} aria-hidden="true" /></button
      >
    </header>

    {#if loading}
      <p class="review-loading">{$t('Loading…')}</p>
    {:else if rows.length === 0}
      <p class="review-loading">{$t('This patchset has no changes.')}</p>
    {:else}
      <div class="review-body">
        <ul class="review-list" aria-label={$t('Changed files')}>
          {#each rows as row (row.key)}
            <li>
              <button
                type="button"
                class="review-list-item"
                class:selected={row.key === selectedKey}
                onclick={() => (selectedKey = row.key)}
              >
                <input
                  type="checkbox"
                  bind:checked={row.accepted}
                  onclick={e => e.stopPropagation()}
                  aria-label={$t('Accept {name}', { name: row.label })}
                />
                <span class="review-list-name">{row.label}</span>
              </button>
            </li>
          {/each}
        </ul>
        <div class="review-preview">
          {#if selected}
            <InlineTextDiff current={selected.current} incoming={selected.incoming} />
          {/if}
        </div>
      </div>
    {/if}

    {#if error}
      <p class="review-error" role="alert">{error}</p>
    {/if}

    <footer class="review-footer">
      <button type="button" class="btn btn-secondary" onclick={onCancel} disabled={saving}>
        {$t('Cancel')}
      </button>
      <button
        type="button"
        class="btn btn-primary"
        onclick={confirm}
        disabled={saving || loading || rows.length === 0}
      >
        {saving ? $t('Applying…') : $t('Apply accepted')}
      </button>
    </footer>
  </div>
</div>

<style>
  .review-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal, 1000);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    background-color: rgb(0 0 0 / 0.5);
  }

  .review-dialog {
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

  .review-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .review-header h2 {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 600;
  }

  .review-body {
    display: flex;
    gap: var(--space-4);
    flex: 1;
    min-block-size: 0;
  }

  .review-list {
    list-style: none;
    margin: 0;
    padding: 0;
    inline-size: 16rem;
    flex-shrink: 0;
    overflow: auto;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
  }

  .review-list-item {
    display: flex;
    align-items: center;
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

  .review-list-item.selected {
    background-color: var(--color-bg-accent, var(--color-surface-secondary));
  }

  .review-list-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .review-preview {
    flex: 1;
    min-inline-size: 0;
    overflow: auto;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
  }

  .review-loading {
    flex: 1;
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
  }

  .review-error {
    margin: 0;
    color: var(--color-error-text, var(--color-text-primary));
    font-size: var(--text-sm);
  }

  .review-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }
</style>
