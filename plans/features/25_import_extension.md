# 25. Extension Import Manager

## Overview

Provides a user interface for importing JavaScript extensions into the workspace, with automatic license detection and transform scaffold generation. Extensions are stored in `SOURCE/extensions/` and bundled with SOURCE.zip during EPUB packaging.

## Requirements

### Functional Requirements
- Upload JavaScript files from desktop to workspace
- Store extensions in `SOURCE/extensions/<name>/` directory structure
- Auto-detect and download license files from npm/CDN sources
- Generate placeholder `transform.js` for user customization
- Validate JavaScript syntax and detect library information
- Integration with transform pipeline (feature 12) and settings (feature 22)

### User Experience Requirements
- Drag-and-drop file upload interface
- Extension management (view, delete, update)
- License compliance indicators and warnings
- Transform script editor with syntax highlighting

## Dependencies

- **File Storage API**: Writing extensions to `SOURCE/extensions/` directory
- **SOURCE.zip Integration**: Extensions bundled during EPUB packaging
- **Transform Pipeline**: Extension scripts loaded during text/DOM transforms
- **Settings Manager**: Extension selection and configuration
- **Web APIs**: File upload, fetch for license detection

## Technical Approach

### Workspace Structure

```
workspace-{id}/
└── OEBPS/
    └── SOURCE/                    # Extracted from SOURCE.zip during editing
        └── extensions/
            ├── markdown-it/
            │   ├── markdown-it.min.js    # Uploaded library file
            │   ├── transform.js          # User-customizable transform
            │   ├── LICENSE                # Auto-downloaded license
            │   └── metadata.json         # Extension metadata
            └── abcjs/
                ├── abcjs-basic.js
                ├── transform.js
                ├── LICENSE.txt
                └── metadata.json
```

### SOURCE.zip Integration
- **During Editing**: Extensions accessible in `SOURCE/extensions/` directory
- **During Packaging**: All extension files bundled into SOURCE.zip
- **During Unpacking**: SOURCE.zip extracted, extensions available immediately
- **Transform Loading**: Pipeline loads extensions from extracted SOURCE/ directory

### Extension Directory Structure
Each extension follows a standardized structure:
- `<library>.js` - Main JavaScript library file
- `transform.js` - User-customizable transform script
- `LICENSE` or `LICENSE.txt` - Library license file
- `metadata.json` - Extension information and configuration

## API Design

### Extension Manager Interface

```typescript
interface ExtensionManager {
  // Extension import
  importExtension(workspaceId: string, file: File, extensionName?: string): Promise<ExtensionInfo>;
  
  // Extension management
  listExtensions(workspaceId: string): Promise<ExtensionInfo[]>;
  deleteExtension(workspaceId: string, extensionName: string): Promise<void>;
  updateExtension(workspaceId: string, extensionName: string, updates: Partial<ExtensionInfo>): Promise<void>;
  
  // Transform script management
  getTransformScript(workspaceId: string, extensionName: string): Promise<string>;
  updateTransformScript(workspaceId: string, extensionName: string, script: string): Promise<void>;
  
  // License detection
  detectLicense(libraryName: string, version?: string): Promise<LicenseInfo | null>;
  downloadLicense(workspaceId: string, extensionName: string, licenseUrl: string): Promise<void>;
}

interface ExtensionInfo {
  name: string;
  version?: string;
  description?: string;
  libraryFile: string;           // e.g., "markdown-it.min.js"
  transformFile: string;         // Always "transform.js"
  licenseFile?: string;          // e.g., "LICENSE.txt"
  metadata: ExtensionMetadata;
  hasCustomTransform: boolean;
  isActive: boolean;             // Used in transform pipeline
}

interface ExtensionMetadata {
  importedAt: string;            // ISO timestamp
  originalFilename: string;
  fileSize: number;
  libraryName?: string;          // Detected library name
  version?: string;              // Detected version
  license?: {
    type: string;                // e.g., "MIT", "Apache-2.0"
    url?: string;
    downloaded: boolean;
  };
  transforms: {
    text: boolean;               // Can transform text
    dom: boolean;                // Can transform DOM
  };
}

interface LicenseInfo {
  type: string;
  url: string;
  content?: string;
}
```

### License Detection API

```typescript
// License detection strategies
class LicenseDetector {
  async detectFromNpm(packageName: string, version?: string): Promise<LicenseInfo | null>;
  async detectFromCdnjs(libraryName: string): Promise<LicenseInfo | null>;
  async detectFromJsdelivr(packageName: string): Promise<LicenseInfo | null>;
  async detectFromUnpkg(packageName: string): Promise<LicenseInfo | null>;
  
  // Fallback: parse library file for license comments
  async detectFromSource(libraryContent: string): Promise<LicenseInfo | null>;
}
```

### Transform Template Generation

```typescript
// Generate scaffold transform.js based on detected library
class TransformGenerator {
  generateTextTransform(extensionInfo: ExtensionInfo): string;
  generateDomTransform(extensionInfo: ExtensionInfo): string;
  generateTemplate(libraryName: string, transformType: 'text' | 'dom'): string;
}

// Example generated transform.js for markdown-it
const MARKDOWN_IT_TEMPLATE = `
// Markdown-it text transform
// This transform converts markdown text to HTML using markdown-it
// Customize the configuration below for your needs

if (typeof window.markdownit === 'undefined') {
  throw new Error('markdown-it library not loaded. Please check extension import.');
}

const md = window.markdownit({
  html: true,         // Enable HTML tags
  xhtmlOut: true,     // Use XHTML output (required for EPUB)
  breaks: true,       // Convert line breaks to <br>
  linkify: true,      // Auto-link URLs
  typographer: true   // Enable smart quotes and other typography
});

// Transform function - customize as needed
function transform(plainText) {
  try {
    return md.render(plainText);
  } catch (error) {
    throw new Error(\`Markdown transform failed: \${error.message}\`);
  }
}

// Return the transformed HTML
return transform(plainText);
`;
```

## User Interface Design

### Extension Import Dialog
```typescript
// Svelte component for extension import
<ExtensionImport>
  <FileDropZone 
    on:files={handleFileUpload}
    accept=".js,.min.js"
    multiple={false}
  />
  
  <ExtensionPreview 
    {detectedInfo}
    {licenseStatus}
    on:confirm={confirmImport}
  />
</ExtensionImport>
```

### Extension Management View
```typescript
<ExtensionList>
  {#each extensions as ext}
    <ExtensionCard 
      {ext}
      on:edit={openTransformEditor}
      on:delete={confirmDelete}
      on:toggle={toggleActive}
    />
  {/each}
</ExtensionList>
```

## SOURCE.zip Workflow Integration

### Import Process
1. **File Upload**: User selects JavaScript file from desktop
2. **Library Detection**: Analyze file to extract library name/version
3. **License Detection**: Search npm/CDN for license information
4. **Directory Creation**: Create `SOURCE/extensions/<name>/` directory
5. **File Storage**: Save library file, generate transform.js, download license
6. **Metadata Storage**: Save extension metadata to metadata.json

### Packaging Integration
1. **Extension Collection**: Gather all `SOURCE/extensions/` during packaging
2. **SOURCE.zip Creation**: Bundle extensions with other SOURCE/ files
3. **Transform Registration**: Extensions available in packaged EPUB

### Unpacking Integration
1. **SOURCE.zip Extraction**: Extract extensions to `SOURCE/extensions/`
2. **Extension Discovery**: Scan for extension directories and metadata
3. **Transform Registration**: Make extensions available to transform pipeline

## Testing Considerations

### Unit Tests
- File upload handling and validation
- License detection from various sources (npm, cdnjs, jsdelivr)
- Transform template generation for common libraries
- Extension metadata parsing and validation
- Directory structure creation and cleanup

### Integration Tests
- End-to-end extension import workflow
- SOURCE.zip bundling and extraction of extensions
- Transform pipeline integration with imported extensions
- Settings integration for extension selection
- License compliance validation

### Browser Compatibility
- File API usage for upload handling
- Fetch API for license detection
- CORS handling for CDN license requests
- Large file handling and memory usage

## Implementation Notes

### Security Considerations
- **JavaScript Validation**: Basic syntax checking before import
- **File Size Limits**: Prevent extremely large library imports
- **Content Scanning**: Basic malware/suspicious code detection
- **Sandboxing**: Extensions run in controlled transform environment

### Performance Optimizations
- **Lazy Loading**: Load extension metadata only when needed
- **Caching**: Cache license detection results
- **Compression**: Minified libraries preferred for smaller SOURCE.zip

### Error Handling
- **Import Failures**: Clear feedback for unsupported files
- **License Detection Failures**: Graceful degradation with manual license option
- **Network Errors**: Offline license detection fallbacks
- **Storage Errors**: Cleanup on failed imports

### User Experience
- **Progress Indicators**: Show import/license detection progress
- **Validation Feedback**: Real-time feedback during import
- **Extension Status**: Clear indicators for active/inactive extensions
- **Transform Editor**: Syntax highlighting and error detection
