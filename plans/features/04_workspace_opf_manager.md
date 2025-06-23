# 04. Workspace & OPF Manager

## Overview
Provides high-level workspace management with integrated EPUB content.opf parsing, generation, and manipulation. Combines workspace operations with EPUB-aware metadata handling for a cohesive development experience.

## Requirements
- Create new EPUB workspaces with proper structure
- List available workspaces with metadata (title/author)
- Switch between workspaces with validation
- Parse and generate content.opf files
- Manage manifest items and spine ordering
- Provide metadata extraction for UI components

## Dependencies
- **#1 File Storage API** - for workspace storage operations
- **#2 EPUB Unpacking** - leverages existing OPF parsing logic
- **#3 EPUB Packaging** - leverages existing metadata extraction

## Technical Approach
- Build on existing EPUB parsing/generation capabilities
- Provide high-level API that combines storage + OPF operations
- Cache workspace metadata for performance
- Integrate with existing XML validation and parsing
- Support both EPUB 2.0 and 3.0 structures

## API Design
```typescript
interface WorkspaceManager {
  // High-level workspace operations
  listWorkspacesWithMetadata(): Promise<WorkspaceInfo[]>
  createEPUBWorkspace(metadata: EPUBMetadata): Promise<string>
  switchWorkspace(workspaceId: string): Promise<WorkspaceInfo>
  deleteWorkspace(workspaceId: string): Promise<void>
  
  // OPF operations
  getWorkspaceOPF(workspaceId: string): Promise<OPFDocument>
  updateWorkspaceOPF(workspaceId: string, opf: OPFDocument): Promise<void>
  
  // Manifest and spine management
  addManifestItem(workspaceId: string, item: ManifestItem): Promise<void>
  removeManifestItem(workspaceId: string, itemId: string): Promise<void>
  updateSpineOrder(workspaceId: string, spineItems: string[]): Promise<void>
  
  // Metadata shortcuts
  getWorkspaceMetadata(workspaceId: string): Promise<EPUBMetadata>
  updateMetadata(workspaceId: string, metadata: EPUBMetadata): Promise<void>
  
  // Utilities
  validateWorkspaceStructure(workspaceId: string): Promise<ValidationResult>
  generateWorkspacePreview(workspaceId: string): Promise<WorkspacePreview>
}

interface WorkspaceInfo {
  id: string
  title: string
  author?: string
  language: string
  lastModified: Date
  fileCount: number
  totalSize: number
  epubVersion: string // "EPUB 2.0" | "EPUB 3.0"
}

interface OPFDocument {
  metadata: EPUBMetadata
  manifest: ManifestItem[]
  spine: SpineItem[]
  guide?: GuideItem[]
  version: string
}

interface ManifestItem {
  id: string
  href: string
  mediaType: string
  properties?: string[]
  fallback?: string
}

interface SpineItem {
  idref: string
  linear?: boolean
  properties?: string[]
}

interface EPUBMetadata {
  // Required Dublin Core elements
  title: string
  language: string
  identifier: string
  
  // Optional Dublin Core elements
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
  
  // EPUB-specific metadata
  modifiedDate?: string
  epubVersion?: string
}

interface WorkspacePreview {
  metadata: EPUBMetadata
  manifestSummary: {
    textItems: number
    imageItems: number
    audioItems: number
    otherItems: number
  }
  spineOrder: string[]
  estimatedEPUBSize: number
}
```

## Workspace Creation
- Generate unique workspace IDs using crypto.randomUUID()
- Create standard EPUB directory structure:
  ```
  workspace-{id}/
  ├── mimetype
  ├── META-INF/
  │   └── container.xml
  ├── OEBPS/
  │   ├── content.opf
  │   ├── Text/
  │   ├── Images/
  │   ├── Styles/
  │   └── Audio/
  └── EDITME/
      ├── src/
      └── scripts/
  ```
- Pre-populate with minimal valid EPUB structure
- Generate initial content.opf with provided metadata

## OPF Integration
**Leverages existing EPUB functionality:**
- Use `EPUBPackager.parseOPFMetadata()` for metadata extraction
- Use `EPUBUnpacker.parseContainerXml()` for container parsing
- Use `EPUBUnpacker.validateXML()` for XML validation
- Extend with OPF generation and modification capabilities

**New OPF operations:**
- Generate complete content.opf XML from OPFDocument
- Add/remove manifest items with automatic ID generation
- Update spine order with validation
- Modify metadata fields with proper XML escaping
- Validate OPF structure against EPUB specification

## Workspace Metadata Caching
- Store lightweight metadata in `.workspace-metadata.json`
- Cache includes: title, author, language, file counts, sizes
- Update cache on OPF modifications
- Fallback to OPF parsing if cache missing or stale
- Memory cache for frequently accessed workspaces

## Manifest Management
- Auto-generate unique IDs for new manifest items
- Validate href paths against workspace files
- Detect media types from file extensions
- Handle manifest item dependencies (CSS, images)
- Synchronize spine references when manifest items change
- Support EPUB 3.0 properties (nav, cover-image, scripted)

## Spine Management
- Maintain reading order through spine items
- Validate all spine item references exist in manifest
- Support linear/non-linear spine items
- Handle spine item properties (page-spread-left, etc.)
- Reorder spine items with drag-and-drop support

## Workspace Validation
- Check for required EPUB files (mimetype, container.xml, OPF)
- Validate OPF structure and required metadata
- Verify all spine items reference existing manifest items
- Check for orphaned files not in manifest
- Validate file paths and media types
- Report validation errors with specific locations

## Error Handling
- Workspace corruption detection and reporting
- Missing or malformed OPF file handling
- Invalid XML parsing with detailed error messages
- Manifest/spine synchronization conflicts
- Storage access errors with retry logic
- Concurrent modification detection

## Performance Optimizations
- Lazy loading of workspace contents
- Metadata caching with TTL expiration
- Batch operations for multiple manifest changes
- Background validation for large workspaces
- Efficient workspace switching with cleanup

## EPUB Version Support
- Detect version from OPF package element
- Support EPUB 2.0 NCX navigation
- Support EPUB 3.0 nav documents
- Handle version-specific validation rules
- Provide migration assistance between versions

## Testing Strategy
- Unit tests for OPF parsing/generation
- Integration tests with File Storage API
- Workspace lifecycle testing (create/switch/delete)
- Manifest manipulation accuracy tests
- Validation logic verification
- Performance testing with large workspaces
- Concurrent access testing

## Implementation Plan

### Phase 1: Core Workspace Operations
- Basic workspace CRUD operations
- Integration with File Storage API
- Workspace structure creation
- Simple metadata caching

### Phase 2: OPF Integration
- Extend existing EPUB parsing capabilities
- OPF generation and modification
- Metadata extraction and updates
- Basic validation

### Phase 3: Manifest & Spine Management
- Add/remove manifest items
- Spine order management
- Advanced validation
- Error handling

### Phase 4: Performance & Polish
- Caching optimizations
- Background validation
- Workspace templates
- Migration utilities

## Storybook Demo
**File:** `src/stories/WorkspaceOPFDemo.svelte`

**Scenarios:**
- Create new workspace with metadata form
- List workspaces with title/author display
- Switch between workspaces
- Basic manifest item management
- OPF metadata editing
- Validation error display
- Workspace structure visualization

## Integration Notes
- Ready for UI components (Features 9-11)
- Provides metadata for workspace dropdowns
- Integrates with existing EPUB pack/unpack workflow
- Supports round-trip EPUB editing
- Foundation for content management features