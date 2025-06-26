# 23. SOURCE.zip - Consolidated Editor Files

## Overview

Consolidates all workspace `SOURCE/` directory files into a single `SOURCE.zip` manifest item during EPUB packaging. This maintains clean EPUB structure while preserving the workspace editing experience with individual SOURCE files.

## Requirements

### Functional Requirements

- Bundle all `SOURCE/` files into `SOURCE.zip` during EPUB packaging
- Extract `SOURCE.zip` to `SOURCE/` directory during EPUB unpacking
- Maintain workspace `SOURCE/` structure for editing (settings.json, text/, extensions/, scripts/)
- Auto-manage `SOURCE.zip` manifest item (hidden from user interface)
- Support empty `SOURCE/` directories (no SOURCE.zip created)
- Backward compatibility with existing EPUBs (with/without SOURCE.zip)

### Performance Requirements

- Use STORE compression for `SOURCE.zip` (avoid double compression)
- Stream processing for large SOURCE directories
- Minimal impact on workspace operations (only affects pack/unpack)

## Dependencies

- **File Storage API**: Workspace file reading/writing (Phase 1)
- **ZIP Library**: Existing `ZipWriter` and `Zip` classes (`src/lib/zip/`)
- **EPUB Packaging**: `EPUBPackager.ts` modifications
- **EPUB Unpacking**: `EPUBUnpacker.ts` modifications
- **Workspace Manager**: `workspace-manager.ts` integration
- **OPF Management**: Manifest item handling (`opf-utils.ts`)

## Technical Approach

### Workspace Structure

```
# During Editing (workspace):
workspace-{id}/
└── OEBPS/
    ├── content.opf
    ├── EDITME.html
    ├── Text/           # EPUB content
    └── SOURCE/         # Editor files (not in manifest)
        ├── settings.json
        ├── text/       # Plain text sources
        ├── extensions/ # Transform extensions
        └── scripts/    # Custom transforms

# In Packaged EPUB:
epub-file.epub
├── mimetype
├── META-INF/container.xml
└── OEBPS/
    ├── content.opf    # Contains SOURCE.zip manifest item
    ├── EDITME.html
    ├── Text/          # EPUB content
    └── SOURCE.zip     # All SOURCE/ files compressed
```

### Packaging Workflow

1. **Collect SOURCE files**: Scan workspace `SOURCE/` directory
2. **Create SOURCE.zip**: Bundle files using existing ZIP library
3. **Update manifest**: Add `SOURCE.zip` with media-type `application/zip`
4. **Package EPUB**: Include SOURCE.zip in final EPUB ZIP

### Unpacking Workflow

1. **Detect SOURCE.zip**: Check manifest for SOURCE.zip item
2. **Extract to workspace**: Unpack SOURCE.zip to `SOURCE/` directory
3. **Clean up**: Remove SOURCE.zip file from workspace
4. **Validate**: Ensure SOURCE/ structure is valid

## API Design

### Workspace Manager Extensions

```typescript
interface SourceZipManager {
  // SOURCE.zip creation
  createSourceZip(workspaceId: string): Promise<Blob | null>;

  // SOURCE.zip extraction
  extractSourceZip(workspaceId: string, sourceZipBlob: Blob): Promise<void>;

  // SOURCE/ validation
  validateSourceStructure(workspaceId: string): Promise<SourceValidation>;

  // SOURCE/ file management
  hasSourceFiles(workspaceId: string): Promise<boolean>;
  listSourceFiles(workspaceId: string): Promise<string[]>;
}

interface SourceValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileCount: number;
}
```

### EPUB Packager Integration

```typescript
// Modified EPUBPackager method
class EPUBPackager {
  private async createSourceZipIfNeeded(workspaceId: string): Promise<{
    sourceZip: Blob | null;
    manifestItem: ManifestItem | null;
  }> {
    const sourceManager = new SourceZipManager();

    if (await sourceManager.hasSourceFiles(workspaceId)) {
      const sourceZip = await sourceManager.createSourceZip(workspaceId);

      return {
        sourceZip,
        manifestItem: {
          id: 'source-zip',
          href: 'SOURCE.zip',
          mediaType: 'application/zip',
        },
      };
    }

    return { sourceZip: null, manifestItem: null };
  }
}
```

### EPUB Unpacker Integration

```typescript
// Modified EPUBUnpacker method
class EPUBUnpacker {
  private async handleSourceZip(workspaceId: string, manifest: ManifestItem[]): Promise<void> {
    const sourceItem = manifest.find(item => item.href === 'SOURCE.zip');

    if (sourceItem) {
      const sourceZipBlob = await this.readFileFromZip('OEBPS/SOURCE.zip');
      const sourceManager = new SourceZipManager();

      await sourceManager.extractSourceZip(workspaceId, sourceZipBlob);

      // Remove SOURCE.zip from workspace (keep only extracted files)
      await deleteFile(workspaceId, 'SOURCE.zip');
    }
  }
}
```

## Implementation Plan

### Phase 1: Core SOURCE.zip Operations

1. **Add SourceZipManager class** to `workspace-manager.ts`
2. **Implement createSourceZip()** - bundle SOURCE/ files using existing ZIP library
3. **Implement extractSourceZip()** - extract to workspace SOURCE/ directory
4. **Add validation methods** - ensure SOURCE/ structure integrity

### Phase 2: EPUB Integration

1. **Modify EPUBPackager** - detect SOURCE files and create SOURCE.zip
2. **Update manifest generation** - add SOURCE.zip item when present
3. **Modify EPUBUnpacker** - detect and extract SOURCE.zip during unpacking
4. **Update workspace validation** - exclude SOURCE/ from orphan file checks

### Phase 3: Error Handling & Edge Cases

1. **Empty SOURCE/ handling** - skip SOURCE.zip creation
2. **Corrupted SOURCE.zip** - graceful degradation and error reporting
3. **Memory optimization** - streaming for large SOURCE directories

## Testing Considerations

### Unit Tests

- **SOURCE.zip creation**: Various file types, empty directories, large files
- **SOURCE.zip extraction**: Validate directory structure recreation
- **Manifest integration**: SOURCE.zip item addition/removal
- **Edge cases**: Empty SOURCE/, corrupted ZIP, missing files

### Integration Tests

- **Round-trip testing**: Package → Unpack → Verify SOURCE/ structure
- **Workspace operations**: Ensure SOURCE/ editing works after extraction
- **EPUB validation**: Verify packaged EPUBs remain valid
- **Performance testing**: Large SOURCE/ directories

### Browser Compatibility

- **ZIP operations**: Test with existing ZIP library across browsers
- **File system operations**: OPFS and IndexedDB fallback scenarios
- **Memory usage**: Large SOURCE.zip handling

## Error Handling

### SOURCE.zip Creation Errors

- **File access failures**: Report specific files that cannot be read
- **ZIP creation failures**: Fallback to individual file packaging
- **Memory constraints**: Stream processing for large directories

### SOURCE.zip Extraction Errors

- **Corrupted ZIP**: Report corruption and skip extraction
- **Invalid structure**: Validate extracted files meet SOURCE/ requirements
- **File conflicts**: Handle existing SOURCE/ files during extraction

### User Experience

- **Progress indication**: Show SOURCE.zip operations progress
- **Error messaging**: Clear explanations of SOURCE.zip issues
- **Recovery options**: Manual SOURCE/ management if needed

## Implementation Notes

### Compression Strategy

- **STORE method**: No compression for SOURCE.zip (EPUB already compresses)
- **Performance**: Avoid double compression overhead
- **Compatibility**: Standard ZIP format for maximum compatibility

### Manifest Management

- **Auto-generated ID**: Use consistent `source-zip` identifier
- **Media type**: `application/zip` for proper EPUB validation
- **Hidden from UI**: Don't show SOURCE.zip in user-facing manifest views

### Migration Strategy

- **No consideration**: Don't support migration.

### Security Considerations

- **Zip bomb protection**: File size and extraction limits
- **Path traversal**: Validate extracted file paths
- **Content validation**: Ensure extracted files are safe for workspace
