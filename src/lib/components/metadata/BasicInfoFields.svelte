<script>
  import { createEventDispatcher } from 'svelte';
  import { t } from '$lib/i18n';
  import TextMetadataField from './fields/TextMetadataField.svelte';
  import SelectMetadataField from './fields/SelectMetadataField.svelte';
  import TextareaMetadataField from './fields/TextareaMetadataField.svelte';

  const dispatch = createEventDispatcher();

  export let metadata = {};
  export let validationErrors = [];
  export let saving = false;

  // Language options - simplified for now
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'de', label: 'Deutsch' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'it', label: 'Italiano' },
    { value: 'pt', label: 'Português' },
    { value: 'ja', label: '日本語' },
    { value: 'zh', label: '中文' },
    { value: 'ar', label: 'العربية' },
    { value: 'he', label: 'עברית' },
    { value: 'ka', label: 'ქართული' }
  ];

  // Rendition options
  const layoutOptions = [
    { value: 'reflowable', label: $t('Reflowable') },
    { value: 'pre-paginated', label: $t('Pre-paginated') }
  ];

  const progressionOptions = [
    { value: 'default', label: $t('Default') },
    { value: 'ltr', label: $t('Left to Right') },
    { value: 'rtl', label: $t('Right to Left') }
  ];

  const orientationOptions = [
    { value: 'auto', label: $t('Auto') },
    { value: 'landscape', label: $t('Landscape') },
    { value: 'portrait', label: $t('Portrait') }
  ];

  const spreadOptions = [
    { value: 'auto', label: $t('Auto') },
    { value: 'none', label: $t('None') },
    { value: 'both', label: $t('Both') }
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

  const generateIdentifier = () => {
    dispatch('generateIdentifier');
  };
</script>

<div class="basic-info-fields" tabindex="-1">
  <div class="form-columns" tabindex="-1">
    <div class="column" tabindex="-1">
      <fieldset class="field-group" tabindex="-1">
        <legend class="group-title" tabindex="-1">{$t('Essential Information')}</legend>
    
    <TextMetadataField
      id="title"
      label={$t('Title')}
      value={metadata.title || ''}
      placeholder={$t('Enter book title')}
      required={true}
      error={getFieldError('title')}
      on:change={(e) => handleFieldChange('title', e.detail.value)}
      on:blur={(e) => handleFieldSave('title', e.detail.value)}
    />

    <SelectMetadataField
      id="language"
      label={$t('Language')}
      value={metadata.language || ''}
      options={languageOptions}
      placeholder={$t('Select language')}
      required={true}
      error={getFieldError('language')}
      on:change={(e) => handleFieldChange('language', e.detail.value)}
      on:blur={(e) => handleFieldSave('language', e.detail.value)}
    />

        <div class="identifier-field">
          <TextMetadataField
            id="identifier"
            label={$t('Identifier')}
            value={metadata.identifier || ''}
            placeholder={$t('Enter a unique identifier')}
            required={true}
            error={getFieldError('identifier')}
            on:change={(e) => handleFieldChange('identifier', e.detail.value)}
            on:blur={(e) => handleFieldSave('identifier', e.detail.value)}
          />
          <button
            type="button"
            class="generate-button"
            on:click={generateIdentifier}
            disabled={saving}
          >
            {$t('Generate')}
          </button>
        </div>
      </fieldset>

      <fieldset class="field-group">
        <legend class="group-title" tabindex="-1">{$t('Authors')}</legend>
    
    <div class="array-field">
      {#each (metadata.creator || []) as author, index}
        <div class="array-item">
          <TextMetadataField
            id="creator-{index}"
            value={author}
            placeholder={$t('Author name')}
            error={getFieldError(`creator[${index}]`)}
            on:change={(e) => updateArrayItem('creator', index, e.detail.value)}
            on:blur={() => handleFieldSave('creator', metadata.creator)}
          />
          <button
            type="button"
            class="remove-button"
            on:click={() => handleArrayRemove('creator', index)}
            disabled={saving}
            aria-label={$t('Remove author')}
          >
            ×
          </button>
        </div>
      {/each}
      
      <button
        type="button"
        class="add-button"
        on:click={() => handleArrayAdd('creator')}
        disabled={saving}
      >
        {$t('Add Author')}
      </button>
        </div>
      </fieldset>
    </div>

    <div class="column">
      <fieldset class="field-group">
        <legend class="group-title" tabindex="-1">{$t('Description')}</legend>
        
        <TextareaMetadataField
          id="description"
          label={$t('Description')}
          value={metadata.description || ''}
          placeholder={$t('Enter book description')}
          error={getFieldError('description')}
          rows={3}
          on:change={(e) => handleFieldChange('description', e.detail.value)}
          on:blur={(e) => handleFieldSave('description', e.detail.value)}
        />
      </fieldset>

      <fieldset class="field-group">
        <legend class="group-title" tabindex="-1">{$t('Rendition Properties')}</legend>
    
        <SelectMetadataField
          id="renditionLayout"
          label={$t('Layout')}
          value={metadata.renditionLayout || 'reflowable'}
          options={layoutOptions}
          error={getFieldError('renditionLayout')}
          on:change={(e) => handleFieldChange('renditionLayout', e.detail.value)}
          on:blur={(e) => handleFieldSave('renditionLayout', e.detail.value)}
        />

        <SelectMetadataField
          id="pageProgressionDirection"
          label={$t('Page Progression')}
          value={metadata.pageProgressionDirection || 'default'}
          options={progressionOptions}
          error={getFieldError('pageProgressionDirection')}
          on:change={(e) => handleFieldChange('pageProgressionDirection', e.detail.value)}
          on:blur={(e) => handleFieldSave('pageProgressionDirection', e.detail.value)}
        />

        <SelectMetadataField
          id="renditionOrientation"
          label={$t('Orientation')}
          value={metadata.renditionOrientation || 'auto'}
          options={orientationOptions}
          error={getFieldError('renditionOrientation')}
          on:change={(e) => handleFieldChange('renditionOrientation', e.detail.value)}
          on:blur={(e) => handleFieldSave('renditionOrientation', e.detail.value)}
        />

        <SelectMetadataField
          id="renditionSpread"
          label={$t('Spread')}
          value={metadata.renditionSpread || 'auto'}
          options={spreadOptions}
          error={getFieldError('renditionSpread')}
          on:change={(e) => handleFieldChange('renditionSpread', e.detail.value)}
          on:blur={(e) => handleFieldSave('renditionSpread', e.detail.value)}
        />
      </fieldset>
    </div>
  </div>
</div>

<style>
  .basic-info-fields {
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

  .identifier-field {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
  }

  .identifier-field :global(.metadata-field) {
    flex: 1;
    margin-block-end: 0;
  }

  .generate-button {
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    background-color: var(--color-surface-primary);
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    height: fit-content;
  }

  .generate-button:hover:not(:disabled) {
    background-color: var(--color-surface-hover);
    border-color: var(--color-border-hover);
  }

  .generate-button:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-focus-ring);
  }

  .generate-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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