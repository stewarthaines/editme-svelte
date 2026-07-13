<script lang="ts">
  import { t } from '../../i18n';
  import {
    customMetaCatalog,
    catalogEntryLabel,
  } from '../../metadata/custom-meta-catalog.svelte.js';
  import type { CatalogEntry } from '../../metadata/custom-meta-catalog.svelte.js';
  import { RESERVED_PREFIXES } from '../../epub/opf-utils';
  import type { CustomMetaSyntax } from '../../epub/opf-utils';
  import { X } from 'phosphor-svelte';

  const label = (entry: CatalogEntry): string => catalogEntryLabel(entry, $t);

  const syntaxLabel = (syntax: CustomMetaSyntax) =>
    syntax === 'property' ? $t('EPUB 3 property') : $t('EPUB 2 name');

  const entryDomId = (entry: CatalogEntry) =>
    `catalog-${entry.syntax}-${entry.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  // Group entries under their vendor sub-heading: ungrouped entries (the
  // always-on builtins and user adoptions) first, then groups in the order
  // they first appear in the catalog.
  let grouped = $derived.by(() => {
    const buckets: { group?: string; entries: CatalogEntry[] }[] = [];
    for (const entry of customMetaCatalog.entries) {
      const bucket = buckets.find(b => b.group === entry.group);
      if (bucket) bucket.entries.push(entry);
      else buckets.push({ group: entry.group, entries: [entry] });
    }
    return buckets.sort((a, b) => Number(!!a.group) - Number(!!b.group));
  });

  // --- "Add field" form: declare a field before any book carries it ----------
  let newKey = $state('');
  let newSyntax = $state<CustomMetaSyntax>('property');
  let newValueType = $state<'boolean' | 'text'>('text');
  let newPrefixUri = $state('');
  let addError = $state<string | null>(null);

  // A property key under an undeclared, non-reserved prefix is the one case
  // that needs a prefix URI to write valid EPUB 3 — only then show the input.
  const newKeyPrefix = $derived.by(() => {
    const trimmed = newKey.trim();
    const colon = trimmed.indexOf(':');
    return colon > 0 ? trimmed.slice(0, colon) : null;
  });
  const needsPrefixUri = $derived(
    newSyntax === 'property' && !!newKeyPrefix && !RESERVED_PREFIXES.has(newKeyPrefix)
  );

  const addField = () => {
    const key = newKey.trim();
    if (!key) return;
    if (/\s/.test(key)) {
      addError = $t('Key must not contain spaces');
      return;
    }
    const result = customMetaCatalog.addUserEntry({
      key,
      syntax: newSyntax,
      valueType: newValueType,
      prefixUri: needsPrefixUri ? newPrefixUri : undefined,
    });
    if (result === 'exists') {
      addError = $t('Already in the catalog');
      return;
    }
    newKey = '';
    newPrefixUri = '';
    addError = null;
  };
</script>

<p class="setting-description">
  {$t(
    'Recognized fields are offered on every book you edit. The catalog is stored in this browser and does not travel with your EPUBs.'
  )}
</p>

{#each grouped as bucket (bucket.group ?? '')}
  {#if bucket.group}
    <p class="group-heading">{$t(bucket.group)}</p>
  {/if}
  {#each bucket.entries as entry (`${entry.syntax}:${entry.key}`)}
    <div class="catalog-entry">
      <div class="catalog-entry-header">
        <label class="setting-label">
          <input
            type="checkbox"
            checked={entry.enabled}
            onchange={e =>
              customMetaCatalog.setEnabled(entry.key, entry.syntax, e.currentTarget.checked)}
          />
          <span class="setting-text">{label(entry)}</span>
        </label>
        {#if entry.source === 'builtin'}
          <span class="builtin-tag">{$t('Built-in')}</span>
        {:else}
          <button
            type="button"
            class="btn btn-icon btn-icon-danger"
            onclick={() => customMetaCatalog.remove(entry.key, entry.syntax)}
            aria-label={$t('Remove')}
          >
            <X size={14} aria-hidden="true" />
          </button>
        {/if}
      </div>

      <div class="catalog-entry-detail">
        <code class="catalog-key">{entry.key}</code>
        <span class="syntax-badge">{syntaxLabel(entry.syntax)}</span>
        {#if entry.options}
          <span class="options-hint">{entry.options.join(' · ')}</span>
        {/if}
      </div>

      {#if entry.source === 'user'}
        <div class="catalog-entry-controls">
          <label class="control-field control-field-grow">
            <span class="control-label">{$t('Label')}</span>
            <input
              id="{entryDomId(entry)}-label"
              type="text"
              value={entry.label ?? ''}
              placeholder={entry.key}
              onblur={e =>
                customMetaCatalog.setLabel(entry.key, entry.syntax, e.currentTarget.value)}
            />
          </label>
          <label class="control-field">
            <span class="control-label">{$t('Value type')}</span>
            <select
              id="{entryDomId(entry)}-type"
              value={entry.valueType}
              onchange={e =>
                customMetaCatalog.setValueType(
                  entry.key,
                  entry.syntax,
                  e.currentTarget.value as 'boolean' | 'text'
                )}
            >
              <option value="text">{$t('Text')}</option>
              <option value="boolean">{$t('Checkbox')}</option>
            </select>
          </label>
          {#if entry.syntax === 'property'}
            <label class="control-field control-field-grow">
              <span class="control-label">{$t('Prefix URI')}</span>
              <input
                id="{entryDomId(entry)}-prefix"
                type="text"
                value={entry.prefixUri ?? ''}
                placeholder="https://…"
                onblur={e =>
                  customMetaCatalog.setPrefixUri(entry.key, entry.syntax, e.currentTarget.value)}
              />
            </label>
          {/if}
        </div>
      {/if}
    </div>
  {/each}
{/each}

<div class="add-field">
  <div class="catalog-entry-controls">
    <label class="control-field control-field-grow">
      <span class="control-label">{$t('Key')}</span>
      <input
        id="catalog-add-key"
        type="text"
        class="key-input"
        bind:value={newKey}
        placeholder="calibre:series"
        onkeydown={e => {
          if (e.key === 'Enter') addField();
        }}
        oninput={() => (addError = null)}
      />
    </label>
    <label class="control-field">
      <span class="control-label">{$t('Syntax')}</span>
      <select id="catalog-add-syntax" bind:value={newSyntax}>
        <option value="property">{$t('EPUB 3 property')}</option>
        <option value="name">{$t('EPUB 2 name')}</option>
      </select>
    </label>
    <label class="control-field">
      <span class="control-label">{$t('Value type')}</span>
      <select id="catalog-add-type" bind:value={newValueType}>
        <option value="text">{$t('Text')}</option>
        <option value="boolean">{$t('Checkbox')}</option>
      </select>
    </label>
    {#if needsPrefixUri}
      <label class="control-field control-field-grow">
        <span class="control-label">{$t('Prefix URI')}</span>
        <input
          id="catalog-add-prefix"
          type="text"
          bind:value={newPrefixUri}
          placeholder="https://…"
        />
      </label>
    {/if}
    <button type="button" class="btn add-button" onclick={addField} disabled={!newKey.trim()}>
      {$t('Add')}
    </button>
  </div>
  {#if addError}
    <p class="add-error">{addError}</p>
  {/if}
</div>

<style>
  .setting-description {
    margin: 0 0 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
  }

  .group-heading {
    margin: 0.75rem 0 0.375rem;
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-text-secondary);
  }

  .options-hint {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
    overflow-wrap: anywhere;
  }

  .catalog-entry {
    padding: var(--space-2);
    margin-block-end: 0.5rem;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    background-color: var(--color-bg-primary);
  }

  .catalog-entry-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .setting-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text-primary);
    cursor: pointer;
    min-width: 0;
  }

  .setting-label input {
    flex: none;
    cursor: pointer;
  }

  .builtin-tag {
    flex: none;
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    padding: 0 0.375rem;
    white-space: nowrap;
  }

  .catalog-entry-detail {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-block-start: 0.25rem;
  }

  .catalog-key {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    overflow-wrap: anywhere;
  }

  .syntax-badge {
    flex: none;
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    padding: 0 0.375rem;
    white-space: nowrap;
  }

  .catalog-entry-controls {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    margin-block-start: 0.5rem;
  }

  .control-field {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: 0.8125rem;
  }

  .control-field-grow {
    flex: 1;
    min-width: 0;
  }

  .control-label {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .control-field select,
  .control-field input {
    padding: 0.25rem 0.375rem;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
    width: 100%;
  }

  .add-field {
    padding: var(--space-2);
    margin-block-start: 0.75rem;
    border: 1px dashed var(--color-border-default);
    border-radius: var(--radius-sm);
  }

  .add-field .catalog-entry-controls {
    margin-block-start: 0;
    flex-wrap: wrap;
  }

  .key-input {
    font-family: var(--font-mono, monospace);
  }

  .add-button {
    flex: none;
  }

  .add-error {
    margin: 0.375rem 0 0;
    font-size: var(--text-xs);
    color: var(--color-status-error);
  }
</style>
