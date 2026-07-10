<script lang="ts">
  import { t } from '../../i18n';
  import SettingsSection from '../settings/SettingsSection.svelte';
  import TextMetadataField from './fields/TextMetadataField.svelte';
  import DateMetadataField from './fields/DateMetadataField.svelte';
  import CreatorRoleEditor from './CreatorRoleEditor.svelte';
  import SubjectEditor from './SubjectEditor.svelte';
  import CollectionsEditor from './CollectionsEditor.svelte';
  import CustomMetaSection from './CustomMetaSection.svelte';
  import type { ValidationResult } from '../../metadata/MetadataValidator';
  import type { EPUBMetadata } from '../../epub';
  import { type EditableArrayField } from '../../epub/opf-utils';

  interface Props {
    metadata?: EPUBMetadata;
    validationErrors?: ValidationResult[];
    saving?: boolean;
    advancedMode?: boolean;
    /** Read-only book: standard fields disable wholesale; the Custom metadata
        section self-gates so discovery/adoption stays interactive. */
    readOnly?: boolean;
    /** id of the cover-image manifest item (Custom metadata cover row default). */
    coverImageId?: string;
    onfieldChange?: (event: CustomEvent<{ field: string; value: any }>) => void;
    onfieldSave?: (event: CustomEvent<{ field: string; value: any }>) => void;
    onfieldFocus?: (event: CustomEvent<{ field: keyof EPUBMetadata | null }>) => void;
    onarrayAdd?: (event: CustomEvent<{ field: EditableArrayField }>) => void;
    onarrayRemove?: (event: CustomEvent<{ field: EditableArrayField; index: number }>) => void;
  }

  let {
    metadata = { title: '', language: [], identifier: '' },
    validationErrors = [],
    saving = false,
    advancedMode = false,
    readOnly = false,
    coverImageId = undefined,
    onfieldChange,
    onfieldSave,
    onfieldFocus,
    onarrayAdd,
    onarrayRemove,
  }: Props = $props();

  const getFieldError = (fieldName: string) => {
    const error = validationErrors.find(err => err.field === fieldName);
    return error ? error.message : '';
  };

  const handleFieldChange = (field: string, value: any) => {
    onfieldChange?.(new CustomEvent('fieldChange', { detail: { field, value } }));
  };

  const handleFieldSave = (field: string, value: any) => {
    onfieldSave?.(new CustomEvent('fieldSave', { detail: { field, value } }));
  };

  const handleFieldFocus = (field: keyof EPUBMetadata | null) => {
    onfieldFocus?.(new CustomEvent('fieldFocus', { detail: { field } }));
  };
</script>

<div class="advanced-fields">
  <div class="form-columns">
    <div class="column">
      <fieldset class="column-group" disabled={readOnly}>
        <SettingsSection title={$t('Publication')} name="meta-publication" open>
          <TextMetadataField
            id="publisher"
            label={$t('Publisher')}
            value={metadata.publisher || ''}
            placeholder={$t('Enter publisher name')}
            error={getFieldError('publisher')}
            onchange={e => handleFieldChange('publisher', e.value)}
            onblur={e => handleFieldSave('publisher', e.value)}
            onfocus={() => handleFieldFocus('publisher')}
          />

          <DateMetadataField
            id="date"
            label={$t('Publication Date')}
            value={metadata.date || ''}
            error={getFieldError('date')}
            onchange={e => handleFieldChange('date', e.value)}
            onblur={e => handleFieldSave('date', e.value)}
            onfocus={() => handleFieldFocus('date')}
          />

          <TextMetadataField
            id="rights"
            label={$t('Rights')}
            value={metadata.rights || ''}
            placeholder={$t('Enter copyright information')}
            error={getFieldError('rights')}
            onchange={e => handleFieldChange('rights', e.value)}
            onblur={e => handleFieldSave('rights', e.value)}
            onfocus={() => handleFieldFocus('rights')}
          />

          <TextMetadataField
            id="type"
            label={$t('Content Type')}
            value={metadata.type || ''}
            placeholder={$t('e.g. fiction, dictionary, textbook')}
            error={getFieldError('type')}
            onchange={e => handleFieldChange('type', e.value)}
            onblur={e => handleFieldSave('type', e.value)}
            onfocus={() => handleFieldFocus('type')}
          />
        </SettingsSection>

        <SettingsSection title={$t('Additional Information')} name="meta-additional" open>
          <TextMetadataField
            id="source"
            label={$t('Source')}
            value={metadata.source || ''}
            placeholder={$t('Enter source information')}
            error={getFieldError('source')}
            onchange={e => handleFieldChange('source', e.value)}
            onblur={e => handleFieldSave('source', e.value)}
            onfocus={() => handleFieldFocus('source')}
          />

          <TextMetadataField
            id="relation"
            label={$t('Relation')}
            value={metadata.relation || ''}
            placeholder={$t('Enter related work information')}
            error={getFieldError('relation')}
            onchange={e => handleFieldChange('relation', e.value)}
            onblur={e => handleFieldSave('relation', e.value)}
            onfocus={() => handleFieldFocus('relation')}
          />

          <TextMetadataField
            id="coverage"
            label={$t('Coverage')}
            value={metadata.coverage || ''}
            placeholder={$t('Enter spatial or temporal coverage')}
            error={getFieldError('coverage')}
            onchange={e => handleFieldChange('coverage', e.value)}
            onblur={e => handleFieldSave('coverage', e.value)}
            onfocus={() => handleFieldFocus('coverage')}
          />

          <TextMetadataField
            id="format"
            label={$t('Format')}
            value={metadata.format || ''}
            placeholder={$t('Enter format information')}
            error={getFieldError('format')}
            onchange={e => handleFieldChange('format', e.value)}
            onblur={e => handleFieldSave('format', e.value)}
            onfocus={() => handleFieldFocus('format')}
          />
        </SettingsSection>
      </fieldset>

      <CustomMetaSection
        {metadata}
        {coverImageId}
        {saving}
        {readOnly}
        {onfieldSave}
        {onfieldFocus}
      />
    </div>

    <div class="column">
      <fieldset class="column-group" disabled={readOnly}>
        <SettingsSection title={$t('Subjects')} name="meta-subjects" open>
          <SubjectEditor
            subjects={metadata.subject}
            {saving}
            {advancedMode}
            {getFieldError}
            {onfieldSave}
            {onfieldFocus}
          />
        </SettingsSection>

        <CreatorRoleEditor
          field="contributor"
          creators={metadata.contributor ?? []}
          {saving}
          {advancedMode}
          legend={$t('Contributors')}
          addLabel={$t('Add Another Contributor')}
          namePlaceholder={$t('Contributor name')}
          {getFieldError}
          {onfieldSave}
          {onarrayAdd}
          {onarrayRemove}
          {onfieldFocus}
        />

        <SettingsSection title={$t('Collections')} name="meta-collections" open>
          <CollectionsEditor
            collections={metadata.collections}
            {saving}
            {getFieldError}
            {onfieldSave}
            {onfieldFocus}
          />
        </SettingsSection>
      </fieldset>
    </div>
  </div>
</div>

<style>
  .advanced-fields {
    padding: 1.5rem;
    /* Query the pane width, not the viewport (this form sits in a split pane). */
    container-type: inline-size;
  }

  .form-columns {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  @container (min-width: 640px) {
    .form-columns {
      grid-template-columns: 1fr 1fr;
    }
  }

  .column {
    min-width: 0; /* Allow flex item to shrink */
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* Transparent grouping fieldset: disables a column's standard sections in
     one shot on read-only books without adding any visual box, while the
     Custom metadata section (outside it) keeps its adopt buttons live. */
  .column-group {
    margin: 0;
    padding: 0;
    border: 0;
    min-inline-size: 0;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
</style>
