<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { t } from '../../../i18n';

  const dispatch = createEventDispatcher();

  export let value = '';
  export let placeholder = '';
  export let required = false;
  export let disabled = false;
  export let error = '';
  export let label = '';
  export let id = '';
  export let rows = 4;

  // Check if field needs attention (required but empty)
  $: needsAttention = required && (!value || value.trim() === '');

  const handleInput = (event: Event) => {
    dispatch('change', { value: (event.target as HTMLTextAreaElement).value });
  };

  const handleBlur = (event: FocusEvent) => {
    dispatch('blur', { value: (event.target as HTMLTextAreaElement).value });
  };

  const handleFocus = () => {
    dispatch('focus', { field: id });
  };
</script>

<div class="metadata-field">
  {#if label}
    <label for={id} class="field-label" class:needs-attention={needsAttention}>
      {label}
      {#if required}
        <span class="required" aria-label={$t('Required field')}>*</span>
      {/if}
    </label>
  {/if}

  <textarea
    {id}
    {value}
    {placeholder}
    {required}
    {disabled}
    {rows}
    class="field-textarea"
    class:error={!!error}
    class:needs-attention={needsAttention}
    on:input={handleInput}
    on:blur={handleBlur}
    on:focus={handleFocus}
    aria-describedby={error ? `${id}-error` : undefined}
    aria-invalid={!!error}
  ></textarea>

  {#if error}
    <div id="{id}-error" class="field-error" role="alert">
      {error}
    </div>
  {/if}
</div>

<style>
  .metadata-field {
    margin-block-end: 1rem;
  }

  .field-label {
    display: block;
    font-weight: 500;
    margin-block-end: 0.5rem;
    color: var(--color-text-primary);
    font-size: 0.875rem; /* Smaller label like Craigslist */
  }

  .field-label.needs-attention {
    color: var(--color-success-600); /* Green color for required unfilled fields */
  }

  .required {
    color: var(--color-error);
    margin-inline-start: 0.25rem;
  }

  .field-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    font-size: 1rem;
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
    transition: border-color 0.2s ease;
    resize: vertical;
    font-family: inherit;
    line-height: 1.5;
    field-sizing: content;
    min-height: calc(1.5em * 3 + 1.5rem); /* 3 rows + padding */
  }

  .field-textarea:focus {
    outline: none;
    border-color: var(--color-focus);
    box-shadow: inset 0 0 0 2px var(--color-focus-ring);
  }

  .field-textarea:disabled {
    background-color: var(--color-surface-disabled);
    color: var(--color-text-disabled);
    cursor: not-allowed;
    resize: none;
  }

  .field-textarea.error {
    border-color: var(--color-error);
  }

  .field-textarea.error:focus {
    border-color: var(--color-error);
    box-shadow: 0 0 0 2px var(--color-error-300);
  }

  .field-textarea.needs-attention {
    border-color: var(--color-success-600); /* Green border for required unfilled fields */
  }

  .field-textarea.needs-attention:focus {
    border-color: var(--color-success-600);
    box-shadow: 0 0 0 2px rgba(34, 139, 34, 0.2);
  }

  .field-error {
    margin-block-start: 0.25rem;
    color: var(--color-error);
    font-size: 0.875rem;
  }
</style>
