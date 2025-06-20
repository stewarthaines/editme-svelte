# 01. File Storage API

## Overview

Implements browser-local file storage using OPFS with dual API support for cross-browser compatibility, providing the foundation for all workspace data persistence.

## Requirements

- OPFS implementation with dual API support (createWritable + createSyncAccessHandle)
- Fallback-based API usage (no upfront feature detection)
- Storage quota monitoring and error handling
- Workspace folder management with unique IDs

## Dependencies

- None (foundational feature)

## Implementation File Structure

```
src/lib/storage/
├── FileStorageAPI.js          // Main implementation class
├── FileStorageError.js        // Error classes and codes
├── storage-utils.js           // Helper functions (path handling, etc.)
└── index.js                   // Public exports

tests/
├── lib/
│   └── storage/
│       ├── FileStorageAPI.test.js     // Main API tests
│       ├── FileStorageError.test.js   // Error handling tests
│       └── storage-utils.test.js      // Utility function tests
└── integration/
    └── storage/
        └── file-storage-integration.test.js  // Cross-browser OPFS tests
```

## Primary Implementation

- **File**: `src/lib/storage/FileStorageAPI.js`
- **Export**: `FileStorageAPI` class
- **Usage**: `import { FileStorageAPI } from '$lib/storage'`

## Technical Approach

- Main thread implementation where available
- Triple API support: createWritable (where available: http Chrome/Firefox/Edge, file:// firefox), IndexedDB (for file:// on Chrome/Edge) and createSyncAccessHandle (Safari)
- OPFS and IndexedDB implementations
- Prefer OPFS where available because of direct access to file resource via blob urls
- Workspace isolation using `workspaces/` subdirectory structure
- Root namespace reserved for packaging, temp files, and other operations
- Quota monitoring using StorageManager API

## API Design

```typescript
interface FileStorageAPI {
  // Workspace management
  createWorkspace(id: string): Promise<void>;
  deleteWorkspace(id: string): Promise<void>;
  listWorkspaces(): Promise<string[]>;

  // File operations
  writeFile(
    workspaceId: string,
    path: string,
    content: ArrayBuffer
  ): Promise<void>;
  readFile(workspaceId: string, path: string): Promise<ArrayBuffer>;
  deleteFile(workspaceId: string, path: string): Promise<void>;
  renameFile(
    workspaceId: string,
    oldPath: string,
    newPath: string
  ): Promise<void>;
  listFiles(workspaceId: string, path?: string): Promise<string[]>;

  // Storage monitoring
  getQuota(): Promise<{ used: number; available: number }>;
  estimateWorkspaceSize(workspaceId: string): Promise<number>;
}
```

## OPFS Implementation

- Use `navigator.storage.getDirectory()` for root access
- Organize files under structured top-level directories
- Create workspace subdirectories under `workspaces/` for isolation
- Dual API support with fallback strategy (try createWritable first, fallback to createSyncAccessHandle)
- **Path Handling**: Treat paths as directory elements within workspace (e.g., `OEBPS/chapter1.xhtml` creates `OEBPS/` directory with `chapter1.xhtml` file)

### Directory Structure

```
/ (OPFS root)
├── workspaces/
│   ├── workspace-{uuid}/
│   │   ├── META-INF/
│   │   ├── OEBPS/
│   │   └── EDITME/
│   └── workspace-{uuid}/
├── temp/
├── cache/
└── packaging/
```

### Dual API with Fallback Strategy

```typescript
async function writeFileWithFallback(
  fileHandle: FileSystemFileHandle,
  content: ArrayBuffer
) {
  try {
    // Try createWritable first (Chrome, Firefox, Edge)
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  } catch (error) {
    // Fallback to createSyncAccessHandle (Safari)
    const syncHandle = await fileHandle.createSyncAccessHandle();
    syncHandle.write(content, { at: 0 });
    syncHandle.flush();
    syncHandle.close();
  }
}
```

### OPFS Support Detection

```typescript
function isOPFSSupported(): boolean {
  return "storage" in navigator && "getDirectory" in navigator.storage;
}

// Usage: Check basic support, handle failures during actual operations
if (!isOPFSSupported()) {
  throw new FileStorageError(
    ErrorCodes.OPFS_NOT_SUPPORTED,
    "OPFS not supported in this browser"
  );
}
```

## Implementation Details

### Main Thread Operations

```typescript
// Workspace operations
const root = await navigator.storage.getDirectory();
const workspacesDir = await root.getDirectoryHandle("workspaces", {
  create: true,
});
const workspaceDir = await workspacesDir.getDirectoryHandle(workspaceId, {
  create: true,
});

// Read operations - all browsers support async getFile()
const fileHandle = await workspaceDir.getFileHandle(fileName);
const file = await fileHandle.getFile();
const content = await file.arrayBuffer();

// List operations - all browsers support async iteration
for await (const [name, handle] of workspaceDir.entries()) {
  if (handle.kind === "file") {
    // Process file
  }
}

// Delete operations - all browsers support async removeEntry()
await workspaceDir.removeEntry(fileName);

// List workspaces
const workspaceIds = [];
for await (const [name, handle] of workspacesDir.entries()) {
  if (handle.kind === "directory") {
    workspaceIds.push(name);
  }
}
```

### Root Namespace Organization

- **`workspaces/`** - All EPUB workspace data isolated in subdirectories
- **`temp/`** - Temporary files during EPUB processing
- **`cache/`** - Cached transform results and blob URLs
- **`packaging/`** - Intermediate files during EPUB creation/export
- **Root level** - Available for app-level configuration and metadata

## Error Handling

### Error Types

```typescript
class FileStorageError extends Error {
  constructor(public code: string, message: string, public cause?: Error) {
    super(message);
    this.name = "FileStorageError";
  }
}

// Specific error codes
const ErrorCodes = {
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  WORKSPACE_NOT_FOUND: "WORKSPACE_NOT_FOUND",
  OPFS_NOT_SUPPORTED: "OPFS_NOT_SUPPORTED",
  INVALID_PATH: "INVALID_PATH",
  STORAGE_CORRUPTION: "STORAGE_CORRUPTION",
};
```

### Error Handling Examples

```typescript
try {
  await fileStorage.writeFile("workspace-123", "OEBPS/chapter1.xhtml", content);
} catch (error) {
  if (error instanceof FileStorageError) {
    switch (error.code) {
      default:
        // Generic error handling
        showErrorToast(error.message);
    }
  }
}

// Quota monitoring with proactive handling
const quota = await fileStorage.getQuota();
if (quota.used / quota.available > 0.9) {
  // Warn user before quota exceeded
  showQuotaWarning(quota);
}
```

## Testing Considerations

- Test both OPFS APIs (createWritable and createSyncAccessHandle)
- Test quota exceeded scenarios
- Verify workspace isolation
- Performance benchmarks for large files
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- File:// protocol compatibility testing

## Performance Benefits

- **Simple Architecture**: All operations run on main thread for easier debugging
- **Fast Operations**: No message passing overhead between threads
- **Direct Control**: Immediate error handling and response
- **Lightweight**: No worker initialization or management overhead
- **Better Organization**: Structured namespace prevents file conflicts and enables efficient cleanup
- **Scalable Architecture**: Root namespace available for additional features (packaging, caching, etc.)
- **Workspace Isolation**: Each EPUB project completely isolated from others

## Implementation Notes

- Start with basic OPFS support detection during app initialization
- Implement all operations on main thread (read, write, list, delete)
- Add quota monitoring after basic operations work
- Consider chunking for very large files (>100MB)

## Implementation Pattern

```typescript
class FileStorageAPI {
  async writeFile(
    workspaceId: string,
    path: string,
    content: ArrayBuffer
  ): Promise<void> {
    const root = await navigator.storage.getDirectory();
    const workspaceDir = await this.ensureWorkspaceDirectory(root, workspaceId);
    const fileHandle = await this.ensureFileHandle(workspaceDir, path);

    // Use fallback strategy for cross-browser compatibility
    await this.writeFileWithFallback(fileHandle, content);
  }

  private async writeFileWithFallback(
    fileHandle: FileSystemFileHandle,
    content: ArrayBuffer
  ) {
    try {
      // Try createWritable first (Chrome, Firefox, Edge)
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    } catch (error) {
      // Fallback to createSyncAccessHandle (Safari)
      const syncHandle = await fileHandle.createSyncAccessHandle();
      syncHandle.write(content, { at: 0 });
      syncHandle.flush();
      syncHandle.close();
    }
  }

  async createWorkspace(workspaceId: string) {
    const root = await navigator.storage.getDirectory();
    const workspacesDir = await root.getDirectoryHandle("workspaces", {
      create: true,
    });
    await workspacesDir.getDirectoryHandle(workspaceId, { create: true });
  }

  async listWorkspaces(): Promise<string[]> {
    const root = await navigator.storage.getDirectory();
    const workspacesDir = await root.getDirectoryHandle("workspaces", {
      create: true,
    });

    const workspaceIds: string[] = [];
    for await (const [name, handle] of workspacesDir.entries()) {
      if (handle.kind === "directory") {
        workspaceIds.push(name);
      }
    }
    return workspaceIds;
  }

  private async ensureFileHandle(
    workspaceDir: FileSystemDirectoryHandle,
    path: string
  ) {
    const pathParts = path.split("/");
    const fileName = pathParts.pop();

    if (pathParts.length > 0) {
      const targetDir = await this.ensureDirectoryPath(workspaceDir, pathParts);
      return await targetDir.getFileHandle(fileName, { create: true });
    }

    return await workspaceDir.getFileHandle(fileName, { create: true });
  }

  private async ensureDirectoryPath(
    baseDir: FileSystemDirectoryHandle,
    pathParts: string[]
  ) {
    let currentDir = baseDir;
    for (const part of pathParts) {
      currentDir = await currentDir.getDirectoryHandle(part, { create: true });
    }
    return currentDir;
  }
}
```

## Example Usage Patterns

```typescript
// Example: Loading an EPUB workspace
import { FileStorageAPI } from "$lib/storage";
const storage = new FileStorageAPI();
async function loadEPUBWorkspace(workspaceId: string) {
  try {
    const package = await storage.readFile(workspaceId, "OEBPS/content.opf");
    const decoder = new TextDecoder();
    const packageContent = decoder.decode(package);
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "application/xml");
    const title = doc.querySelector("metadata dc:title").value;
    const author = doc.querySelector("metadata dc:creator").value;

    // process content.opf to extract book title and author from metadata...
  } catch (error) {
    console.error("Failed to handle file:", error);
  }
}

// Example: Saving editor content
async function saveChapterContent(
  workspaceId: string,
  chapterPath: string,
  content: string
) {
  try {
    await storage.writeFile(workspaceId, chapterPath, encoder.encode(chapter1));
  } catch (error) {
    console.error("Failed to update chapter", error);
  }
}
```
