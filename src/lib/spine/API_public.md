# Spine Item Manager Public API

## Overview

Public interface for the Spine Item Manager - comprehensive chapter management for EPUB files including spine ordering, chapter creation, and source file association.

## Constructor

```typescript
constructor(workspaceManager: WorkspaceManager)
```

## Core Chapter Management

### loadSpineItems()

```typescript
loadSpineItems(workspaceId: string): Promise<SpineItemWithSource[]>
```

Load all spine items with source file associations.

### addChapter()

```typescript
addChapter(workspaceId: string, chapterData: ChapterCreationData): Promise<SpineItemWithSource>
```

Create a new chapter with XHTML file, manifest entry, spine item, and source file.

### updateChapter()

```typescript
updateChapter(workspaceId: string, chapterId: string, updates: ChapterUpdateData): Promise<SpineItemWithSource>
```

Update chapter properties including filename, linearity, and properties.

### deleteChapter()

```typescript
deleteChapter(workspaceId: string, chapterId: string, options?: ChapterDeletionOptions): Promise<void>
```

Delete chapter with options to preserve files and manifest entries.

## Spine Ordering

### reorderItems()

```typescript
reorderItems(workspaceId: string, fromIndex: number, toIndex: number): Promise<SpineItemWithSource[]>
```

Move chapter from one position to another in spine order.

### moveChapterUp()

```typescript
moveChapterUp(workspaceId: string, chapterIndex: number): Promise<SpineItemWithSource[]>
```

Move chapter up one position in spine order.

### moveChapterDown()

```typescript
moveChapterDown(workspaceId: string, chapterIndex: number): Promise<SpineItemWithSource[]>
```

Move chapter down one position in spine order.

### updateSpineOrder()

```typescript
updateSpineOrder(workspaceId: string, spineItems: SpineItemWithSource[]): Promise<void>
```

Update complete spine order from reordered items array.

## Source File Management

### createSourceFile()

```typescript
createSourceFile(workspaceId: string, chapterId: string, content?: string): Promise<string>
```

Create source file for chapter with optional initial content. Source file is automatically associated with chapter using naming convention (`SOURCE/text/{chapterId}.txt`).

## Utilities

### generateChapterId()

```typescript
generateChapterId(workspaceId: string, baseTitle?: string): Promise<string>
```

Generate unique chapter ID with collision handling.

### validateSpineOrder()

```typescript
validateSpineOrder(workspaceId: string): Promise<SpineValidationResult>
```

Validate spine consistency and return detailed results.

## Public Type Definitions

### SpineItemWithSource

```typescript
interface SpineItemWithSource {
  // Spine item properties
  idref: string; // Reference to manifest item ID
  linear: boolean; // Include in linear reading order
  properties?: string[]; // EPUB spine properties

  // Manifest item properties (resolved from idref)
  id: string; // Manifest item ID (same as idref)
  href: string; // File path relative to OPF
  mediaType: string; // MIME type (typically "application/xhtml+xml")

  // Source file association (automatic by naming convention)
  sourcePath?: string; // Path to source file if it exists (SOURCE/text/{id}.txt)
  hasSourceFile: boolean; // Whether associated source file exists

  // UI state (not persisted)
  isEditing?: boolean; // Currently being edited in UI
  isDragging?: boolean; // Currently being dragged in UI
}
```

### ChapterCreationData

```typescript
interface ChapterCreationData {
  title: string; // Chapter title for display and content
  fileName?: string; // XHTML filename (auto-generated if not provided)
  linear?: boolean; // Include in linear reading order (default: true)
  properties?: string[]; // EPUB spine properties
  insertIndex?: number; // Position to insert in spine (default: append)
  createSourceFile?: boolean; // Create associated source file (default: true)
  sourceContent?: string; // Initial source content (uses template if not provided)
}
```

### ChapterUpdateData

```typescript
interface ChapterUpdateData {
  title?: string; // New chapter title
  fileName?: string; // New XHTML filename (will rename file)
  linear?: boolean; // Linear reading order flag
  properties?: string[]; // EPUB spine properties
  sourceContent?: string; // Update source file content
}
```

### ChapterDeletionOptions

```typescript
interface ChapterDeletionOptions {
  preserveXHTML?: boolean; // Keep XHTML file (default: false)
  preserveSourceFile?: boolean; // Keep source file (default: false)
  preserveManifest?: boolean; // Keep manifest entry (default: false)
}
```

### SpineValidationResult

```typescript
interface SpineValidationResult {
  isValid: boolean;
  errors: SpineValidationError[];
  warnings: SpineValidationWarning[];
  summary: {
    totalItems: number;
    linearItems: number;
    nonLinearItems: number;
    itemsWithSource: number;
    orphanedSources: number;
  };
}
```

### SpineValidationError

```typescript
interface SpineValidationError {
  code: string;
  message: string;
  chapterId?: string;
  severity: 'error' | 'warning';
}
```

### SpineValidationWarning

```typescript
interface SpineValidationWarning {
  code: string;
  message: string;
  chapterId?: string;
  severity: 'warning';
}
```

## Usage Examples

### Basic Chapter Management

```typescript
import { SpineItemManager } from '$lib/spine';
import { WorkspaceManager } from '$lib/workspace';

const workspaceManager = new WorkspaceManager();
await workspaceManager.init();
const spineManager = new SpineItemManager(workspaceManager);

// Load chapters
const chapters = await spineManager.loadSpineItems('workspace-123');

// Add new chapter
const newChapter = await spineManager.addChapter('workspace-123', {
  title: 'Chapter 1: The Beginning',
  linear: true,
});

// Reorder chapters
await spineManager.reorderItems('workspace-123', 0, 2);

// Update chapter
await spineManager.updateChapter('workspace-123', 'chapter1', {
  linear: false,
  properties: ['page-spread-left'],
});

// Delete chapter
await spineManager.deleteChapter('workspace-123', 'chapter1');
```

### Source File Management

```typescript
// Create source file for existing chapter (automatically associated by naming convention)
const sourcePath = await spineManager.createSourceFile('workspace-123', 'chapter1');
// Creates: SOURCE/text/chapter1.txt (automatically linked to chapter1)

// Source files are automatically detected and associated based on naming convention:
// Chapter ID 'chapter1' → Source file 'SOURCE/text/chapter1.txt'
```

### Validation

```typescript
// Validate spine consistency
const validation = await spineManager.validateSpineOrder('workspace-123');

if (!validation.isValid) {
  console.error('Spine validation errors:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn('Spine validation warnings:', validation.warnings);
}
```

## Error Handling

All methods may throw `WorkspaceError` with specific error codes:

- `DUPLICATE_ID` - Chapter ID already exists
- `INVALID_FILENAME` - Invalid filename format
- `STORAGE_QUOTA_EXCEEDED` - Not enough storage space
- `MISSING_MANIFEST_ITEM` - Spine references non-existent manifest item
- `WORKSPACE_NOT_FOUND` - Target workspace doesn't exist
- `INVALID_INDEX` - Reorder index out of bounds
