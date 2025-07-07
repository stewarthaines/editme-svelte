<script>
  import { createEventDispatcher } from 'svelte';
  import { t } from '$lib/i18n';
  import TextMetadataField from './fields/TextMetadataField.svelte';
  import SelectMetadataField from './fields/SelectMetadataField.svelte';
  import TextareaMetadataField from './fields/TextareaMetadataField.svelte';
  import DateMetadataField from './fields/DateMetadataField.svelte';

  const dispatch = createEventDispatcher();

  export let metadata = {};
  export let validationErrors = [];
  export let saving = false;

  // Content type options
  const typeOptions = [
    { value: '', label: $t('Select content type') },
    { value: 'fiction', label: $t('Fiction') },
    { value: 'non-fiction', label: $t('Non-fiction') },
    { value: 'poetry', label: $t('Poetry') },
    { value: 'drama', label: $t('Drama') },
    { value: 'biography', label: $t('Biography') },
    { value: 'textbook', label: $t('Textbook') },
    { value: 'reference', label: $t('Reference') },
    { value: 'children', label: $t('Children') }
  ];

  const getFieldError = (fieldName) => {
    const error = validationErrors.find(err => err.field === fieldName);
    return error ? error.message : '';
  };

  const handleFieldChange = (field, value) => {
    dispatch('fieldChange', { field, value });
  };

  const handleFieldSave = (field, value) => {
    dispatch('fieldSave', { field, value });
  };

  const handleArrayAdd = (field) => {
    dispatch('arrayAdd', { field });
  };

  const handleArrayRemove = (field, index) => {
    dispatch('arrayRemove', { field, index });
  };

  const updateArrayItem = (field, index, value) => {
    const currentArray = metadata[field] || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    handleFieldChange(field, newArray);
  };
</script>

<div class="advanced-fields">
  <div class="form-columns">
    <div class="column">
      <fieldset class="field-group">
        <legend class="group-title" tabindex="-1">{$t('Publication')}</legend>
    
        <TextMetadataField
          id="publisher"
          label={$t('Publisher')}
          value={metadata.publisher || ''}
          placeholder={$t('Enter publisher name')}
          error={getFieldError('publisher')}
          on:change={(e) => handleFieldChange('publisher', e.detail.value)}
          on:blur={(e) => handleFieldSave('publisher', e.detail.value)}
        />

        <DateMetadataField
          id="date"
          label={$t('Publication Date')}
          value={metadata.date || ''}
          error={getFieldError('date')}
          on:change={(e) => handleFieldChange('date', e.detail.value)}
          on:blur={(e) => handleFieldSave('date', e.detail.value)}
        />

        <TextMetadataField
          id="rights"
          label={$t('Rights')}
          value={metadata.rights || ''}
          placeholder={$t('Enter copyright information')}
          error={getFieldError('rights')}
          on:change={(e) => handleFieldChange('rights', e.detail.value)}
          on:blur={(e) => handleFieldSave('rights', e.detail.value)}
        />

        <SelectMetadataField
          id="type"
          label={$t('Content Type')}
          value={metadata.type || ''}
          options={typeOptions}
          placeholder={$t('Select content type')}
          error={getFieldError('type')}
          on:change={(e) => handleFieldChange('type', e.detail.value)}
          on:blur={(e) => handleFieldSave('type', e.detail.value)}
        />
      </fieldset>

      <fieldset class="field-group">
        <legend class="group-title" tabindex="-1">{$t('Additional Information')}</legend>
        
        <TextMetadataField
          id="source"
          label={$t('Source')}
          value={metadata.source || ''}
          placeholder={$t('Enter source information')}
          error={getFieldError('source')}
          on:change={(e) => handleFieldChange('source', e.detail.value)}
          on:blur={(e) => handleFieldSave('source', e.detail.value)}
        />

        <TextMetadataField
          id="relation"
          label={$t('Relation')}
          value={metadata.relation || ''}
          placeholder={$t('Enter related work information')}
          error={getFieldError('relation')}
          on:change={(e) => handleFieldChange('relation', e.detail.value)}
          on:blur={(e) => handleFieldSave('relation', e.detail.value)}
        />

        <TextMetadataField
          id="coverage"
          label={$t('Coverage')}
          value={metadata.coverage || ''}
          placeholder={$t('Enter spatial or temporal coverage')}
          error={getFieldError('coverage')}
          on:change={(e) => handleFieldChange('coverage', e.detail.value)}
          on:blur={(e) => handleFieldSave('coverage', e.detail.value)}
        />

        <TextMetadataField
          id="format"
          label={$t('Format')}
          value={metadata.format || ''}
          placeholder={$t('Enter format information')}
          error={getFieldError('format')}
          on:change={(e) => handleFieldChange('format', e.detail.value)}
          on:blur={(e) => handleFieldSave('format', e.detail.value)}
        />
      </fieldset>
    </div>

    <div class="column">
      <fieldset class="field-group">
        <legend class="group-title" tabindex="-1">{$t('Subjects')}</legend>
    
    <div class="array-field">
      {#each (metadata.subject || []) as subject, index}
        <div class="array-item">
          <TextMetadataField
            id="subject-{index}"
            value={subject}
            placeholder={$t('Subject or keyword')}
            error={getFieldError(`subject[${index}]`)}
            on:change={(e) => updateArrayItem('subject', index, e.detail.value)}
            on:blur={() => handleFieldSave('subject', metadata.subject)}
          />
          <button
            type="button"
            class="remove-button"
            on:click={() => handleArrayRemove('subject', index)}
            disabled={saving}
            aria-label={$t('Remove subject')}
          >
            ×
          </button>
        </div>
      {/each}
      
      <button
        type="button"
        class="add-button"
        on:click={() => handleArrayAdd('subject')}
        disabled={saving}
      >
        {$t('Add Subject')}
      </button>
        </div>
      </fieldset>

      <fieldset class="field-group">
        <legend class="group-title" tabindex="-1">{$t('Contributors')}</legend>
    
    <div class="array-field">
      {#each (metadata.contributor || []) as contributor, index}
        <div class="array-item">
          <TextMetadataField
            id="contributor-{index}"
            value={contributor}
            placeholder={$t('Contributor name')}
            error={getFieldError(`contributor[${index}]`)}
            on:change={(e) => updateArrayItem('contributor', index, e.detail.value)}
            on:blur={() => handleFieldSave('contributor', metadata.contributor)}
          />
          <button
            type="button"
            class="remove-button"
            on:click={() => handleArrayRemove('contributor', index)}
            disabled={saving}
            aria-label={$t('Remove contributor')}
          >
            ×
          </button>
        </div>
      {/each}
      
      <button
        type="button"
        class="add-button"
        on:click={() => handleArrayAdd('contributor')}
        disabled={saving}
      >
        {$t('Add Contributor')}
      </button>
        </div>
      </fieldset>
    </div>
  </div>
</div>

<style>
  .advanced-fields {
    padding: 1.5rem;
  }

  .form-columns {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  @media (min-width: 768px) {
    .form-columns {
      grid-template-columns: 1fr 1fr;
    }
  }

  .column {
    min-width: 0; /* Allow flex item to shrink */
  }

  .field-group {
    margin-block-end: 2rem;
    background-color: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    padding: 1.5rem;
  }

  .field-group:last-child {
    margin-block-end: 0;
  }

  .group-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary);
    padding: 0 0.75rem;
    margin-block-end: 1rem;
  }

  .array-field {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .array-item {
    display: flex;
    gap: 0;
    align-items: flex-start;
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    padding: 0;
    overflow: hidden;
    position: relative;
  }

  .array-item :global(.metadata-field) {
    flex: 1;
    margin-block-end: 0;
  }

  .array-item :global(.field-input) {
    border: none;
    background-color: transparent;
    border-radius: 0;
  }

  .array-item :global(.field-input:focus) {
    border: none;
    box-shadow: inset 0 0 0 2px var(--color-focus);
  }

  .array-item :global(.field-input.error:focus) {
    box-shadow: inset 0 0 0 2px var(--color-error);
  }

  .array-item :global(.field-input.needs-attention:focus) {
    box-shadow: inset 0 0 0 2px #228B22;
  }

  .remove-button {
    width: 2.5rem;
    height: calc(1rem * 1.5 + 0.75rem * 2 + 2px); /* Match input total height: line-height + padding + border */
    border: none;
    border-left: 1px solid var(--color-border-default);
    border-radius: 0;
    background-color: var(--color-bg-secondary);
    color: var(--color-error);
    font-size: 1.25rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-block-start: 0;
    flex-shrink: 0;
  }

  .remove-button:hover:not(:disabled) {
    background-color: var(--color-error-surface);
    border-left-color: var(--color-error);
  }

  .remove-button:focus {
    outline: none;
    background-color: var(--color-error-surface);
    box-shadow: inset 0 0 0 2px var(--color-error);
  }

  .remove-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .add-button {
    padding: 0.75rem 1rem;
    border: 1px dashed var(--color-border-default);
    border-radius: var(--radius-sm);
    background-color: transparent;
    color: var(--color-primary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .add-button:hover:not(:disabled) {
    background-color: var(--color-primary-surface);
    border-color: var(--color-primary);
    border-style: solid;
  }

  .add-button:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-focus-ring);
    border-style: solid;
  }

  .add-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>