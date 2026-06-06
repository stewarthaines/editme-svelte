<script lang="ts">
  import { t } from '../../i18n';
  import TextMetadataField from './fields/TextMetadataField.svelte';
  import SelectMetadataField from './fields/SelectMetadataField.svelte';
  import type { EPUBMetadata, TitleEntry } from '../../epub/opf-utils';

  interface Props {
    title: string;
    titleFileAs?: string;
    additionalTitles?: TitleEntry[];
    saving?: boolean;
    advancedMode?: boolean;
    getFieldError?: (name: string) => string;
    onfieldChange?: (event: CustomEvent<{ field: string; value: any }>) => void;
    onfieldSave?: (event: CustomEvent<{ field: string; value: any }>) => void;
    onfieldFocus?: (event: CustomEvent<{ field: keyof EPUBMetadata | null }>) => void;
  }

  let {
    title,
    titleFileAs = '',
    additionalTitles = [],
    saving = false,
    advancedMode = false,
    getFieldError = () => '',
    onfieldChange,
    onfieldSave,
    onfieldFocus,
  }: Props = $props();

  // Advanced refinements show in advanced mode, or whenever they already carry a
  // value (so populated metadata is never hidden).
  const showFileAs = $derived(advancedMode || !!titleFileAs?.trim());
  const showAdditional = $derived(advancedMode || additionalTitles.length > 0);

  // Additional titles use the EPUB title-type vocabulary minus "main" (that is
  // the primary title above).
  const typeOptions = [
    { value: 'subtitle', label: $t('Subtitle') },
    { value: 'short', label: $t('Short') },
    { value: 'collection', label: $t('Collection') },
    { value: 'edition', label: $t('Edition') },
    { value: 'expanded', label: $t('Expanded') },
  ];

  const save = (field: string, value: any) =>
    onfieldSave?.(new CustomEvent('fieldSave', { detail: { field, value } }));
  const change = (field: string, value: any) =>
    onfieldChange?.(new CustomEvent('fieldChange', { detail: { field, value } }));
  const focus = (field: keyof EPUBMetadata) =>
    onfieldFocus?.(new CustomEvent('fieldFocus', { detail: { field } }));

  // All additional-title edits funnel through a single whole-array save.
  const saveTitles = (next: TitleEntry[]) => save('additionalTitles', next);
  const updateEntry = (index: number, patch: Partial<TitleEntry>) =>
    saveTitles(additionalTitles.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  const addEntry = () => saveTitles([...additionalTitles, { value: '', type: 'subtitle' }]);
  const removeEntry = (index: number) => saveTitles(additionalTitles.filter((_, i) => i !== index));
</script>

<TextMetadataField
  id="title"
  label={$t('Title')}
  value={title || ''}
  placeholder={$t('Enter book title')}
  required={true}
  error={getFieldError('title')}
  onchange={e => change('title', e.value)}
  onblur={e => save('title', e.value)}
  onfocus={() => focus('title')}
/>

{#if showFileAs}
  <TextMetadataField
    id="titleFileAs"
    label={$t('Sort as')}
    value={titleFileAs || ''}
    placeholder={$t('e.g. Hobbit, The')}
    error={getFieldError('titleFileAs')}
    onchange={e => change('titleFileAs', e.value)}
    onblur={e => save('titleFileAs', e.value)}
    onfocus={() => focus('title')}
  />
{/if}

{#each additionalTitles as entry, index (index)}
  <div class="title-entry">
    <div class="title-entry-header">
      <span class="title-entry-label">{$t('Additional title')}</span>
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
      id="additional-title-{index}"
      value={entry.value}
      placeholder={$t('Enter title')}
      onblur={e => updateEntry(index, { value: e.value })}
    />
    <SelectMetadataField
      id="additional-title-type-{index}"
      label={$t('Type')}
      value={entry.type ?? 'subtitle'}
      options={typeOptions}
      onblur={e => updateEntry(index, { type: e.value as TitleEntry['type'] })}
    />
    <TextMetadataField
      id="additional-title-fileas-{index}"
      label={$t('Sort as')}
      value={entry.fileAs ?? ''}
      onblur={e => updateEntry(index, { fileAs: e.value })}
    />
  </div>
{/each}

{#if showAdditional}
  <button type="button" class="btn btn-secondary" onclick={addEntry} disabled={saving}>
    {$t('Add another title')}
  </button>
{/if}

<style>
  .title-entry {
    margin-block-end: 0.5rem;
    padding: var(--space-2);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    background-color: var(--color-bg-primary);
  }

  .title-entry-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 0.25rem;
  }

  .title-entry-label {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-text-secondary);
  }
</style>
