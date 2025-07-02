# Spine Item Manager Test Plan

## Overview

Comprehensive unit testing strategy for the Spine Item Manager, focusing on testing the public API defined in `API_public.md` while ensuring robust error handling, edge case coverage, and integration with the WorkspaceManager.

## Testing Architecture

### Test Environment Setup

- **Framework**: Vitest with TypeScript support
- **Environment**: happy-dom for basic DOM operations
- **Mocking Strategy**: Mock WorkspaceManager for isolated unit testing
- **Coverage Target**: 95%+ for public methods

### Mock Strategy

Mock the WorkspaceManager dependency to isolate SpineItemManager logic:

```typescript
import { vi, type MockedObject } from 'vitest';
import type { WorkspaceManager } from '$lib/workspace';

const createMockWorkspaceManager = (): MockedObject<WorkspaceManager> => ({
  getWorkspaceOPF: vi.fn(),
  addManifestItem: vi.fn(),
  addSpineItem: vi.fn(),
  updateSpineOrder: vi.fn(),
  writeFile: vi.fn(),
  deleteFile: vi.fn(),
  readTextFile: vi.fn(),
  fileExists: vi.fn(),
  // ... other required methods
});
```

## Test Suites

### 1. Constructor and Initialization

#### Test: `SpineItemManager Constructor`

**Purpose**: Verify proper initialization with WorkspaceManager dependency

**Test Cases**:

- ✅ Should accept WorkspaceManager instance
- ✅ Should store reference to WorkspaceManager
- ✅ Should not perform any file operations during construction

```typescript
describe('SpineItemManager Constructor', () => {
  it('should initialize with WorkspaceManager', () => {
    const mockWorkspaceManager = createMockWorkspaceManager();
    const spineManager = new SpineItemManager(mockWorkspaceManager);

    expect(spineManager).toBeInstanceOf(SpineItemManager);
    expect(mockWorkspaceManager.getWorkspaceOPF).not.toHaveBeenCalled();
  });
});
```

### 2. Core Chapter Management

#### Test Suite: `loadSpineItems()`

**Purpose**: Test loading spine items with source file associations

**Test Cases**:

- ✅ Should load empty spine successfully
- ✅ Should load spine items with manifest data
- ✅ Should detect source file associations by naming convention
- ✅ Should handle mixed spine items (some with/without source files)
- ✅ Should preserve spine order from OPF
- ❌ Should handle workspace not found error
- ❌ Should handle corrupted OPF data

```typescript
describe('loadSpineItems()', () => {
  it('should load spine items with source file associations', async () => {
    const mockOPF = {
      manifest: [
        { id: 'chapter1', href: 'Text/chapter1.xhtml', mediaType: 'application/xhtml+xml' },
        { id: 'chapter2', href: 'Text/chapter2.xhtml', mediaType: 'application/xhtml+xml' },
      ],
      spine: [
        { idref: 'chapter1', linear: true },
        { idref: 'chapter2', linear: true },
      ],
    };

    mockWorkspaceManager.getWorkspaceOPF.mockResolvedValue(mockOPF);
    mockWorkspaceManager.fileExists
      .mockResolvedValueOnce(true) // chapter1.txt exists
      .mockResolvedValueOnce(false); // chapter2.txt doesn't exist

    const items = await spineManager.loadSpineItems('workspace-123');

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual(
      expect.objectContaining({
        id: 'chapter1',
        idref: 'chapter1',
        href: 'Text/chapter1.xhtml',
        hasSourceFile: true,
        sourcePath: 'SOURCE/text/chapter1.txt',
      })
    );
    expect(items[1]).toEqual(
      expect.objectContaining({
        id: 'chapter2',
        hasSourceFile: false,
        sourcePath: undefined,
      })
    );
  });
});
```

#### Test Suite: `addChapter()`

**Purpose**: Test chapter creation with all required files and entries

**Test Cases**:

- ✅ Should create chapter with default settings
- ✅ Should create chapter with custom filename
- ✅ Should create chapter with custom content
- ✅ Should insert chapter at specific position
- ✅ Should create chapter without source file when disabled
- ✅ Should handle ID collision and auto-increment
- ✅ Should generate sequential IDs (chapter1, chapter2, etc.)
- ✅ Should generate ID from title
- ❌ Should rollback on manifest creation failure
- ❌ Should rollback on XHTML file creation failure
- ❌ Should rollback on source file creation failure
- ❌ Should handle storage quota exceeded
- ❌ Should validate filename format

```typescript
describe('addChapter()', () => {
  it('should create chapter with all required files', async () => {
    const mockOPF = { manifest: [], spine: [] };
    mockWorkspaceManager.getWorkspaceOPF.mockResolvedValue(mockOPF);
    mockWorkspaceManager.addManifestItem.mockResolvedValue(undefined);
    mockWorkspaceManager.addSpineItem.mockResolvedValue(undefined);
    mockWorkspaceManager.writeFile.mockResolvedValue(undefined);

    const newChapter = await spineManager.addChapter('workspace-123', {
      title: 'Test Chapter',
      linear: true,
    });

    expect(mockWorkspaceManager.addManifestItem).toHaveBeenCalledWith(
      'workspace-123',
      expect.objectContaining({
        id: 'chapter1',
        href: 'Text/chapter1.xhtml',
        mediaType: 'application/xhtml+xml',
      })
    );

    expect(mockWorkspaceManager.addSpineItem).toHaveBeenCalledWith(
      'workspace-123',
      expect.objectContaining({
        idref: 'chapter1',
        linear: true,
      }),
      undefined // append to end
    );

    // Should create XHTML file
    expect(mockWorkspaceManager.writeFile).toHaveBeenCalledWith(
      'workspace-123',
      'OEBPS/Text/chapter1.xhtml',
      expect.stringContaining('<title>Test Chapter</title>')
    );

    // Should create source file
    expect(mockWorkspaceManager.writeFile).toHaveBeenCalledWith(
      'workspace-123',
      'SOURCE/text/chapter1.txt',
      expect.stringContaining('# Test Chapter')
    );
  });

  it('should handle ID collision and auto-increment', async () => {
    const mockOPF = {
      manifest: [
        { id: 'chapter1', href: 'Text/chapter1.xhtml', mediaType: 'application/xhtml+xml' },
      ],
      spine: [],
    };
    mockWorkspaceManager.getWorkspaceOPF.mockResolvedValue(mockOPF);

    await spineManager.addChapter('workspace-123', {
      title: 'Another Chapter',
    });

    expect(mockWorkspaceManager.addManifestItem).toHaveBeenCalledWith(
      'workspace-123',
      expect.objectContaining({ id: 'chapter2' })
    );
  });

  it('should rollback on failure', async () => {
    mockWorkspaceManager.getWorkspaceOPF.mockResolvedValue({ manifest: [], spine: [] });
    mockWorkspaceManager.addManifestItem.mockResolvedValue(undefined);
    mockWorkspaceManager.addSpineItem.mockRejectedValue(new Error('Spine add failed'));

    await expect(
      spineManager.addChapter('workspace-123', {
        title: 'Test Chapter',
      })
    ).rejects.toThrow('Spine add failed');

    // Should attempt to clean up manifest item
    expect(mockWorkspaceManager.removeManifestItem).toHaveBeenCalledWith(
      'workspace-123',
      'chapter1'
    );
  });
});
```

#### Test Suite: `updateChapter()`

**Purpose**: Test chapter property updates including file renames

**Test Cases**:

- ✅ Should update linear property
- ✅ Should update spine properties
- ✅ Should rename XHTML file when fileName changes
- ✅ Should rename source file when fileName changes
- ✅ Should update source file content
- ✅ Should handle chapter not found
- ❌ Should validate new filename format
- ❌ Should handle file rename conflicts
- ❌ Should rollback on partial update failure

#### Test Suite: `deleteChapter()`

**Purpose**: Test chapter deletion with preservation options

**Test Cases**:

- ✅ Should delete all files by default
- ✅ Should preserve XHTML when requested
- ✅ Should preserve source file when requested
- ✅ Should preserve manifest entry when requested
- ✅ Should handle chapter not found gracefully
- ❌ Should handle file deletion failures
- ❌ Should validate preservation options

### 3. Spine Ordering Operations

#### Test Suite: `reorderItems()`

**Purpose**: Test moving chapters between positions

**Test Cases**:

- ✅ Should move chapter from start to middle
- ✅ Should move chapter from middle to start
- ✅ Should move chapter from middle to end
- ✅ Should handle same position (no-op)
- ✅ Should preserve other chapter properties
- ❌ Should handle invalid fromIndex
- ❌ Should handle invalid toIndex
- ❌ Should handle workspace update failure

```typescript
describe('reorderItems()', () => {
  it('should move chapter from first to third position', async () => {
    const mockSpineItems = [
      { idref: 'chapter1', linear: true },
      { idref: 'chapter2', linear: true },
      { idref: 'chapter3', linear: true },
    ];

    mockWorkspaceManager.getWorkspaceOPF.mockResolvedValue({
      spine: mockSpineItems,
      manifest: [], // simplified for test
    });

    await spineManager.reorderItems('workspace-123', 0, 2);

    expect(mockWorkspaceManager.updateSpineOrder).toHaveBeenCalledWith('workspace-123', [
      'chapter2',
      'chapter3',
      'chapter1',
    ]);
  });

  it('should handle invalid indices', async () => {
    mockWorkspaceManager.getWorkspaceOPF.mockResolvedValue({
      spine: [{ idref: 'chapter1', linear: true }],
      manifest: [],
    });

    await expect(spineManager.reorderItems('workspace-123', 0, 5)).rejects.toThrow(
      'Invalid toIndex: 5'
    );

    await expect(spineManager.reorderItems('workspace-123', -1, 0)).rejects.toThrow(
      'Invalid fromIndex: -1'
    );
  });
});
```

#### Test Suite: `moveChapterUp()` and `moveChapterDown()`

**Purpose**: Test single-step movement operations

**Test Cases**:

- ✅ Should move chapter up one position
- ✅ Should move chapter down one position
- ✅ Should handle already at first position (moveUp)
- ✅ Should handle already at last position (moveDown)
- ❌ Should handle invalid index

### 4. Source File Management

#### Test Suite: `createSourceFile()`

**Purpose**: Test source file creation with templates

**Test Cases**:

- ✅ Should create source file with default template
- ✅ Should create source file with custom content
- ✅ Should use chapter title in template
- ✅ Should handle existing source file (overwrite vs error)
- ❌ Should handle storage errors
- ❌ Should validate source file path

#### Test Suite: `linkSourceFile()` and `unlinkSourceFile()`

**Purpose**: Test source file association management

**Test Cases**:

- ✅ Should link existing source file to chapter
- ✅ Should unlink source file without deleting
- ✅ Should unlink and delete source file
- ✅ Should handle source file not found
- ❌ Should validate source file path format

### 5. Utility Methods

#### Test Suite: `generateChapterId()`

**Purpose**: Test ID generation with collision handling

**Test Cases**:

- ✅ Should generate sequential IDs (chapter1, chapter2)
- ✅ Should generate ID from title ('Chapter One' → 'chapter-one')
- ✅ Should handle ID collisions with incrementing
- ✅ Should sanitize invalid characters in titles
- ✅ Should handle empty or null titles

```typescript
describe('generateChapterId()', () => {
  it('should generate sequential IDs', async () => {
    mockWorkspaceManager.getWorkspaceOPF.mockResolvedValue({
      manifest: [{ id: 'chapter1', href: 'Text/chapter1.xhtml' }],
    });

    const id = await spineManager.generateChapterId('workspace-123');
    expect(id).toBe('chapter2');
  });

  it('should generate ID from title', async () => {
    mockWorkspaceManager.getWorkspaceOPF.mockResolvedValue({
      manifest: [],
    });

    const id = await spineManager.generateChapterId('workspace-123', 'Chapter One');
    expect(id).toBe('chapter-one');
  });

  it('should handle title collisions', async () => {
    mockWorkspaceManager.getWorkspaceOPF.mockResolvedValue({
      manifest: [{ id: 'chapter-one', href: 'Text/chapter-one.xhtml' }],
    });

    const id = await spineManager.generateChapterId('workspace-123', 'Chapter One');
    expect(id).toBe('chapter-one1');
  });
});
```

#### Test Suite: `validateSpineOrder()`

**Purpose**: Test spine consistency validation

**Test Cases**:

- ✅ Should validate correct spine
- ✅ Should detect missing manifest items
- ✅ Should detect duplicate spine items
- ✅ Should detect orphaned text files
- ✅ Should count linear vs non-linear items
- ✅ Should count items with source files

```typescript
describe('validateSpineOrder()', () => {
  it('should detect missing manifest items', async () => {
    mockWorkspaceManager.getWorkspaceOPF.mockResolvedValue({
      manifest: [
        { id: 'chapter1', href: 'Text/chapter1.xhtml', mediaType: 'application/xhtml+xml' },
      ],
      spine: [
        { idref: 'chapter1', linear: true },
        { idref: 'chapter2', linear: true }, // Missing from manifest
      ],
    });

    const result = await spineManager.validateSpineOrder('workspace-123');

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'MISSING_MANIFEST_ITEM',
        chapterId: 'chapter2',
      })
    );
  });

  it('should detect duplicate spine items', async () => {
    mockWorkspaceManager.getWorkspaceOPF.mockResolvedValue({
      manifest: [
        { id: 'chapter1', href: 'Text/chapter1.xhtml', mediaType: 'application/xhtml+xml' },
      ],
      spine: [
        { idref: 'chapter1', linear: true },
        { idref: 'chapter1', linear: true }, // Duplicate
      ],
    });

    const result = await spineManager.validateSpineOrder('workspace-123');

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'DUPLICATE_SPINE_ITEM',
        chapterId: 'chapter1',
      })
    );
  });
});
```

## Error Handling Tests

### Test Suite: `Error Scenarios`

**Purpose**: Test error handling and recovery

**Test Cases**:

- ❌ Should handle WorkspaceManager errors gracefully
- ❌ Should provide meaningful error messages
- ❌ Should clean up on atomic operation failures
- ❌ Should handle concurrent modification errors
- ❌ Should handle storage quota exceeded
- ❌ Should handle permission denied errors

```typescript
describe('Error Handling', () => {
  it('should handle workspace not found', async () => {
    mockWorkspaceManager.getWorkspaceOPF.mockRejectedValue(
      new WorkspaceError('Workspace not found', 'WORKSPACE_NOT_FOUND', 'workspace-123')
    );

    await expect(spineManager.loadSpineItems('workspace-123')).rejects.toThrow(
      'Workspace not found'
    );
  });

  it('should clean up on atomic operation failure', async () => {
    mockWorkspaceManager.getWorkspaceOPF.mockResolvedValue({ manifest: [], spine: [] });
    mockWorkspaceManager.addManifestItem.mockResolvedValue(undefined);
    mockWorkspaceManager.addSpineItem.mockResolvedValue(undefined);
    mockWorkspaceManager.writeFile
      .mockResolvedValueOnce(undefined) // XHTML file succeeds
      .mockRejectedValueOnce(new Error('Source file write failed')); // Source file fails

    await expect(
      spineManager.addChapter('workspace-123', {
        title: 'Test Chapter',
      })
    ).rejects.toThrow('Source file write failed');

    // Should clean up manifest and spine items
    expect(mockWorkspaceManager.removeManifestItem).toHaveBeenCalledWith(
      'workspace-123',
      'chapter1'
    );
    expect(mockWorkspaceManager.removeSpineItem).toHaveBeenCalledWith('workspace-123', 'chapter1');
  });
});
```

## Edge Cases and Boundary Tests

### Test Suite: `Edge Cases`

**Purpose**: Test boundary conditions and unusual inputs

**Test Cases**:

- ✅ Should handle empty workspace
- ✅ Should handle workspace with only manifest items (no spine)
- ✅ Should handle workspace with only spine items (no manifest)
- ✅ Should handle very long chapter titles
- ✅ Should handle special characters in titles
- ✅ Should handle maximum spine size (1000+ items)
- ✅ Should handle Unicode chapter titles
- ❌ Should handle corrupted OPF data

```typescript
describe('Edge Cases', () => {
  it('should handle empty workspace', async () => {
    mockWorkspaceManager.getWorkspaceOPF.mockResolvedValue({
      manifest: [],
      spine: [],
    });

    const items = await spineManager.loadSpineItems('workspace-123');
    expect(items).toEqual([]);

    const validation = await spineManager.validateSpineOrder('workspace-123');
    expect(validation.isValid).toBe(true);
    expect(validation.summary.totalItems).toBe(0);
  });

  it('should handle special characters in titles', async () => {
    mockWorkspaceManager.getWorkspaceOPF.mockResolvedValue({
      manifest: [],
      spine: [],
    });

    const chapterId = await spineManager.generateChapterId(
      'workspace-123',
      'Chapter "One": The Beginning & End!'
    );

    expect(chapterId).toBe('chapter-one-the-beginning-end');
  });

  it('should handle Unicode chapter titles', async () => {
    mockWorkspaceManager.getWorkspaceOPF.mockResolvedValue({
      manifest: [],
      spine: [],
    });

    const unicodeTitle = 'Kapitel 一: Der Anfang 始まり';
    const chapterId = await spineManager.generateChapterId('workspace-123', unicodeTitle);

    // Should sanitize but preserve readable parts
    expect(chapterId).toMatch(/^[a-z0-9-]+$/);
  });
});
```

## Performance Tests

### Test Suite: `Performance`

**Purpose**: Test performance with large datasets

**Test Cases**:

- ✅ Should handle 1000+ spine items efficiently
- ✅ Should cache repeated operations
- ✅ Should batch multiple reorder operations
- ❌ Should complete operations within time limits

```typescript
describe('Performance', () => {
  it('should handle large spine efficiently', async () => {
    const largeSpine = Array.from({ length: 1000 }, (_, i) => ({
      idref: `chapter${i + 1}`,
      linear: true,
    }));

    const largeManifest = largeSpine.map(spine => ({
      id: spine.idref,
      href: `Text/${spine.idref}.xhtml`,
      mediaType: 'application/xhtml+xml',
    }));

    mockWorkspaceManager.getWorkspaceOPF.mockResolvedValue({
      manifest: largeManifest,
      spine: largeSpine,
    });

    const startTime = Date.now();
    const items = await spineManager.loadSpineItems('workspace-123');
    const endTime = Date.now();

    expect(items).toHaveLength(1000);
    expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
  });
});
```

## Integration Tests (Separate Suite)

### Test Suite: `WorkspaceManager Integration`

**Purpose**: Test real integration with WorkspaceManager (may be in separate file)

**Test Cases**:

- ✅ Should integrate with real WorkspaceManager
- ✅ Should persist changes correctly
- ✅ Should handle concurrent access
- ✅ Should maintain workspace consistency

## Test File Organization

### File Structure

```
src/lib/spine/test/
├── spine-item-manager.test.ts          # Main unit tests
├── spine-ordering.test.ts              # Reordering operations
├── source-file-management.test.ts      # Source file operations
├── validation.test.ts                  # Validation logic
├── error-handling.test.ts              # Error scenarios
├── edge-cases.test.ts                  # Boundary conditions
├── performance.test.ts                 # Performance tests
└── integration.test.ts                 # WorkspaceManager integration
```

### Test Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'happy-dom',
    coverage: {
      reporter: ['text', 'html'],
      threshold: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      },
    },
  },
});
```

### Mock Setup

```typescript
// test/setup.ts
import { vi } from 'vitest';

// Global mocks for common workspace operations
vi.mock('$lib/workspace', () => ({
  WorkspaceManager: vi.fn(() => createMockWorkspaceManager()),
}));

// Mock crypto.randomUUID for consistent testing
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
});
```

## Test Execution Strategy

### Development Workflow

1. **TDD Approach**: Write tests first based on API_public.md
2. **Red-Green-Refactor**: Implement minimal code to pass tests
3. **Coverage Monitoring**: Maintain 95%+ coverage
4. **Performance Benchmarks**: Track operation timing

### CI/CD Integration

- Run full test suite on every commit
- Generate coverage reports
- Performance regression detection
- Browser compatibility testing via Storybook

### Test Categories

- **Unit Tests**: Fast, isolated, mocked dependencies
- **Integration Tests**: Real WorkspaceManager integration
- **Performance Tests**: Large dataset handling
- **Accessibility Tests**: Keyboard navigation, screen readers
- **Browser Tests**: Real browser API testing via Storybook

This comprehensive test plan ensures the Spine Item Manager is thoroughly tested across all scenarios, providing confidence in the implementation and facilitating future maintenance and feature additions.
