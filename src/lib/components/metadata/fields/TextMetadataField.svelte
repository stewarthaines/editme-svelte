<script>
  import { createEventDispatcher } from 'svelte';
  import { t } from '$lib/i18n';

  const dispatch = createEventDispatcher();

  export let value = '';
  export let placeholder = '';
  export let required = false;
  export let disabled = false;
  export let error = '';
  export let label = '';
  export let id = '';

  // Check if field needs attention (required but empty)
  $: needsAttention = required && (!value || value.trim() === '');

  const handleInput = (event) => {
    dispatch('change', { value: event.target.value });
  };

  const handleBlur = (event) => {
    dispatch('blur', { value: event.target.value });
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
  
  <input
    {id}
    type="text"
    {value}
    {placeholder}
    {required}
    {disabled}
    class="field-input"
    class:error={!!error}
    class:needs-attention={needsAttention}
    on:input={handleInput}
    on:blur={handleBlur}
    on:focus={handleFocus}
    aria-describedby={error ? `${id}-error` : undefined}
    aria-invalid={!!error}
  />

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
    color: #228B22; /* Green color for required unfilled fields */
  }

  .required {
    color: var(--color-error);
    margin-inline-start: 0.25rem;
  }

  .field-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    font-size: 1rem;
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
    transition: border-color 0.2s ease;
  }

  .field-input:focus {
    outline: none;
    border-color: var(--color-focus);
    box-shadow: 0 0 0 2px var(--color-focus-ring);
  }

  .field-input:disabled {
    background-color: var(--color-surface-disabled);
    color: var(--color-text-disabled);
    cursor: not-allowed;
  }

  .field-input.error {
    border-color: var(--color-error);
  }

  .field-input.error:focus {
    border-color: var(--color-error);
    box-shadow: 0 0 0 2px var(--color-error-300);
  }

  .field-input.needs-attention {
    border-color: #228B22; /* Green border for required unfilled fields */
  }

  .field-input.needs-attention:focus {
    border-color: #228B22;
    box-shadow: 0 0 0 2px rgba(34, 139, 34, 0.2);
  }

  .field-error {
    margin-block-start: 0.25rem;
    color: var(--color-error);
    font-size: 0.875rem;
  }
</style>