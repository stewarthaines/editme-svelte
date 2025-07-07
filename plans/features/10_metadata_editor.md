# 10. Metadata Editor

## Overview

Form-based interface for editing EPUB metadata with grouped fields, immediate mode editing, and proper validation for required fields.

**Research needed:** Consider the EPUB 3 specification and how metadata fields and meta properties are actually implemented, particulary for fields that might have multiple instances. See example below.

**Ask user:** ask user which specific parts of the EPUB spec the app should support.

```xml
<metadata ...>
    ...
    <dc:creator id="author">John Doe</dc:creator>
    <dc:creator id="author1">Jane Doe</dc:creator>
    <meta refines="#author" property="file-as">Doe, John</meta>
    <meta refines="#author1" property="file-as">Doe, Jane</meta>
    <meta refines="#author" scheme="marc:relators" property="role">aut</meta>
    ...
</metadata>
```

**A11y fields:** ensure that there is suffient handling of accessibility meta properties to allow a package EPUB to pass the Ace by DAISY validator. (available as a command line tool `ace`.)

## Requirements

- Form-based editing with grouped fields (Basic, Advanced, Accessibility)
- Immediate mode editing with blur event updates
- Dropdown selections for fixed layout and accessibility
- Required field validation (Title, Language, Identifier)
- Preview pane shows `content.opf` with live updates from metadata changes

## Dependencies

- **#4 Workspace & OPF Manager** - for metadata structure and validation

## Technical Approach

- Grouped form layout
- Groups are child items in sidebar under 'metadata' section
- **Immediate persistence**: Changes saved to content.opf on every field update
- Real-time validation and saving on blur events
- Dropdown options for standardized metadata values
- Auto-generation features for identifiers and dates

## Data Persistence Strategy

### Immediate Persistence Design

**Decision**: Save metadata changes immediately to content.opf file on every field update, rather than keeping changes in memory until manual save.

**Rationale**:

- **Data safety**: Users create content over long periods, data loss risk is high
- **Web UX expectations**: Modern web forms auto-save, users expect persistence
- **Low performance cost**: content.opf files are small (2-10KB), minimal I/O overhead
- **Simplicity**: No dirty state management, no save buttons needed
- **EPUB characteristics**: Metadata changes are infrequent compared to content editing

**Performance Analysis**:

- **OPFS**: Very fast for small files, <1ms typical write time
- **IndexedDB**: Slightly slower but still acceptable, <10ms typical
- **File size**: content.opf rarely exceeds 10KB, negligible storage impact
- **Frequency**: Metadata editing is sporadic, not continuous like text editing

**Alternative considered**: In-memory editing with manual save was rejected due to high data loss risk and poor web UX.

## Architecture

### Two-Layer Design Pattern

Following the established project pattern (see SpineItemManager), the metadata editor uses a two-layer architecture:

1. **MetadataManager** - Business logic layer handling data operations, validation, and persistence
2. **UI Components** - Presentation layer for forms, validation display, and user interactions

**Benefits:**

- **Separation of Concerns**: Business logic isolated from UI presentation
- **Testability**: Manager can be unit tested independently of UI components
- **Reusability**: Multiple UI components can share the same manager instance
- **Performance**: Centralized caching and optimization strategies
- **Consistency**: Follows established project architectural patterns

### MetadataManager Integration

The MetadataManager serves as the primary interface between UI components and the WorkspaceManager, providing:

- Immediate persistence with performance tracking
- Field-level validation and error handling
- Array field operations (creators, subjects, contributors)
- Auto-generation utilities for identifiers and dates
- Centralized caching for metadata operations

## API Design

### MetadataManager Interface

```typescript
interface MetadataManager {
  // Core data operations
  loadMetadata(workspaceId: string): Promise<EPUBMetadata>;
  updateField(workspaceId: string, field: string, value: string | string[]): Promise<void>;
  validateMetadata(metadata: EPUBMetadata): ValidationResult[];

  // Array field operations
  addCreator(workspaceId: string, creator?: string): Promise<void>;
  removeCreator(workspaceId: string, index: number): Promise<void>;
  updateCreator(workspaceId: string, index: number, creator: string): Promise<void>;

  addSubject(workspaceId: string, subject?: string): Promise<void>;
  removeSubject(workspaceId: string, index: number): Promise<void>;
  updateSubject(workspaceId: string, index: number, subject: string): Promise<void>;

  addContributor(workspaceId: string, contributor?: string): Promise<void>;
  removeContributor(workspaceId: string, index: number): Promise<void>;
  updateContributor(workspaceId: string, index: number, contributor: string): Promise<void>;

  // Utilities
  generateIdentifier(): string;
  getCurrentDate(): string;
  getLanguageOptions(): LanguageOption[];
  getAccessibilityOptions(): AccessibilityOptions;

  // Performance monitoring
  getPerformanceMetrics(): PersistenceMetrics;

  // Cache management
  clearCache(workspaceId?: string): void;
  preloadMetadata(workspaceId: string): Promise<void>;
}

interface PersistenceMetrics {
  averageSaveTime: number;
  totalSaves: number;
  failedSaves: number;
  lastSaveTime: number;
}

interface LanguageOption {
  code: string;
  name: string;
}

interface AccessibilityOptions {
  accessModes: Array<{ value: string; label: string }>;
  accessibilityFeatures: Array<{ value: string; label: string }>;
  accessibilityHazards: Array<{ value: string; label: string }>;
}

// Workspace Manager integration
interface WorkspaceManager {
  updateMetadata(workspaceId: string, field: string, value: any): Promise<void>;
  updateMetadataField(workspaceId: string, field: string, value: any): Promise<void>;
  regenerateOPF(workspaceId: string): Promise<void>;
}

interface EPUBMetadata {
  // Required fields
  title: string;
  language: string;
  identifier: string;

  // Optional fields
  creator?: string[];
  contributor?: string[];
  publisher?: string;
  date?: string;
  description?: string;
  subject?: string[];
  rights?: string;
  source?: string;
  relation?: string;
  coverage?: string;
  type?: string;
  format?: string;

  // EPUB 3 accessibility
  accessMode?: string[];
  accessModeSufficient?: string[];
  accessibilityFeature?: string[];
  accessibilityHazard?: string[];
  accessibilitySummary?: string;
}

interface ValidationResult {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}
```

## Implementation Details

### MetadataManager Implementation

```typescript
class MetadataManager {
  private workspaceManager: WorkspaceManager;
  private metadataCache = new Map<string, EPUBMetadata>();
  private performanceMetrics: PersistenceMetrics = {
    averageSaveTime: 0,
    totalSaves: 0,
    failedSaves: 0,
    lastSaveTime: 0,
  };

  constructor(workspaceManager: WorkspaceManager) {
    this.workspaceManager = workspaceManager;
  }

  async loadMetadata(workspaceId: string): Promise<EPUBMetadata> {
    // Check cache first
    if (this.metadataCache.has(workspaceId)) {
      return this.metadataCache.get(workspaceId)!;
    }

    // Load from workspace
    const metadata = await this.workspaceManager.getMetadata(workspaceId);
    this.metadataCache.set(workspaceId, metadata);
    return metadata;
  }

  async updateField(workspaceId: string, field: string, value: string | string[]): Promise<void> {
    const startTime = performance.now();

    try {
      // Update in workspace manager (updates in-memory cache + persists to file)
      await this.workspaceManager.updateMetadataField(workspaceId, field, value);

      // Update local cache
      const metadata = this.metadataCache.get(workspaceId);
      if (metadata) {
        metadata[field] = value;
      }

      // Update performance metrics
      const duration = performance.now() - startTime;
      this.updateMetrics(duration, true);

      // Log slow operations
      if (duration > 100) {
        console.warn(`Slow metadata save: ${field} took ${duration}ms`);
      }
    } catch (error) {
      this.updateMetrics(performance.now() - startTime, false);
      console.error(`Failed to save metadata field ${field}:`, error);
      throw error;
    }
  }

  // Array field operations
  async addCreator(workspaceId: string, creator = ''): Promise<void> {
    const metadata = await this.loadMetadata(workspaceId);
    const creators = metadata.creator || [];
    creators.push(creator);
    await this.updateField(workspaceId, 'creator', creators);
  }

  async removeCreator(workspaceId: string, index: number): Promise<void> {
    const metadata = await this.loadMetadata(workspaceId);
    const creators = metadata.creator || [];
    creators.splice(index, 1);
    await this.updateField(workspaceId, 'creator', creators);
  }

  async updateCreator(workspaceId: string, index: number, creator: string): Promise<void> {
    const metadata = await this.loadMetadata(workspaceId);
    const creators = metadata.creator || [];
    creators[index] = creator;
    await this.updateField(workspaceId, 'creator', creators);
  }

  // Similar methods for subjects and contributors...

  validateMetadata(metadata: EPUBMetadata): ValidationResult[] {
    const errors: ValidationResult[] = [];

    // Required fields
    if (!metadata.title?.trim()) {
      errors.push({ field: 'title', message: 'Title is required', severity: 'error' });
    }

    if (!metadata.language?.trim()) {
      errors.push({ field: 'language', message: 'Language is required', severity: 'error' });
    } else if (!this.isValidLanguageCode(metadata.language)) {
      errors.push({ field: 'language', message: 'Invalid language code', severity: 'error' });
    }

    if (!metadata.identifier?.trim()) {
      errors.push({ field: 'identifier', message: 'Identifier is required', severity: 'error' });
    }

    return errors;
  }

  // Utility methods
  generateIdentifier(): string {
    return `urn:uuid:${crypto.randomUUID()}`;
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getLanguageOptions(): LanguageOption[] {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'zh', name: 'Chinese' },
      // ... more language codes
    ];
  }

  getAccessibilityOptions(): AccessibilityOptions {
    return {
      accessModes: [
        { value: 'textual', label: 'Textual' },
        { value: 'visual', label: 'Visual' },
        { value: 'auditory', label: 'Auditory' },
        { value: 'tactile', label: 'Tactile' },
      ],
      accessibilityFeatures: [
        { value: 'alternativeText', label: 'Alternative Text' },
        { value: 'audioDescription', label: 'Audio Description' },
        { value: 'captions', label: 'Captions' },
        { value: 'describedMath', label: 'Described Math' },
        { value: 'longDescription', label: 'Long Description' },
        { value: 'readingOrder', label: 'Reading Order' },
        { value: 'structuralNavigation', label: 'Structural Navigation' },
      ],
      accessibilityHazards: [
        { value: 'flashing', label: 'Flashing' },
        { value: 'motionSimulation', label: 'Motion Simulation' },
        { value: 'sound', label: 'Sound' },
        { value: 'none', label: 'None' },
      ],
    };
  }

  // Performance and cache management
  getPerformanceMetrics(): PersistenceMetrics {
    return { ...this.performanceMetrics };
  }

  clearCache(workspaceId?: string): void {
    if (workspaceId) {
      this.metadataCache.delete(workspaceId);
    } else {
      this.metadataCache.clear();
    }
  }

  async preloadMetadata(workspaceId: string): Promise<void> {
    await this.loadMetadata(workspaceId);
  }

  private updateMetrics(duration: number, success: boolean): void {
    this.performanceMetrics.totalSaves++;
    this.performanceMetrics.lastSaveTime = duration;

    if (success) {
      // Update rolling average
      const total =
        this.performanceMetrics.averageSaveTime * (this.performanceMetrics.totalSaves - 1);
      this.performanceMetrics.averageSaveTime =
        (total + duration) / this.performanceMetrics.totalSaves;
    } else {
      this.performanceMetrics.failedSaves++;
    }
  }

  private isValidLanguageCode(code: string): boolean {
    // Basic validation - could be enhanced with full language code list
    return /^[a-z]{2}(-[A-Z]{2})?$/.test(code);
  }
}
```

### Workspace Manager Integration

```typescript
class WorkspaceManager {
  private opfCache = new Map<string, OPFDocument>();

  async updateMetadataField(workspaceId: string, field: string, value: any): Promise<void> {
    // Get current OPF (from cache or load from file)
    const opf = await this.getWorkspaceOPF(workspaceId);

    // Update the specific field
    opf.metadata[field] = value;

    // Update cache
    this.opfCache.set(workspaceId, opf);

    // Immediately persist to content.opf file
    await this.saveOPF(workspaceId, opf);
  }

  private async saveOPF(workspaceId: string, opf: OPFDocument): Promise<void> {
    const xml = this.generateOPFXML(opf);
    await this.storage.writeTextFile(workspaceId, 'OEBPS/content.opf', xml);
  }
}
```

### Debounced Alternative (for rapid changes)

```typescript
// Optional: Use for rapid typing scenarios
const debouncedUpdateField = debounce(async (workspaceId: string, field: string, value: string) => {
  await metadataEditor.updateField(workspaceId, field, value);
}, 500); // 500ms delay

// Use in component for text inputs that might change rapidly
const handleFieldChange = (field: string, value: string) => {
  // Immediate UI update
  metadata[field] = value;

  // Debounced persistence
  debouncedUpdateField(workspaceId, field, value);
};
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

## UI Component Integration

### Basic Metadata Fields Component

```svelte
<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let metadata = {};
  export let workspaceId = '';
  export let metadataManager = null;

  let saving = false;
  let saveStatus = {};

  const saveField = async (field, value) => {
    if (!metadataManager || !workspaceId) return;

    saving = true;
    saveStatus[field] = 'saving';

    try {
      await metadataManager.updateField(workspaceId, field, value);
      saveStatus[field] = 'saved';
      setTimeout(() => {
        saveStatus[field] = null;
      }, 2000);
    } catch (error) {
      saveStatus[field] = 'error';
      console.error(`Failed to save ${field}:`, error);
    } finally {
      saving = false;
    }
  };

  const addCreator = async () => {
    try {
      await metadataManager.addCreator(workspaceId);
      // Refresh metadata from manager
      metadata = await metadataManager.loadMetadata(workspaceId);
    } catch (error) {
      console.error('Failed to add creator:', error);
    }
  };

  const removeCreator = async index => {
    try {
      await metadataManager.removeCreator(workspaceId, index);
      // Refresh metadata from manager
      metadata = await metadataManager.loadMetadata(workspaceId);
    } catch (error) {
      console.error('Failed to remove creator:', error);
    }
  };

  const saveCreators = async () => {
    try {
      await metadataManager.updateField(workspaceId, 'creator', metadata.creator || []);
    } catch (error) {
      console.error('Failed to save creators:', error);
    }
  };

  const generateNewIdentifier = async () => {
    const newId = metadataManager.generateIdentifier();
    metadata.identifier = newId;
    await saveField('identifier', newId);
  };
</script>

<div class="field-group">
  <h3>Basic Information</h3>

  <div class="field">
    <label for="title">Title *</label>
    <div class="field-input-wrapper">
      <input
        id="title"
        type="text"
        bind:value={metadata.title}
        on:blur={() => saveField('title', metadata.title)}
        required
        class:error={getFieldError('title')}
        disabled={saving}
      />
      {#if saveStatus.title === 'saving'}
        <span class="save-indicator saving">💾</span>
      {:else if saveStatus.title === 'saved'}
        <span class="save-indicator saved">✅</span>
      {:else if saveStatus.title === 'error'}
        <span class="save-indicator error">❌</span>
      {/if}
    </div>
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

### Manager Integration in Parent Component

```svelte
<script>
  import { MetadataManager } from '$lib/managers/MetadataManager';
  import { WorkspaceManager } from '$lib/managers/WorkspaceManager';
  import BasicMetadataFields from './BasicMetadataFields.svelte';
  import AdvancedMetadataFields from './AdvancedMetadataFields.svelte';
  import AccessibilityMetadataFields from './AccessibilityMetadataFields.svelte';

  export let workspaceId = '';

  let metadataManager;
  let workspaceManager;
  let metadata = {};
  let validationErrors = [];
  let activeGroup = 'basic';

  $: metadataGroups = [
    { id: 'basic', title: 'Basic Information' },
    { id: 'advanced', title: 'Publication Details' },
    { id: 'accessibility', title: 'Accessibility' },
  ];

  onMount(async () => {
    // Initialize managers
    workspaceManager = new WorkspaceManager();
    metadataManager = new MetadataManager(workspaceManager);

    // Load metadata
    await loadMetadata();
  });

  const loadMetadata = async () => {
    try {
      metadata = await metadataManager.loadMetadata(workspaceId);
      validationErrors = metadataManager.validateMetadata(metadata);
    } catch (error) {
      console.error('Failed to load metadata:', error);
    }
  };

  const setActiveGroup = groupId => {
    activeGroup = groupId;
  };

  const hasErrors = groupId => {
    const groupFields = getGroupFields(groupId);
    return validationErrors.some(error => groupFields.includes(error.field));
  };

  const getGroupFields = groupId => {
    switch (groupId) {
      case 'basic':
        return ['title', 'language', 'identifier', 'creator'];
      case 'advanced':
        return ['publisher', 'date', 'description', 'subject', 'rights'];
      case 'accessibility':
        return [
          'accessMode',
          'accessibilityFeature',
          'accessibilityHazard',
          'accessibilitySummary',
        ];
      default:
        return [];
    }
  };
</script>

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
      <BasicMetadataFields bind:metadata {workspaceId} {metadataManager} />
    {:else if activeGroup === 'advanced'}
      <AdvancedMetadataFields bind:metadata {workspaceId} {metadataManager} />
    {:else if activeGroup === 'accessibility'}
      <AccessibilityMetadataFields bind:metadata {workspaceId} {metadataManager} />
    {/if}
  </form>
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
  const errors: ValidationResult[] = [];

  // Required fields
  if (!metadata.title?.trim()) {
    errors.push({ field: 'title', message: 'Title is required', severity: 'error' });
  }

  if (!metadata.language?.trim()) {
    errors.push({ field: 'language', message: 'Language is required', severity: 'error' });
  } else if (!isValidLanguageCode(metadata.language)) {
    errors.push({ field: 'language', message: 'Invalid language code', severity: 'error' });
  }

  if (!metadata.identifier?.trim()) {
    errors.push({ field: 'identifier', message: 'Identifier is required', severity: 'error' });
  } else if (!isValidIdentifier(metadata.identifier)) {
    errors.push({ field: 'identifier', message: 'Invalid identifier format', severity: 'warning' });
  }

  // Date validation
  if (metadata.date && !isValidDate(metadata.date)) {
    errors.push({ field: 'date', message: 'Invalid date format', severity: 'error' });
  }

  return errors;
};
```

## Utility Methods and Validation

### Auto-generation Utilities

```typescript
class MetadataUtils {
  static generateIdentifier(): string {
    return `urn:uuid:${crypto.randomUUID()}`;
  }

  static getCurrentDate(): string {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  static getLanguageOptions(): LanguageOption[] {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ar', name: 'Arabic' },
      { code: 'he', name: 'Hebrew' },
      { code: 'ka', name: 'Georgian' },
      { code: 'zh-TW', name: 'Chinese Traditional' },
      // ... more language codes
    ];
  }

  static getAccessibilityOptions(): AccessibilityOptions {
    return {
      accessModes: [
        { value: 'textual', label: 'Textual' },
        { value: 'visual', label: 'Visual' },
        { value: 'auditory', label: 'Auditory' },
        { value: 'tactile', label: 'Tactile' },
      ],
      accessibilityFeatures: [
        { value: 'alternativeText', label: 'Alternative Text' },
        { value: 'audioDescription', label: 'Audio Description' },
        { value: 'captions', label: 'Captions' },
        { value: 'describedMath', label: 'Described Math' },
        { value: 'longDescription', label: 'Long Description' },
        { value: 'readingOrder', label: 'Reading Order' },
        { value: 'structuralNavigation', label: 'Structural Navigation' },
        { value: 'tableOfContents', label: 'Table of Contents' },
        { value: 'index', label: 'Index' },
        { value: 'printPageNumbers', label: 'Print Page Numbers' },
      ],
      accessibilityHazards: [
        { value: 'flashing', label: 'Flashing' },
        { value: 'motionSimulation', label: 'Motion Simulation' },
        { value: 'sound', label: 'Sound' },
        { value: 'noFlashing', label: 'No Flashing' },
        { value: 'noMotionSimulation', label: 'No Motion Simulation' },
        { value: 'noSound', label: 'No Sound' },
        { value: 'none', label: 'None' },
      ],
    };
  }
}
```

### Validation Helpers

```typescript
class MetadataValidator {
  static validateRequired(value: string, fieldName: string): ValidationResult | null {
    if (!value?.trim()) {
      return { field: fieldName, message: `${fieldName} is required`, severity: 'error' };
    }
    return null;
  }

  static validateLanguageCode(code: string): ValidationResult | null {
    if (!code?.trim()) return null;

    // RFC 5646 language tag validation (basic)
    if (!/^[a-z]{2,3}(-[A-Z]{2})?(-[a-z]{4})?(-[A-Z]{2}|\d{3})?$/.test(code)) {
      return { field: 'language', message: 'Invalid language code format', severity: 'error' };
    }
    return null;
  }

  static validateIdentifier(identifier: string): ValidationResult | null {
    if (!identifier?.trim()) return null;

    // Check for common identifier formats
    const validFormats = [
      /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      /^urn:isbn:\d{10}(\d{3})?$/,
      /^http[s]?:\/\/.+/,
      /^[a-zA-Z0-9\-_.]+$/,
    ];

    const isValid = validFormats.some(format => format.test(identifier));
    if (!isValid) {
      return { field: 'identifier', message: 'Invalid identifier format', severity: 'warning' };
    }
    return null;
  }

  static validateDate(dateString: string): ValidationResult | null {
    if (!dateString?.trim()) return null;

    // Accept ISO 8601 date formats
    const dateFormats = [
      /^\d{4}$/, // YYYY
      /^\d{4}-\d{2}$/, // YYYY-MM
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/, // Full ISO 8601
    ];

    const isValid = dateFormats.some(format => format.test(dateString));
    if (!isValid) {
      return {
        field: 'date',
        message: 'Invalid date format (use YYYY, YYYY-MM, or YYYY-MM-DD)',
        severity: 'error',
      };
    }

    // Additional validation for parseable dates
    if (dateString.includes('-')) {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return { field: 'date', message: 'Invalid date value', severity: 'error' };
      }
    }

    return null;
  }

  static validateArrayField(
    values: string[],
    fieldName: string,
    maxItems = 10
  ): ValidationResult[] {
    const errors: ValidationResult[] = [];

    if (values.length > maxItems) {
      errors.push({
        field: fieldName,
        message: `Too many ${fieldName} items (max ${maxItems})`,
        severity: 'warning',
      });
    }

    values.forEach((value, index) => {
      if (!value?.trim()) {
        errors.push({
          field: `${fieldName}[${index}]`,
          message: `${fieldName} item cannot be empty`,
          severity: 'error',
        });
      }
    });

    return errors;
  }
}
```

## Error Handling

- Required field validation
- Invalid date format handling
- Language code validation
- Identifier format validation
- Save operation failures
- Network connectivity issues

## Testing Considerations

### MetadataManager Testing (Unit Tests)

**Business Logic Testing:**

- Test all field validation rules (required fields, formats, language codes)
- Test array field operations (add/remove/update creators, subjects, contributors)
- Test metadata loading and caching behavior
- Test performance metrics collection and accuracy
- Test error handling and recovery mechanisms

**Cache Management Testing:**

- Test cache consistency across multiple operations
- Test cache invalidation when workspace changes
- Test memory usage with extended editing sessions
- Verify no memory leaks in metadata cache

**Integration Testing:**

- Test WorkspaceManager integration and error handling
- Test concurrent metadata operations
- Test cache consistency after workspace manager errors

### UI Component Testing

**Component Integration:**

- Test component renders with manager instance
- Test field updates trigger manager methods
- Test validation error display from manager
- Test save status indicators (saving/saved/error)

**User Interaction Testing:**

- Test form field blur events trigger saves
- Test array operations (add/remove) update UI
- Test error handling and user feedback
- Test accessibility features (keyboard navigation, screen readers)

### Integration Testing

**Cross-Component Testing:**

- Test metadata updates reflect in manifest view
- Test workspace switching with cached metadata
- Test OPF regeneration with updated metadata
- Test metadata loading from existing EPUB files

**Performance Testing:**

- Measure save operation latency across storage backends
- Test with rapidly changing fields (typing simulation)
- Test performance metrics collection accuracy
- Verify immediate persistence performance characteristics

### Error Recovery Testing

**Storage Failure Testing:**

- Test behavior when storage quota exceeded
- Test recovery from corrupted content.opf files
- Test partial save failures (workspace exists but OPF write fails)
- Test network interruption during save operations

**Manager Error Handling:**

- Test manager behavior when WorkspaceManager fails
- Test cache consistency after save failures
- Test validation error propagation to UI components

## Implementation Notes

### Development Priorities

1. **Start with immediate persistence**: Implement the simple approach first
2. **Add performance monitoring**: Track save times and failures from day one
3. **Progressive enhancement**: Add debouncing only if performance issues arise
4. **Error handling**: Robust error recovery is critical for data safety

### Best Practices

- **Visual feedback**: Show save indicators (saving/saved/error) for user confidence
- **Error recovery**: Graceful handling of save failures with retry mechanisms
- **Performance monitoring**: Log slow operations (>100ms) for optimization
- **Cache management**: Ensure OPF cache consistency across workspace operations
- **Accessibility**: Test with screen readers, ensure save states are announced

### Optimization Options

- **Debouncing**: Available for rapid text input if needed (500ms recommended)
- **Batch updates**: Group multiple field changes if performance becomes issue
- **Background saves**: Consider web workers for large metadata sets

### Browser Considerations

- **OPFS performance**: Expect <1ms save times on modern browsers
- **IndexedDB fallback**: Expect <10ms save times, still very acceptable
- **Storage quotas**: Monitor and handle quota exceeded gracefully
- **Offline scenarios**: Consider service worker caching for offline editing
