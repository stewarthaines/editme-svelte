<script lang="ts">
  import { t } from '../../i18n';
  import TextMetadataField from './fields/TextMetadataField.svelte';
  import SelectMetadataField from './fields/SelectMetadataField.svelte';
  import type { EPUBMetadata, IdentifierEntry } from '../../epub/opf-utils';
  import { IDENTIFIER_TYPE_OPTIONS } from '../../epub/identifier-types';

  interface Props {
    identifier: string;
    identifierType?: string;
    additionalIdentifiers?: IdentifierEntry[];
    saving?: boolean;
    advancedMode?: boolean;
    getFieldError?: (name: string) => string;
    onfieldChange?: (event: CustomEvent<{ field: string; value: any }>) => void;
    onfieldSave?: (event: CustomEvent<{ field: string; value: any }>) => void;
    onfieldFocus?: (event: CustomEvent<{ field: keyof EPUBMetadata | null }>) => void;
    ongenerateIdentifier?: (event: CustomEvent<void>) => void;
  }

  let {
    identifier,
    identifierType = '',
    additionalIdentifiers = [],
    saving = false,
    advancedMode = false,
    getFieldError = () => '',
    onfieldChange,
    onfieldSave,
    onfieldFocus,
    ongenerateIdentifier,
  }: Props = $props();

  // Advanced refinements show in advanced mode, or when already populated.
  const showType = $derived(advancedMode || !!identifierType?.trim());
  const showAdditional = $derived(advancedMode || additionalIdentifiers.length > 0);

  const typeOptions = $derived(
    IDENTIFIER_TYPE_OPTIONS.map(o => ({ value: o.value, label: $t(o.label) }))
  );

  const save = (field: string, value: any) =>
    onfieldSave?.(new CustomEvent('fieldSave', { detail: { field, value } }));
  const change = (field: string, value: any) =>
    onfieldChange?.(new CustomEvent('fieldChange', { detail: { field, value } }));
  const focus = (field: keyof EPUBMetadata) =>
    onfieldFocus?.(new CustomEvent('fieldFocus', { detail: { field } }));
  const generate = () => ongenerateIdentifier?.(new CustomEvent('generateIdentifier'));

  // Additional identifiers funnel through a single whole-array save.
  const saveList = (next: IdentifierEntry[]) => save('additionalIdentifiers', next);
  const updateEntry = (index: number, patch: Partial<IdentifierEntry>) =>
    saveList(
      additionalIdentifiers.map((entry, i) => (i === index ? { ...entry, ...patch } : entry))
    );
  const addEntry = () => saveList([...additionalIdentifiers, { value: '', type: '' }]);
  const removeEntry = (index: number) =>
    saveList(additionalIdentifiers.filter((_, i) => i !== index));
</script>

<div class="identifier-primary">
  <div class="identifier-field">
    <TextMetadataField
      id="identifier"
      label={$t('Identifier')}
      value={identifier || ''}
      placeholder={$t('Enter a unique identifier')}
      required={true}
      error={getFieldError('identifier')}
      onchange={e => change('identifier', e.value)}
      onblur={e => save('identifier', e.value)}
      onfocus={() => focus('identifier')}
    />
    <button type="button" class="btn btn-secondary" onclick={generate} disabled={saving}>
      {$t('Generate')}
    </button>
  </div>

  {#if showType}
    <SelectMetadataField
      id="identifierType"
      label={$t('Identifier type')}
      value={identifierType ?? ''}
      options={typeOptions}
      onblur={e => save('identifierType', e.value)}
      onfocus={() => focus('identifier')}
    />
  {/if}
</div>

{#each additionalIdentifiers as entry, index (index)}
  <div class="identifier-entry">
    <div class="identifier-entry-header">
      <span class="identifier-entry-label">{$t('Additional identifier')}</span>
      <button
        type="button"
        class="btn btn-icon"
        onclick={() => removeEntry(index)}
        disabled={saving}
        aria-label={$t('Remove')}
      >
        ×
      </button>
    </div>

    <TextMetadataField
      id="additional-identifier-{index}"
      value={entry.value}
      placeholder={$t('e.g. urn:isbn:9780000000001')}
      onblur={e => updateEntry(index, { value: e.value })}
    />
    <SelectMetadataField
      id="additional-identifier-type-{index}"
      label={$t('Identifier type')}
      value={entry.type ?? ''}
      options={typeOptions}
      onblur={e => updateEntry(index, { type: e.value })}
    />
  </div>
{/each}

{#if showAdditional}
  <button type="button" class="btn btn-secondary btn-sm" onclick={addEntry} disabled={saving}>
    {$t('Add another identifier')}
  </button>
{/if}

<style>
  .identifier-field {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
  }

  .identifier-field :global(.metadata-field) {
    flex: 1;
    margin-block-end: 0;
  }

  .identifier-primary {
    margin-block-end: 0.625rem;
  }

  .identifier-entry {
    margin-block-end: 0.5rem;
    padding: var(--space-2);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    background-color: var(--color-bg-primary);
  }

  .identifier-entry-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 0.25rem;
  }

  .identifier-entry-label {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-text-secondary);
  }
</style>
