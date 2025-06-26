# 22. EDITME Settings Manager

## Overview

Manages per-workspace settings stored in `SOURCE/settings.json`, providing configuration for draft mode, transform pipeline selection, and editor behavior. Settings are bundled with SOURCE.zip during EPUB packaging.

## Requirements

- Toggle 'draft' mode for packaging the epub
- Choose which script to be used for text transform in the text pipeline
- Choose which scripts to be used for dom transform
- Cover creator parameterization (see feature 24 Cover Creator)
- TBD

## Dependencies

- TBD

## Technical Approach

### Settings Storage

- **Location**: `SOURCE/settings.json` in workspace (bundled in SOURCE.zip during packaging)
- **Format**: JSON configuration file with typed schema validation
- **Integration**: Extracted from SOURCE.zip during EPUB unpacking, bundled during packaging

### Draft Mode Management

- `draft_id` number property incremented each time workspace is packaged
- When enabled, `draft_id` appended to book title in metadata and downloaded filename
- Helps cache busting in Apple Books app when repeatedly importing same book ID
- Auto-detection: If imported EPUB has `is_draft` set and `draft_id` matches title suffix, removes from book title on workspace creation

### Transform Pipeline Configuration

- `text_transform`: String pointing to `SOURCE/extensions/<ext_name>/transform.js`
- `dom_transforms`: String array pointing to individual transform script paths
- **SOURCE.zip Integration**: Scripts loaded from extracted SOURCE/ directory during editing

## API Design

### Settings Schema

```typescript
interface EditmeSettings {
  // Draft mode configuration
  is_draft: boolean;
  draft_id: number;

  // Transform pipeline configuration
  text_transform: string; // Path to text transform script
  dom_transforms: string[]; // Array of DOM transform script paths

  // Cover creator settings (see feature 24)
  cover?: {
    template: string;
    background_color: string;
    text_color: string;
    font_family: string;
  };

  // Editor preferences
  editor?: {
    auto_save: boolean;
    preview_delay_ms: number;
  };
}
```

### Settings Manager API

```typescript
interface SettingsManager {
  // Settings CRUD operations
  loadSettings(workspaceId: string): Promise<EditmeSettings>;
  saveSettings(workspaceId: string, settings: EditmeSettings): Promise<void>;
  getDefaultSettings(): EditmeSettings;

  // Draft mode utilities
  incrementDraftId(workspaceId: string): Promise<number>;
  generateDraftTitle(baseTitle: string, draftId: number): string;
  extractDraftInfo(title: string): { baseTitle: string; draftId: number | null };

  // Transform script resolution
  resolveTransformScripts(
    workspaceId: string,
    settings: EditmeSettings
  ): Promise<{
    textTransform: string | null;
    domTransforms: string[];
  }>;

  // Settings validation
  validateSettings(settings: Partial<EditmeSettings>): SettingsValidation;
}

interface SettingsValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

### Default Settings Example

```json
{
  "is_draft": false,
  "draft_id": 0,
  "text_transform": "SOURCE/extensions/markdown-it/transform.js",
  "dom_transforms": ["SOURCE/extensions/abcjs-basic/transform.js"],
  "cover": {
    "template": "minimal",
    "background_color": "#ffffff",
    "text_color": "#000000",
    "font_family": "serif"
  },
  "editor": {
    "auto_save": true,
    "preview_delay_ms": 500
  }
}
```

## SOURCE.zip Integration

### Settings Lifecycle

1. **EPUB Unpacking**: Extract SOURCE.zip → `SOURCE/settings.json` available in workspace
2. **Workspace Editing**: Read/write settings from `SOURCE/settings.json` directly
3. **EPUB Packaging**: Bundle `SOURCE/settings.json` into SOURCE.zip
4. **Settings Persistence**: Settings travel with the EPUB file

### Draft Mode Workflow

1. **Package EPUB**: If `is_draft` enabled, increment `draft_id` in settings
2. **Update Metadata**: Append draft ID to book title (e.g., "My Book 3")
3. **Filename Generation**: Include draft ID in downloaded filename
4. **Import Detection**: On unpacking, detect and clean draft title suffix

### Transform Integration

- Settings drive transform pipeline script selection
- Scripts loaded from extracted SOURCE/ directory during editing
- Path validation ensures referenced scripts exist in workspace

## Testing Considerations

### Unit Tests

- Settings loading/saving with various configurations
- Draft ID increment and title generation
- Transform script path resolution and validation
- Settings schema validation with invalid inputs
- Default settings generation

### Integration Tests

- Settings persistence through EPUB pack/unpack cycle
- Draft mode title manipulation during packaging
- Transform pipeline integration with settings-driven script selection
- SOURCE.zip bundling and extraction of settings.json

### Edge Cases

- Missing settings.json (fallback to defaults)
- Corrupted settings.json (validation and recovery)
- Invalid transform script paths (graceful degradation)
- Draft title detection edge cases

## Implementation Notes

### Settings File Management

- **Atomic updates**: Use temporary file + rename for settings.json writes
- **Backup strategy**: Keep previous settings version for recovery
- **Migration**: Handle settings schema evolution gracefully

### Performance Considerations

- **Caching**: Cache parsed settings in memory during workspace session
- **Lazy loading**: Load settings only when needed
- **Batch updates**: Combine multiple setting changes into single write

### Error Handling

- **Validation errors**: Clear user feedback for invalid settings
- **File access errors**: Fallback to defaults if settings.json inaccessible
- **Transform errors**: Settings-driven error context (which script failed)

### User Experience

- **Settings UI**: Form-based editor with real-time validation
- **Draft indicators**: Clear visual indication when draft mode enabled
- **Transform selection**: Dropdown populated from available extensions
- **Settings reset**: Option to restore default settings
