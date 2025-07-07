# MetadataManager Public API

This document defines the complete public API for the MetadataManager system, including all interfaces, type definitions, and method signatures needed for unit test development.

## Core Interfaces

### MetadataManager

```typescript
interface MetadataManager {
  // Core data operations
  loadMetadata(workspaceId: string): Promise<EPUBMetadata>;
  updateField(workspaceId: string, field: string, value: string | string[]): Promise<void>;
  validateMetadata(metadata: EPUBMetadata): ValidationResult[];

  // Array field operations - Creators
  addCreator(workspaceId: string, creator?: string): Promise<void>;
  removeCreator(workspaceId: string, index: number): Promise<void>;
  updateCreator(workspaceId: string, index: number, creator: string): Promise<void>;

  // Array field operations - Subjects
  addSubject(workspaceId: string, subject?: string): Promise<void>;
  removeSubject(workspaceId: string, index: number): Promise<void>;
  updateSubject(workspaceId: string, index: number, subject: string): Promise<void>;

  // Array field operations - Contributors
  addContributor(workspaceId: string, contributor?: string): Promise<void>;
  removeContributor(workspaceId: string, index: number): Promise<void>;
  updateContributor(workspaceId: string, index: number, contributor: string): Promise<void>;

  // Utilities
  generateIdentifier(): string;
  getCurrentDate(): string;
  getLanguageOptions(): LanguageOption[];
  getAccessibilityOptions(): AccessibilityOptions;

  // Cache management
  clearCache(workspaceId?: string): void;
  preloadMetadata(workspaceId: string): Promise<void>;
}
```

### MetadataUtils

```typescript
class MetadataUtils {
  static generateIdentifier(): string;
  static getCurrentDate(): string;
  static getLanguageOptions(): LanguageOption[];
  static getAccessibilityOptions(): AccessibilityOptions;
}
```

### MetadataValidator

```typescript
class MetadataValidator {
  static validateRequired(value: string, fieldName: string): ValidationResult | null;
  static validateLanguageCode(code: string): ValidationResult | null;
  static validateIdentifier(identifier: string): ValidationResult | null;
  static validateDate(dateString: string): ValidationResult | null;
  static validateArrayField(
    values: string[],
    fieldName: string,
    maxItems?: number
  ): ValidationResult[];
}
```

## Type Definitions

### EPUBMetadata

```typescript
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
```

### ValidationResult

```typescript
interface ValidationResult {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}
```

### PersistenceMetrics

```typescript
interface PersistenceMetrics {
  averageSaveTime: number;
  totalSaves: number;
  failedSaves: number;
  lastSaveTime: number;
}
```

### LanguageOption

```typescript
interface LanguageOption {
  code: string;
  name: string;
}
```

### AccessibilityOptions

```typescript
interface AccessibilityOptions {
  accessModes: Array<{ value: string; label: string }>;
  accessibilityFeatures: Array<{ value: string; label: string }>;
  accessibilityHazards: Array<{ value: string; label: string }>;
}
```

## Method Specifications

### loadMetadata()

```typescript
loadMetadata(workspaceId: string): Promise<EPUBMetadata>
```

**Input:**

- `workspaceId: string` - Unique identifier for the workspace

**Output:** `Promise<EPUBMetadata>` - Complete metadata object for the workspace

**Side Effects:**

- Loads metadata from WorkspaceManager if not cached
- Updates internal metadata cache
- May throw errors if workspace doesn't exist or metadata is corrupted

### updateField()

```typescript
updateField(workspaceId: string, field: string, value: string | string[]): Promise<void>
```

**Input:**

- `workspaceId: string` - Unique identifier for the workspace
- `field: string` - Metadata field name (e.g., 'title', 'creator', 'language')
- `value: string | string[]` - New value for the field

**Output:** `Promise<void>` - Resolves when field is updated and persisted

**Side Effects:**

- Updates metadata in WorkspaceManager
- Updates internal metadata cache
- Persists changes to content.opf file
- May throw errors on save failures

### validateMetadata()

```typescript
validateMetadata(metadata: EPUBMetadata): ValidationResult[]
```

**Input:**

- `metadata: EPUBMetadata` - Metadata object to validate

**Output:** `ValidationResult[]` - Array of validation errors and warnings

**Side Effects:** None (pure function)

### Array Field Operations

#### addCreator()

```typescript
addCreator(workspaceId: string, creator?: string): Promise<void>
```

**Input:**

- `workspaceId: string` - Unique identifier for the workspace
- `creator?: string` - Optional initial creator name (defaults to empty string)

**Output:** `Promise<void>` - Resolves when creator is added and persisted

**Side Effects:**

- Loads current metadata
- Appends new creator to creator array
- Calls updateField() to persist changes

#### removeCreator()

```typescript
removeCreator(workspaceId: string, index: number): Promise<void>
```

**Input:**

- `workspaceId: string` - Unique identifier for the workspace
- `index: number` - Array index of creator to remove

**Output:** `Promise<void>` - Resolves when creator is removed and persisted

**Side Effects:**

- Loads current metadata
- Removes creator at specified index
- Calls updateField() to persist changes
- May throw error if index is out of bounds

#### updateCreator()

```typescript
updateCreator(workspaceId: string, index: number, creator: string): Promise<void>
```

**Input:**

- `workspaceId: string` - Unique identifier for the workspace
- `index: number` - Array index of creator to update
- `creator: string` - New creator name

**Output:** `Promise<void>` - Resolves when creator is updated and persisted

**Side Effects:**

- Loads current metadata
- Updates creator at specified index
- Calls updateField() to persist changes
- May throw error if index is out of bounds

_Similar methods exist for subjects and contributors with identical signatures and behavior_

### Utility Methods

#### generateIdentifier()

```typescript
generateIdentifier(): string
```

**Input:** None

**Output:** `string` - Unique identifier in URN UUID format (e.g., "urn:uuid:123e4567-e89b-12d3-a456-426614174000")

**Side Effects:** None (pure function)

#### getCurrentDate()

```typescript
getCurrentDate(): string
```

**Input:** None

**Output:** `string` - Current date in YYYY-MM-DD format

**Side Effects:** None (uses current system time)

#### getLanguageOptions()

```typescript
getLanguageOptions(): LanguageOption[]
```

**Input:** None

**Output:** `LanguageOption[]` - Array of supported language codes and names

**Side Effects:** None (pure function)

**Expected languages include:**

- en (English)
- es (Spanish)
- fr (French)
- de (German)
- it (Italian)
- pt (Portuguese)
- ja (Japanese)
- zh (Chinese)
- ar (Arabic)
- he (Hebrew)
- ka (Georgian)
- zh-TW (Chinese Traditional)

#### getAccessibilityOptions()

```typescript
getAccessibilityOptions(): AccessibilityOptions
```

**Input:** None

**Output:** `AccessibilityOptions` - Object containing arrays of accessibility metadata options

**Side Effects:** None (pure function)

**Expected accessibility features include:**

- Access modes: textual, visual, auditory, tactile
- Features: alternativeText, audioDescription, captions, describedMath, longDescription, readingOrder, structuralNavigation, tableOfContents, index, printPageNumbers
- Hazards: flashing, motionSimulation, sound, noFlashing, noMotionSimulation, noSound, none

#### clearCache()

```typescript
clearCache(workspaceId?: string): void
```

**Input:**

- `workspaceId?: string` - Optional workspace ID to clear specific cache entry

**Output:** `void`

**Side Effects:**

- If workspaceId provided: removes that workspace's metadata from cache
- If no workspaceId: clears entire metadata cache

#### preloadMetadata()

```typescript
preloadMetadata(workspaceId: string): Promise<void>
```

**Input:**

- `workspaceId: string` - Workspace ID to preload

**Output:** `Promise<void>` - Resolves when metadata is loaded into cache

**Side Effects:**

- Loads metadata from WorkspaceManager
- Stores metadata in internal cache
- May throw errors if workspace doesn't exist

## Validation Method Specifications

### MetadataValidator.validateRequired()

```typescript
static validateRequired(value: string, fieldName: string): ValidationResult | null
```

**Input:**

- `value: string` - Value to validate
- `fieldName: string` - Field name for error messages

**Output:** `ValidationResult | null` - Error result if validation fails, null if valid

**Validation Logic:** Returns error if value is null, undefined, or empty string (after trim)

### MetadataValidator.validateLanguageCode()

```typescript
static validateLanguageCode(code: string): ValidationResult | null
```

**Input:**

- `code: string` - Language code to validate

**Output:** `ValidationResult | null` - Error result if validation fails, null if valid

**Validation Logic:**

- Returns null if code is empty (optional field)
- Validates against RFC 5646 language tag format: `^[a-z]{2,3}(-[A-Z]{2})?(-[a-z]{4})?(-[A-Z]{2}|\d{3})?$`
- Examples of valid codes: "en", "en-US", "zh-Hans-CN"

### MetadataValidator.validateIdentifier()

```typescript
static validateIdentifier(identifier: string): ValidationResult | null
```

**Input:**

- `identifier: string` - Identifier to validate

**Output:** `ValidationResult | null` - Warning result if format is questionable, null if valid

**Validation Logic:**

- Returns null if identifier is empty (will be caught by required validation)
- Accepts these formats:
  - URN UUID: `urn:uuid:[uuid]`
  - URN ISBN: `urn:isbn:[isbn]`
  - HTTP/HTTPS URLs
  - Simple alphanumeric identifiers with hyphens, underscores, dots
- Returns warning (not error) for invalid formats to allow custom identifiers

### MetadataValidator.validateDate()

```typescript
static validateDate(dateString: string): ValidationResult | null
```

**Input:**

- `dateString: string` - Date string to validate

**Output:** `ValidationResult | null` - Error result if validation fails, null if valid

**Validation Logic:**

- Returns null if date is empty (optional field)
- Accepts ISO 8601 formats:
  - YYYY (e.g., "2023")
  - YYYY-MM (e.g., "2023-12")
  - YYYY-MM-DD (e.g., "2023-12-31")
  - Full ISO 8601 with time (e.g., "2023-12-31T23:59:59.999Z")
- Validates that parseable dates are actual valid dates

### MetadataValidator.validateArrayField()

```typescript
static validateArrayField(values: string[], fieldName: string, maxItems = 10): ValidationResult[]
```

**Input:**

- `values: string[]` - Array of values to validate
- `fieldName: string` - Field name for error messages
- `maxItems: number` - Maximum allowed items (default: 10)

**Output:** `ValidationResult[]` - Array of validation errors/warnings

**Validation Logic:**

- Warning if array length exceeds maxItems
- Error for each empty/whitespace-only item in array
- Field names include array index for specific item errors (e.g., "creator[2]")

## Error Handling

### Expected Error Types

The MetadataManager methods may throw the following types of errors:

1. **WorkspaceNotFoundError** - When workspace doesn't exist
2. **MetadataCorruptedError** - When metadata cannot be parsed
3. **StorageQuotaExceededError** - When storage limit is reached
4. **NetworkError** - When save operations fail due to connectivity
5. **ValidationError** - When required validation fails

### Error Propagation

- All async methods should properly propagate errors from WorkspaceManager
- Array operation methods should validate indices before operations
- Cache operations should handle missing cache entries gracefully

## Usage Patterns

### Basic Usage

```typescript
const manager = new MetadataManager(workspaceManager);

// Load metadata
const metadata = await manager.loadMetadata('workspace-123');

// Update individual fields
await manager.updateField('workspace-123', 'title', 'My Book Title');
await manager.updateField('workspace-123', 'language', 'en');

// Validate metadata
const errors = manager.validateMetadata(metadata);
if (errors.length > 0) {
  console.log('Validation errors:', errors);
}
```

### Array Operations

```typescript
// Add creators
await manager.addCreator('workspace-123', 'John Doe');
await manager.addCreator('workspace-123', 'Jane Smith');

// Update specific creator
await manager.updateCreator('workspace-123', 0, 'John A. Doe');

// Remove creator
await manager.removeCreator('workspace-123', 1);
```

### Utility Usage

```typescript
// Generate new identifier
const id = manager.generateIdentifier();
await manager.updateField('workspace-123', 'identifier', id);

// Get language options for UI
const languages = manager.getLanguageOptions();
const accessibilityOptions = manager.getAccessibilityOptions();
```

## Testing Requirements

### Unit Tests Should Cover:

1. **All public methods** with valid inputs and expected outputs
2. **Error scenarios** for each method (invalid workspace, network failures, etc.)
3. **Edge cases** (empty arrays, null values, boundary conditions)
4. **Cache behavior** (cache hits, misses, invalidation)
5. **Validation logic** for all field types and formats
6. **Array operations** with various indices and boundary conditions

### Mocking Requirements:

- **WorkspaceManager** - Use existing mock at @src/lib/test/mocks/workspace-manager.mock.ts
- **Crypto.randomUUID()** - Mock for predictable identifier generation
- **Date** - Mock for consistent date generation testing
