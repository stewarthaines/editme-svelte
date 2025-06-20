# 11. Metadata Editor

## Overview
Form-based interface for editing EPUB metadata with grouped fields, immediate mode editing, and proper validation for required fields.

## Requirements
- Form-based editing with grouped fields (Basic, Advanced, Accessibility)
- Immediate mode editing with blur event updates
- Dropdown selections for fixed layout and accessibility
- Required field validation (Title, Language, Identifier)

## Dependencies
- **#5 Content.opf Parser** - for metadata structure and validation

## Technical Approach
- Grouped form layout with collapsible sections
- Real-time validation and saving on blur events
- Dropdown options for standardized metadata values
- Auto-generation features for identifiers and dates

## API Design
```typescript
interface MetadataEditor {
  // Data management
  loadMetadata(workspaceId: string): Promise<EPUBMetadata>
  saveMetadata(metadata: EPUBMetadata): Promise<void>
  validateMetadata(metadata: EPUBMetadata): ValidationResult[]
  
  // Field operations
  updateField(field: string, value: string | string[]): void
  addCreator(): void
  removeCreator(index: number): void
  addSubject(): void
  removeSubject(index: number): void
  
  // Utilities
  generateIdentifier(): string
  getCurrentDate(): string
  getLanguageCodes(): LanguageOption[]
}

interface EPUBMetadata {
  // Required fields
  title: string
  language: string
  identifier: string
  
  // Optional fields
  creator?: string[]
  contributor?: string[]
  publisher?: string
  date?: string
  description?: string
  subject?: string[]
  rights?: string
  source?: string
  relation?: string
  coverage?: string
  type?: string
  format?: string
  
  // EPUB 3 accessibility
  accessMode?: string[]
  accessModeSufficient?: string[]
  accessibilityFeature?: string[]
  accessibilityHazard?: string[]
  accessibilitySummary?: string
}

interface ValidationResult {
  field: string
  message: string
  severity: 'error' | 'warning'
}
```

## Form Layout Structure
```svelte
<div class="metadata-editor">
  <div class="metadata-sidebar">
    <nav class="metadata-groups">
      {#each metadataGroups as group}
        <button 
          class="group-button"
          class:active={activeGroup === group.id}
          on:click={() => setActiveGroup(group.id)}
        >
          {group.title}
          {#if hasErrors(group.id)}
            <span class="error-indicator">!</span>
          {/if}
        </button>
      {/each}
    </nav>
  </div>
  
  <form class="metadata-form" on:submit|preventDefault>
    {#if activeGroup === 'basic'}
      <BasicMetadataFields bind:metadata />
    {:else if activeGroup === 'advanced'}
      <AdvancedMetadataFields bind:metadata />
    {:else if activeGroup === 'accessibility'}
      <AccessibilityMetadataFields bind:metadata />
    {/if}
  </form>
</div>
```

## Basic Metadata Fields
```svelte
<div class="field-group">
  <h3>Basic Information</h3>
  
  <div class="field">
    <label for="title">Title *</label>
    <input 
      id="title"
      type="text" 
      bind:value={metadata.title}
      on:blur={() => saveField('title', metadata.title)}
      required
      class:error={getFieldError('title')}
    />
    {#if getFieldError('title')}
      <span class="field-error">{getFieldError('title')}</span>
    {/if}
  </div>
  
  <div class="field">
    <label for="language">Language *</label>
    <select 
      id="language"
      bind:value={metadata.language}
      on:change={() => saveField('language', metadata.language)}
      required
    >
      <option value="">Select language...</option>
      {#each languageCodes as lang}
        <option value={lang.code}>{lang.name}</option>
      {/each}
    </select>
  </div>
  
  <div class="field">
    <label for="identifier">Identifier *</label>
    <div class="identifier-field">
      <input 
        id="identifier"
        type="text" 
        bind:value={metadata.identifier}
        on:blur={() => saveField('identifier', metadata.identifier)}
        required
      />
      <button type="button" on:click={generateNewIdentifier}>Generate</button>
    </div>
  </div>
  
  <div class="field-array">
    <label>Authors</label>
    {#each metadata.creator || [] as creator, index}
      <div class="array-item">
        <input 
          type="text" 
          bind:value={creator}
          on:blur={() => saveCreators()}
          placeholder="Author name"
        />
        <button type="button" on:click={() => removeCreator(index)}>Remove</button>
      </div>
    {/each}
    <button type="button" on:click={addCreator}>Add Author</button>
  </div>
</div>
```

## Advanced Metadata Fields
```svelte
<div class="field-group">
  <h3>Publication Details</h3>
  
  <div class="field">
    <label for="publisher">Publisher</label>
    <input 
      id="publisher"
      type="text" 
      bind:value={metadata.publisher}
      on:blur={() => saveField('publisher', metadata.publisher)}
    />
  </div>
  
  <div class="field">
    <label for="date">Publication Date</label>
    <input 
      id="date"
      type="date" 
      bind:value={metadata.date}
      on:blur={() => saveField('date', metadata.date)}
    />
  </div>
  
  <div class="field">
    <label for="description">Description</label>
    <textarea 
      id="description"
      bind:value={metadata.description}
      on:blur={() => saveField('description', metadata.description)}
      rows="4"
    ></textarea>
  </div>
  
  <div class="field-array">
    <label>Subjects</label>
    {#each metadata.subject || [] as subject, index}
      <div class="array-item">
        <input 
          type="text" 
          bind:value={subject}
          on:blur={() => saveSubjects()}
          placeholder="Subject/keyword"
        />
        <button type="button" on:click={() => removeSubject(index)}>Remove</button>
      </div>
    {/each}
    <button type="button" on:click={addSubject}>Add Subject</button>
  </div>
  
  <div class="field">
    <label for="rights">Rights</label>
    <input 
      id="rights"
      type="text" 
      bind:value={metadata.rights}
      on:blur={() => saveField('rights', metadata.rights)}
      placeholder="Copyright information"
    />
  </div>
</div>
```

## Accessibility Metadata Fields
```svelte
<div class="field-group">
  <h3>Accessibility Information</h3>
  
  <div class="field">
    <label for="access-mode">Access Mode</label>
    <select 
      id="access-mode"
      multiple
      bind:value={metadata.accessMode}
      on:change={() => saveField('accessMode', metadata.accessMode)}
    >
      <option value="textual">Textual</option>
      <option value="visual">Visual</option>
      <option value="auditory">Auditory</option>
      <option value="tactile">Tactile</option>
    </select>
  </div>
  
  <div class="field">
    <label for="accessibility-features">Accessibility Features</label>
    <select 
      id="accessibility-features"
      multiple
      bind:value={metadata.accessibilityFeature}
      on:change={() => saveField('accessibilityFeature', metadata.accessibilityFeature)}
    >
      <option value="alternativeText">Alternative Text</option>
      <option value="audioDescription">Audio Description</option>
      <option value="captions">Captions</option>
      <option value="describedMath">Described Math</option>
      <option value="longDescription">Long Description</option>
      <option value="readingOrder">Reading Order</option>
      <option value="structuralNavigation">Structural Navigation</option>
    </select>
  </div>
  
  <div class="field">
    <label for="accessibility-hazards">Accessibility Hazards</label>
    <select 
      id="accessibility-hazards"
      multiple
      bind:value={metadata.accessibilityHazard}
      on:change={() => saveField('accessibilityHazard', metadata.accessibilityHazard)}
    >
      <option value="flashing">Flashing</option>
      <option value="motionSimulation">Motion Simulation</option>
      <option value="sound">Sound</option>
      <option value="none">None</option>
    </select>
  </div>
  
  <div class="field">
    <label for="accessibility-summary">Accessibility Summary</label>
    <textarea 
      id="accessibility-summary"
      bind:value={metadata.accessibilitySummary}
      on:blur={() => saveField('accessibilitySummary', metadata.accessibilitySummary)}
      rows="3"
      placeholder="Brief summary of accessibility features"
    ></textarea>
  </div>
</div>
```

## Validation Logic
```typescript
const validateMetadata = (metadata: EPUBMetadata): ValidationResult[] => {
  const errors: ValidationResult[] = []
  
  // Required fields
  if (!metadata.title?.trim()) {
    errors.push({ field: 'title', message: 'Title is required', severity: 'error' })
  }
  
  if (!metadata.language?.trim()) {
    errors.push({ field: 'language', message: 'Language is required', severity: 'error' })
  } else if (!isValidLanguageCode(metadata.language)) {
    errors.push({ field: 'language', message: 'Invalid language code', severity: 'error' })
  }
  
  if (!metadata.identifier?.trim()) {
    errors.push({ field: 'identifier', message: 'Identifier is required', severity: 'error' })
  } else if (!isValidIdentifier(metadata.identifier)) {
    errors.push({ field: 'identifier', message: 'Invalid identifier format', severity: 'warning' })
  }
  
  // Date validation
  if (metadata.date && !isValidDate(metadata.date)) {
    errors.push({ field: 'date', message: 'Invalid date format', severity: 'error' })
  }
  
  return errors
}
```

## Auto-generation Utilities
```typescript
const generateIdentifier = (): string => {
  return `urn:uuid:${crypto.randomUUID()}`
}

const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0] // YYYY-MM-DD format
}

const getLanguageCodes = (): LanguageOption[] => [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  // ... more language codes
]
```

## Error Handling
- Required field validation
- Invalid date format handling
- Language code validation
- Identifier format validation
- Save operation failures
- Network connectivity issues

## Testing Considerations
- Test all required field validation
- Test immediate save functionality
- Test array field operations (add/remove)
- Test dropdown selections
- Test identifier generation
- Test accessibility metadata handling

## Implementation Notes
- Implement immediate save carefully to avoid excessive API calls
- Use debouncing for text inputs
- Provide clear visual feedback for validation errors
- Consider offline editing capabilities
- Test with screen readers for accessibility