# 04. Workspace Management

## Overview
Manages multiple EPUB workspaces with unique identifiers, providing workspace creation, listing, switching, and metadata extraction for UI display.

## Requirements
- Create new workspaces with unique IDs
- List available workspaces from storage
- Switch between workspaces
- Extract title/author from content.opf for workspace dropdown

## Dependencies
- **#1 File Storage API** - for workspace storage operations

## Technical Approach
- Generate unique workspace IDs (UUID or timestamp-based)
- Store workspace metadata separately for quick access
- Cache workspace information for performance
- Handle workspace corruption gracefully

## API Design
```typescript
interface WorkspaceManager {
  // Workspace lifecycle
  createWorkspace(name?: string): Promise<string>
  deleteWorkspace(id: string): Promise<void>
  listWorkspaces(): Promise<WorkspaceInfo[]>
  
  // Workspace operations
  switchWorkspace(id: string): Promise<void>
  getCurrentWorkspace(): string | null
  
  // Metadata extraction
  getWorkspaceMetadata(id: string): Promise<WorkspaceMetadata>
  refreshWorkspaceCache(): Promise<void>
}

interface WorkspaceInfo {
  id: string
  name: string
  title?: string
  author?: string
  lastModified: Date
  size?: number
}

interface WorkspaceMetadata {
  title: string
  author?: string
  language: string
  identifier: string
  created: Date
  modified: Date
}
```

## Workspace ID Generation
- Use crypto.randomUUID() if available
- Fallback to timestamp + random suffix
- Ensure uniqueness across storage backends
- Human-readable format for debugging

## Workspace Structure
```
workspace-{id}/
├── META-INF/
│   └── content.opf
├── OEBPS/
│   ├── content files
│   └── styles/
├── EDITME/
│   ├── src/
│   └── scripts/
└── .workspace-metadata.json
```

## Metadata Caching
- Store workspace metadata in separate file
- Cache in memory for quick access
- Update cache on workspace modifications
- Fallback to parsing content.opf if cache missing

## Content.opf Parsing
- Extract title, author, language from metadata
- Handle multiple authors
- Parse creation/modification dates
- Extract identifier for uniqueness

## Workspace Switching
- Save current workspace state
- Load new workspace configuration
- Update UI to reflect current workspace
- Handle switching errors gracefully

## Error Handling
- Corrupted workspace detection
- Missing content.opf handling
- Storage access errors
- Invalid workspace ID formats
- Concurrent access conflicts

## Performance Considerations
- Lazy loading of workspace contents
- Metadata caching strategy
- Limit number of concurrent workspaces
- Background workspace validation

## Testing Considerations
- Test workspace creation/deletion
- Test metadata extraction accuracy
- Test workspace switching edge cases
- Test corrupted workspace handling
- Test concurrent workspace access
- Verify unique ID generation

## Implementation Notes
- Start with basic CRUD operations
- Add metadata extraction incrementally
- Implement caching for performance
- Consider workspace templates for new projects
- Add workspace export/import capabilities later