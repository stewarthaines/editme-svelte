<script lang="ts">
  import { t } from '../../i18n';
  import TextMetadataField from './fields/TextMetadataField.svelte';
  import TextareaMetadataField from './fields/TextareaMetadataField.svelte';
  import SelectMetadataField from './fields/SelectMetadataField.svelte';
  import type { EPUBMetadata } from '../../epub';
  import type { ValidationResult } from '../../metadata/MetadataValidator';
  import {
    ACCESS_MODES,
    ACCESSIBILITY_FEATURES,
    ACCESSIBILITY_HAZARDS,
    ACCESSIBILITY_CONTROLS,
    ACCESSIBILITY_APIS,
    CONFORMANCE_OPTIONS,
    type VocabOption,
  } from '../../epub/accessibility-vocab';

  interface Props {
    metadata?: EPUBMetadata;
    validationErrors?: ValidationResult[];
    saving?: boolean;
    advancedMode?: boolean;
    onfieldChange?: (event: CustomEvent<{ field: string; value: any }>) => void;
    onfieldSave?: (event: CustomEvent<{ field: string; value: any }>) => void;
    onfieldFocus?: (event: CustomEvent<{ field: keyof EPUBMetadata | null }>) => void;
  }

  let {
    metadata = { title: '', language: [], identifier: '' },
    validationErrors = [],
    saving = false,
    advancedMode = false,
    onfieldSave,
    onfieldFocus,
  }: Props = $props();

  const getFieldError = (fieldName: string) => {
    const error = validationErrors.find(err => err.field === fieldName);
    return error ? error.message : '';
  };

  const save = (field: string, value: any) =>
    onfieldSave?.(new CustomEvent('fieldSave', { detail: { field, value } }));
  const focus = (field: keyof EPUBMetadata) =>
    onfieldFocus?.(new CustomEvent('fieldFocus', { detail: { field } }));

  // Add/remove a value from a multi-valued field and save the whole array.
  const toggle = (field: string, current: string[] | undefined, value: string, on: boolean) => {
    const set = new Set(current ?? []);
    if (on) set.add(value);
    else set.delete(value);
    save(field, Array.from(set));
  };

  // accessModeSufficient is a list of comma-separated mode sets; edit it as one
  // set per line (power-user feature, advanced-gated).
  const sufficientText = $derived((metadata.accessModeSufficient ?? []).join('\n'));
  const saveSufficient = (text: string) =>
    save(
      'accessModeSufficient',
      text
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
    );

  const conformanceOptions = $derived(
    CONFORMANCE_OPTIONS.map(o => ({ value: o.value, label: $t(o.label) }))
  );

  // Advanced sections: shown in advanced mode or when already populated.
  const showSufficient = $derived(advancedMode || (metadata.accessModeSufficient?.length ?? 0) > 0);
  const showControls = $derived(advancedMode || (metadata.accessibilityControl?.length ?? 0) > 0);
  const showApi = $derived(advancedMode || (metadata.accessibilityAPI?.length ?? 0) > 0);
  const showCertification = $derived(
    advancedMode ||
      !!metadata.accessibilityCertifiedBy ||
      !!metadata.accessibilityCertifierCredential ||
      !!metadata.accessibilityCertifierReport
  );
</script>

{#snippet checkboxGroup(legend: string, options: VocabOption[], selected: string[] | undefined, field: string)}
  <fieldset class="field-group">
    <legend class="group-title" tabindex="-1">{legend}</legend>
    <div class="checkbox-grid">
      {#each options as opt (opt.value)}
        <label class="checkbox-item">
          <input
            type="checkbox"
            checked={(selected ?? []).includes(opt.value)}
            disabled={saving}
            onchange={e => toggle(field, selected, opt.value, e.currentTarget.checked)}
          />
          <span>{opt.label}</span>
        </label>
      {/each}
    </div>
  </fieldset>
{/snippet}

<div class="accessibility-fields">
  {@render checkboxGroup($t('Access modes'), ACCESS_MODES, metadata.accessMode, 'accessMode')}
  {@render checkboxGroup(
    $t('Accessibility features'),
    ACCESSIBILITY_FEATURES,
    metadata.accessibilityFeature,
    'accessibilityFeature'
  )}
  {@render checkboxGroup(
    $t('Hazards'),
    ACCESSIBILITY_HAZARDS,
    metadata.accessibilityHazard,
    'accessibilityHazard'
  )}

  <fieldset class="field-group">
    <legend class="group-title" tabindex="-1">{$t('Conformance')}</legend>
    <SelectMetadataField
      id="accessibilityConformance"
      label={$t('Conformance level')}
      value={metadata.accessibilityConformance || ''}
      options={conformanceOptions}
      onblur={e => save('accessibilityConformance', e.value)}
      onfocus={() => focus('accessibilityConformance' as keyof EPUBMetadata)}
    />
  </fieldset>

  <fieldset class="field-group">
    <legend class="group-title" tabindex="-1">{$t('Summary')}</legend>
    <TextareaMetadataField
      id="accessibilitySummary"
      value={metadata.accessibilitySummary || ''}
      placeholder={$t('Human-readable summary of the accessibility of this publication')}
      rows={3}
      error={getFieldError('accessibilitySummary')}
      onblur={e => save('accessibilitySummary', e.value)}
      onfocus={() => focus('accessibilitySummary')}
    />
  </fieldset>

  {#if showSufficient}
    <fieldset class="field-group">
      <legend class="group-title" tabindex="-1">{$t('Sufficient access modes')}</legend>
      <TextareaMetadataField
        id="accessModeSufficient"
        value={sufficientText}
        placeholder={$t('One sufficient set per line, e.g. textual,visual')}
        rows={2}
        onblur={e => saveSufficient(e.value)}
        onfocus={() => focus('accessModeSufficient')}
      />
    </fieldset>
  {/if}

  {#if showControls}
    {@render checkboxGroup(
      $t('Control methods'),
      ACCESSIBILITY_CONTROLS,
      metadata.accessibilityControl,
      'accessibilityControl'
    )}
  {/if}

  {#if showApi}
    {@render checkboxGroup(
      $t('Accessibility API'),
      ACCESSIBILITY_APIS,
      metadata.accessibilityAPI,
      'accessibilityAPI'
    )}
  {/if}

  {#if showCertification}
    <fieldset class="field-group">
      <legend class="group-title" tabindex="-1">{$t('Certification')}</legend>
      <TextMetadataField
        id="accessibilityCertifiedBy"
        label={$t('Certified by')}
        value={metadata.accessibilityCertifiedBy || ''}
        placeholder={$t('Name of the certifying party')}
        onblur={e => save('accessibilityCertifiedBy', e.value)}
        onfocus={() => focus('accessibilityCertifiedBy' as keyof EPUBMetadata)}
      />
      <TextMetadataField
        id="accessibilityCertifierCredential"
        label={$t('Certifier credential')}
        value={metadata.accessibilityCertifierCredential || ''}
        placeholder={$t('Credential of the certifier')}
        onblur={e => save('accessibilityCertifierCredential', e.value)}
        onfocus={() => focus('accessibilityCertifierCredential' as keyof EPUBMetadata)}
      />
      <TextMetadataField
        id="accessibilityCertifierReport"
        label={$t('Certifier report (URL)')}
        value={metadata.accessibilityCertifierReport || ''}
        placeholder={$t('https://example.com/report')}
        onblur={e => save('accessibilityCertifierReport', e.value)}
        onfocus={() => focus('accessibilityCertifierReport' as keyof EPUBMetadata)}
      />
    </fieldset>
  {/if}
</div>

<style>
  .accessibility-fields {
    padding: 1.5rem;
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
  }

  .checkbox-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.5rem 1rem;
  }

  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .checkbox-item input {
    flex: none;
    cursor: pointer;
  }
</style>
