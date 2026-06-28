<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '../../i18n';
  import { X } from 'phosphor-svelte';
  import { FileStorageAPI } from '../../storage/index.js';
  import { changeKey } from '../../track-changes/patchset-apply.js';
  import {
    buildReviewGroups,
    applySelectedHunks,
    type FilePatch,
    type ReviewGroup,
  } from '../../track-changes/hunks.js';
  import type { ChangeItem, ResolvedChange } from '../../track-changes/types.js';

  let {
    workspaceId,
    changes,
    onConfirm,
    onCancel,
  }: {
    workspaceId: string;
    changes: ChangeItem[];
    onConfirm: (resolved: ResolvedChange[]) => Promise<void> | void;
    onCancel: () => void;
  } = $props();

  type Row = {
    key: string;
    kind: ChangeItem['kind'];
    /** Chapter id or file path. */
    target: string;
    title: string;
    mediaType: string;
    label: string;
    current: string;
    patch: FilePatch;
    groups: ReviewGroup[];
    /** One flag per edit (group); all selected by default. */
    selected: boolean[];
  };

  let rows = $state<Row[]>([]);
  let selectedKey = $state('');
  let loading = $state(true);
  let saving = $state(false);
  let error = $state<string | null>(null);

  const selIndex = $derived(Math.max(0, rows.findIndex(r => r.key === selectedKey)));
  const selRow = $derived(rows[selIndex]);

  onMount(async () => {
    const storage = FileStorageAPI.getInstance();
    const built: Row[] = [];
    for (const change of changes) {
      const currentPath =
        change.kind === 'chapter-modify' ? `SOURCE/text/${change.id}.txt` : change.path;
      const incoming = change.kind === 'chapter-modify' ? change.newText : change.newContent;
      let current = '';
      try {
        current = await storage.readTextFile(workspaceId, currentPath);
      } catch {
        // No current file — diff against empty.
      }
      const { patch, groups } = buildReviewGroups(current, incoming);
      built.push({
        key: changeKey(change),
        kind: change.kind,
        target: change.kind === 'chapter-modify' ? change.id : change.path,
        title: change.kind === 'chapter-modify' ? change.title : '',
        mediaType: change.kind === 'file-modify' ? change.mediaType : '',
        label: change.kind === 'chapter-modify' ? change.title : change.path,
        current,
        patch,
        groups,
        selected: groups.map(() => true),
      });
    }
    rows = built;
    selectedKey = built[0]?.key ?? '';
    loading = false;
  });

  // Tri-state of a file's checkbox from its per-hunk selection.
  function fileState(row: Row): 'all' | 'none' | 'some' {
    if (row.selected.length === 0 || row.selected.every(s => !s)) return 'none';
    if (row.selected.every(Boolean)) return 'all';
    return 'some';
  }

  function selectedHunkCount(row: Row): number {
    return row.selected.filter(Boolean).length;
  }

  function setAllHunks(row: Row, value: boolean) {
    row.selected = row.selected.map(() => value);
  }

  // Toggle a change by clicking anywhere on its text — but not when the click is
  // the end of a text selection (so the diff stays selectable by mouse).
  function toggleGroup(index: number) {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;
    rows[selIndex].selected[index] = !rows[selIndex].selected[index];
  }

  // bind:checked can't express the indeterminate state, so set it imperatively.
  function triState(node: HTMLInputElement, state: 'all' | 'none' | 'some') {
    const apply = (s: 'all' | 'none' | 'some') => {
      node.checked = s === 'all';
      node.indeterminate = s === 'some';
    };
    apply(state);
    return { update: apply };
  }

  async function confirm() {
    if (saving) return;
    saving = true;
    error = null;
    try {
      const resolved: ResolvedChange[] = [];
      for (const row of rows) {
        if (!row.selected.some(Boolean)) continue;
        const content = applySelectedHunks(row.current, row.patch, row.selected);
        if (row.kind === 'chapter-modify') {
          resolved.push({ kind: 'chapter-modify', id: row.target, title: row.title, content });
        } else {
          resolved.push({ kind: 'file-modify', path: row.target, mediaType: row.mediaType, content });
        }
      }
      await onConfirm(resolved);
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
                  use:triState={fileState(row)}
                  onclick={e => e.stopPropagation()}
                  onchange={e => setAllHunks(row, (e.currentTarget as HTMLInputElement).checked)}
                  aria-label={$t('Accept all changes in {name}', { name: row.label })}
                />
                <span class="review-list-name">{row.label}</span>
                <span class="review-list-count">
                  {$t('{sel}/{total}', {
                    sel: selectedHunkCount(row),
                    total: row.selected.length,
                  })}
                </span>
              </button>
            </li>
          {/each}
        </ul>

        <div class="review-preview">
          {#if selRow}
            {#if selRow.groups.length === 0}
              <p class="review-loading">{$t('No differences.')}</p>
            {:else}
              {#each selRow.groups as group (group.index)}
                <div class="hunk">
                  <div class="hunk-check">
                    <input
                      type="checkbox"
                      bind:checked={rows[selIndex].selected[group.index]}
                      aria-label={$t('Accept this change')}
                    />
                  </div>
                  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
                  <div class="hunk-lines" onclick={() => toggleGroup(group.index)}>
                    {#each group.contextBefore as line, li (li)}
                      <div class="diff-line diff-context">
                        <span class="diff-sign" aria-hidden="true"> </span><span class="diff-text"
                          >{line || ' '}</span
                        >
                      </div>
                    {/each}
                    {#each group.changes as ch, ci (ci)}
                      <div class="diff-line diff-{ch.sign === '+' ? 'add' : 'remove'}">
                        <span class="diff-sign" aria-hidden="true">{ch.sign}</span><span
                          class="diff-text">{ch.text || ' '}</span
                        >
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            {/if}
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
    flex: 1;
  }

  .review-list-count {
    flex-shrink: 0;
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
  }

  .review-preview {
    flex: 1;
    min-inline-size: 0;
    /* min-block-size:0 lets this flex child shrink below content height so the
       overflow can actually scroll instead of clipping at the dialog edge. */
    min-block-size: 0;
    overflow: auto;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    padding: var(--space-2);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .hunk {
    /* Keep natural height so the preview scrolls instead of compressing the
       hunks to fit (flex children shrink by default in the column layout). */
    flex-shrink: 0;
    display: flex;
    align-items: stretch;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  /* Left column: the change's accept checkbox. */
  .hunk-check {
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
    padding: var(--space-2);
    background-color: var(--color-surface-secondary);
    border-inline-end: 1px solid var(--color-border-default);
  }

  .hunk-lines {
    flex: 1;
    min-inline-size: 0;
    padding-block: var(--space-1);
    font-family: var(--font-mono, monospace);
    font-size: var(--text-xs);
    line-height: 1.5;
    /* A plain click toggles the change; drag-select still works (see toggleGroup). */
    cursor: pointer;
  }

  .diff-line {
    display: flex;
    gap: var(--space-2);
    padding-inline: var(--space-2);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .diff-sign {
    flex-shrink: 0;
    inline-size: 1ch;
    color: var(--color-text-tertiary);
    user-select: none;
  }

  .diff-text {
    flex: 1;
  }

  .diff-add {
    background-color: var(--color-success-bg, rgb(0 128 0 / 0.12));
    color: var(--color-success-text, inherit);
  }

  .diff-remove {
    background-color: var(--color-error-bg, rgb(200 0 0 / 0.12));
    color: var(--color-error-text, inherit);
  }

  .diff-context {
    color: var(--color-text-secondary);
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
