# SOURCE.zip Implementation TODO

This document outlines the implementation steps required to integrate SOURCE.zip functionality based on the documentation changes and existing codebase analysis.

## Overview

The codebase has strong foundations with comprehensive EPUB handling, file storage, and workspace management already implemented. The main work involves:

1. **Bridging existing EPUB workflows** with SOURCE.zip concept
2. **Implementing transform pipeline** (currently unbuilt)
3. **Modifying existing features** to handle SOURCE/ directory structure

## Implementation Status

### ✅ Already Implemented (Strong Foundation)
- **Workspace Manager** - Complete with OPF, manifest, spine management
- **EPUB Packaging/Unpacking** - Full ZIP handling with compression streams
- **File Storage API** - OPFS with IndexedDB fallback
- **OPF Utilities** - Complete XML parsing and generation
- **Dependency Tracker** - File reference validation and analysis

### ❌ Missing (Needs Implementation)
- **Transform Pipeline** - Script execution engine (Feature 12)
- **SOURCE.zip Management** - Creation/extraction workflows
- **Extension System** - Dynamic script loading from SOURCE/

## Phase 1: Core SOURCE.zip Integration (High Priority)

### 1.1 Create SOURCE Manager (New)
**Location**: `src/lib/source/`

**Files to Create**:
```
src/lib/source/
├── index.ts              # Main exports
├── source-manager.ts     # SourceManager class
├── types.ts             # SOURCE-related types
└── source-utils.ts      # Helper utilities
```

**Key Methods**:
```typescript
class SourceManager {
  async createSourceZip(workspaceId: string): Promise<void>
  async extractSourceZip(workspaceId: string): Promise<void>
  async hasSourceFiles(workspaceId: string): Promise<boolean>
  async validateSourceStructure(workspaceId: string): Promise<SourceValidation>
}
```

### 1.2 Modify Workspace Manager (Existing)
**File**: `src/lib/workspace/workspace-manager.ts`

**Changes Required**:

#### Method: `createEPUBStructure()` (Lines 703-735)
```typescript
// CURRENT: Creates basic EPUB structure
// CHANGE TO: Create SOURCE/ directory with default content

async createEPUBStructure(workspaceId: string, metadata: Metadata): Promise<void> {
  // ... existing EPUB structure creation ...
  
  // ADD: Create SOURCE/ directory structure
  await this.fileStorage.writeFile(workspaceId, 'SOURCE/settings.json', 
    JSON.stringify(defaultSettings, null, 2));
  await this.fileStorage.writeFile(workspaceId, 'SOURCE/text/.gitkeep', '');
  await this.fileStorage.writeFile(workspaceId, 'SOURCE/scripts/.gitkeep', '');
  await this.fileStorage.writeFile(workspaceId, 'SOURCE/extensions/.gitkeep', '');
}
```

#### Method: `validateWorkspaceStructure()` (Lines 413-557)
```typescript
// CURRENT: Checks for orphaned files including EDITME/
// CHANGE TO: Exclude SOURCE/ files from orphan detection

// ADD: Special handling for SOURCE/ files
const sourceFiles = allFiles.filter(f => f.startsWith('SOURCE/'));
const epubFiles = allFiles.filter(f => !f.startsWith('SOURCE/'));

// Validate EPUB files normally
const orphanedFiles = epubFiles.filter(file => /* existing logic */);

// Validate SOURCE/ separately if present
if (sourceFiles.length > 0) {
  const sourceValidation = await this.sourceManager.validateSourceStructure(workspaceId);
  // Include source validation in results
}
```

#### Method: `resolveManifestPath()` (Lines 675-683)
```typescript
// CURRENT: Resolves file paths for manifest items
// CHANGE TO: Handle SOURCE.zip special case

resolveManifestPath(workspaceId: string, href: string): string {
  // ADD: Special handling for SOURCE.zip
  if (href === 'SOURCE.zip') {
    return null; // SOURCE.zip is manifest item but not direct file
  }
  
  // ... existing logic ...
}
```

### 1.3 Modify EPUB Packager (Existing)
**File**: `src/lib/epub/EPUBPackager.ts`

**Changes Required**:

#### Method: `readWorkspaceFiles()` (Lines 146-167)
```typescript
// CURRENT: Reads all workspace files directly
// CHANGE TO: Create SOURCE.zip if SOURCE/ directory exists

async readWorkspaceFiles(workspaceId: string): Promise<WorkspaceFile[]> {
  const allFiles = await this.fileStorage.listFiles(workspaceId);
  
  // Separate SOURCE/ files from EPUB files
  const sourceFiles = allFiles.filter(f => f.startsWith('SOURCE/'));
  const epubFiles = allFiles.filter(f => !f.startsWith('SOURCE/'));
  
  const workspaceFiles: WorkspaceFile[] = [];
  
  // Process EPUB files normally
  for (const filePath of epubFiles) {
    // ... existing logic ...
  }
  
  // CREATE SOURCE.zip if SOURCE/ files exist
  if (sourceFiles.length > 0) {
    await this.sourceManager.createSourceZip(workspaceId);
    
    // Add SOURCE.zip as workspace file
    const sourceZipContent = await this.fileStorage.readFile(workspaceId, 'SOURCE.zip');
    workspaceFiles.push({
      path: 'SOURCE.zip',
      content: sourceZipContent
    });
  }
  
  return workspaceFiles;
}
```

### 1.4 Modify EPUB Unpacker (Existing)
**File**: `src/lib/epub/EPUBUnpacker.ts`

**Changes Required**:

#### Method: `extractToWorkspace()` (Lines 225-278)
```typescript
// CURRENT: Extracts all files directly to workspace
// CHANGE TO: Detect and extract SOURCE.zip separately

async extractToWorkspace(zip: Zip, workspaceId: string): Promise<ExtractionResult> {
  // ... existing extraction logic ...
  
  // AFTER extraction, check for SOURCE.zip
  const sourceZipEntry = zip.entries.find(e => e.filename === 'SOURCE.zip');
  if (sourceZipEntry) {
    // Extract SOURCE.zip to workspace temporarily
    const sourceZipContent = await sourceZipEntry.extractAsArrayBuffer();
    await this.fileStorage.writeFile(workspaceId, 'SOURCE.zip', sourceZipContent);
    
    // Extract SOURCE.zip contents to SOURCE/ directory
    await this.sourceManager.extractSourceZip(workspaceId);
    
    // Remove SOURCE.zip file (keep as manifest item only)
    await this.fileStorage.deleteFile(workspaceId, 'SOURCE.zip');
  }
  
  return result;
}
```

## Phase 2: Transform Pipeline Implementation (New Feature)

### 2.1 Create Transform Pipeline (New)
**Location**: `src/lib/transform/`

**Files to Create**:
```
src/lib/transform/
├── index.ts                 # Main exports
├── transform-pipeline.ts    # Main pipeline class
├── settings-manager.ts      # Settings JSON handling
├── script-loader.ts         # Dynamic script loading
├── transform-executor.ts    # Sandboxed script execution
└── types.ts                # Transform-related types
```

**Key Implementation**:
```typescript
// transform-pipeline.ts
export class TransformPipeline {
  async loadSettings(workspaceId: string): Promise<TransformSettings> {
    const settingsPath = 'SOURCE/settings.json';
    if (await this.fileStorage.fileExists(workspaceId, settingsPath)) {
      const content = await this.fileStorage.readFileAsText(workspaceId, settingsPath);
      return JSON.parse(content);
    }
    return this.getDefaultSettings();
  }
  
  async transformText(workspaceId: string, plainText: string): Promise<string> {
    const settings = await this.loadSettings(workspaceId);
    const scripts = await this.loadTransformScripts(workspaceId, settings);
    
    // Execute text transform script
    return await this.executeTextTransform(plainText, scripts.textTransform);
  }
}
```

### 2.2 Create Settings Manager (New)
```typescript
// settings-manager.ts
export class SettingsManager {
  async loadSettings(workspaceId: string): Promise<EditmeSettings> {
    // Load and parse SOURCE/settings.json
  }
  
  async saveSettings(workspaceId: string, settings: EditmeSettings): Promise<void> {
    // Save to SOURCE/settings.json
  }
  
  async incrementDraftId(workspaceId: string): Promise<number> {
    // Update draft_id in settings
  }
}
```

## Phase 3: Integration & Testing

### 3.1 Update Dependency Tracker (Existing)
**File**: `src/lib/workspace/dependency-tracker.ts`

**Add New Method**:
```typescript
async findSourceDependencies(workspaceId: string): Promise<SourceDependencies> {
  // Analyze SOURCE/scripts/ and SOURCE/extensions/ for dependencies
  // Check transform script references in settings.json
  // Return dependency tree for SOURCE/ files
}
```

### 3.2 Create Integration Layer (New)
**File**: `src/lib/workspace/source-integration.ts`

**Purpose**: Bridge workspace manager with SOURCE.zip functionality
```typescript
export class SourceIntegration {
  async syncSourceWithWorkspace(workspaceId: string): Promise<void> {
    // Coordinate between workspace manager and source manager
  }
  
  async validateSourceIntegration(workspaceId: string): Promise<ValidationResult> {
    // Validate SOURCE/ and workspace consistency
  }
}
```

### 3.3 Update Type Definitions
**Files**: Various `types.ts` files

**Add New Types**:
```typescript
// src/lib/source/types.ts
export interface SourceValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileCount: number;
}

export interface TransformSettings {
  is_draft: boolean;
  draft_id: number;
  text_transform: string;
  dom_transforms: string[];
}
```

## Testing Strategy

### Phase 1 Testing
- [ ] SOURCE.zip creation from SOURCE/ directory
- [ ] SOURCE.zip extraction to SOURCE/ directory  
- [ ] Workspace validation with SOURCE/ files
- [ ] EPUB packaging with SOURCE.zip
- [ ] EPUB unpacking with SOURCE.zip detection

### Phase 2 Testing
- [ ] Transform pipeline script loading
- [ ] Settings.json parsing and validation
- [ ] Dynamic script execution
- [ ] Text and DOM transforms

### Phase 3 Testing
- [ ] End-to-end SOURCE.zip workflows
- [ ] Integration between all components
- [ ] Performance testing with large SOURCE/ directories
- [ ] Error handling and recovery scenarios

## Implementation Dependencies

### Critical Path:
1. **SourceManager** → **Workspace Manager modifications** → **EPUB Pack/Unpack updates**
2. **Transform Pipeline** → **Settings Manager** → **Integration testing**

### Parallel Development:
- SOURCE.zip core functionality (Phase 1)
- Transform pipeline implementation (Phase 2)
- Type definitions and integration helpers (Phase 3)

## File Modification Summary

### **High Priority Changes** (Existing Files):
- `src/lib/workspace/workspace-manager.ts` - 3 methods, ~50 lines
- `src/lib/epub/EPUBPackager.ts` - 1 method, ~30 lines
- `src/lib/epub/EPUBUnpacker.ts` - 1 method, ~20 lines

### **New Implementations** (New Files):
- `src/lib/source/` - Complete new module (~300 lines)
- `src/lib/transform/` - Complete new module (~500 lines)
- Integration helpers and type definitions (~100 lines)

### **Supporting Changes** (Existing Files):
- `src/lib/workspace/dependency-tracker.ts` - 1 new method
- Various type definition updates

## Next Steps

1. **Start with SourceManager implementation** - Foundation for all SOURCE.zip operations
2. **Modify workspace creation** - Update to create SOURCE/ structure
3. **Update EPUB workflows** - Package/unpack SOURCE.zip integration
4. **Implement transform pipeline** - Script execution and settings management
5. **Integration testing** - End-to-end workflow validation

The codebase foundation is strong. Most work involves extending existing patterns rather than rewriting core functionality.