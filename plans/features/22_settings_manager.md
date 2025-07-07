# 22. Settings Manager

## Brainstorm

The Settings Manager provides a unified interface for managing three distinct types of settings:

1. **Global App Settings** (localStorage) - User preferences that persist across all workspaces
2. **Workspace Settings** (.workspace-metadata.json) - Workspace-specific editor configuration
3. **EPUB Settings** (SOURCE/settings.json) - Book-specific settings that travel with the EPUB

The UI uses an accordion layout with form inputs in the start pane and a live JSON preview of the active section in the end pane. Extension management is kept minimal with simple list/add/remove operations.

## Overview

Provides a unified interface for managing application settings across three storage tiers: global app preferences in localStorage, workspace-specific settings in `.workspace-metadata.json`, and EPUB-specific settings in `SOURCE/settings.json`. Features include theme selection, locale management, editor configuration, cache busting for development, transform pipeline selection, and minimal extension management. The UI uses an accordion layout with live JSON preview for transparency.

## Requirements

### Global Settings (localStorage)

- Theme selection (light/dark mode)
- Locale/language selection with i18n integration

### Workspace Settings (.workspace-metadata.json)

- Toggle 'Cache bust' mode for packaging the EPUB with draft_id
- Enable/disable advanced editor mode
- Editor preview delay configuration

### EPUB Settings (SOURCE/settings.json)

- Choose text transform script from available extensions
- Select DOM transform scripts (multiple)
- Set base name for new spine items (e.g., `chapter` → `chapter1`, `chapter2`)
- Cover creator configuration (template, colors, font)

### Extension Management

- List workspace extensions with file count/size
- Create new extension from uploaded JavaScript file
- Add scripts/licenses to existing extensions
- Remove extensions from workspace
- List globally cached extensions
- Import extensions from cache to workspace
- Remove extensions from global cache

## Dependencies

- **FileStorageAPI**: For reading/writing workspace and EPUB settings files
- **ExtensionManager**: For extension listing and management operations
- **i18n System**: For locale management and UI translations
- **Theme System**: For applying theme changes
- **OPFManager**: For updating book metadata during cache busting
- **EPUBPackager**: For incrementing draft_id during packaging

## Technical Approach

### Settings Storage

- **Location**: `SOURCE/settings.json` in workspace (bundled in `SOURCE.zip` during packaging)
- **Format**: JSON configuration file with typed schema validation
- **Integration**: Extracted from `SOURCE.zip` during EPUB unpacking, bundled during packaging

### Cache Busting

- `draft_id` number property incremented each time workspace is packaged
- When `bust_cache` is enabled, `draft_id` appended to book title in metadata and downloaded filename
- Helps cache busting in Apple Books app when repeatedly importing same book ID (the Books app caches css and js files per book title, so this forces clean import of all assets)
- Auto-detection: If imported EPUB has `bust_cache` set and `draft_id` matches title suffix, the app removes from book title on workspace creation

### Transform Pipeline Configuration

- `text_transform`: String pointing to `SOURCE/scripts/transform.js`
- `dom_transforms`: String array pointing to individual transform script paths
- **SOURCE.zip Integration**: Scripts loaded from extracted `SOURCE/` directory during editing

## API Design

### Settings Schema

```typescript
interface GlobalSettings {
  // UI preferences
  theme: 'light' | 'dark' | 'system';
  locale: string; // e.g., 'en', 'de', 'ar', 'he', 'ja', 'ka', 'zh-hant'
}

interface WorkspaceSettings {
  // Draft mode configuration
  bust_cache: boolean;
  draft_id: number;

  // Editor preferences
  editor?: {
    preview_delay_ms: number;
    advanced_mode: boolean;
  };
}

interface EPUBSettings {
  // Transform pipeline configuration
  text_transform: string; // Path to text transform script
  dom_transforms: string[]; // Array of DOM transform script paths

  // default base name for new spine items
  spine_basename: string;

  // Cover creator settings (see feature 24)
  cover?: {
    template: string;
    background_color: string;
    text_color: string;
    font_family: string;
  };
}
```

### Settings Manager API

```typescript
interface SettingsManager {
  // Global settings (localStorage)
  loadGlobalSettings(): GlobalSettings;
  saveGlobalSettings(settings: GlobalSettings): void;
  getDefaultGlobalSettings(): GlobalSettings;

  // Workspace settings (.workspace-metadata.json)
  loadWorkspaceSettings(workspaceId: string): Promise<WorkspaceSettings>;
  saveWorkspaceSettings(workspaceId: string, settings: WorkspaceSettings): Promise<void>;
  getDefaultWorkspaceSettings(): WorkspaceSettings;

  // EPUB settings (SOURCE/settings.json)
  loadEPUBSettings(workspaceId: string): Promise<EPUBSettings>;
  saveEPUBSettings(workspaceId: string, settings: EPUBSettings): Promise<void>;
  getDefaultEPUBSettings(): EPUBSettings;

  // Draft mode utilities
  incrementDraftId(workspaceId: string): Promise<number>;
  generateDraftTitle(baseTitle: string, draftId: number): string;
  extractDraftInfo(title: string): { baseTitle: string; draftId: number | null };

  // Transform script resolution
  resolveTransformScripts(
    workspaceId: string,
    settings: EPUBSettings
  ): Promise<{
    textTransform: string | null;
    domTransforms: string[];
  }>;

  // Settings validation
  validateGlobalSettings(settings: Partial<GlobalSettings>): SettingsValidation;
  validateWorkspaceSettings(settings: Partial<WorkspaceSettings>): SettingsValidation;
  validateEPUBSettings(settings: Partial<EPUBSettings>): SettingsValidation;

  // Extension management helpers
  getAvailableTransforms(workspaceId: string): Promise<TransformOption[]>;
}

interface SettingsValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface TransformOption {
  path: string; // e.g., "SOURCE/scripts/transform.js"
  extensionName: string; // e.g., "markdown-it"
  fileName: string; // e.g., "transform.js"
}
```

### Default Settings Examples

#### Global Settings (localStorage)

```json
{
  "theme": "system",
  "locale": "en"
}
```

#### Workspace Settings (.workspace-metadata.json)

```json
{
  "bust_cache": false,
  "draft_id": 0,
  "editor": {
    "advanced_mode": false,
    "preview_delay_ms": 500
  }
}
```

#### EPUB Settings (SOURCE/settings.json)

```json
{
  "text_transform": "SOURCE/scripts/transform.js",
  "dom_transforms": ["SOURCE/scripts/transformAbc.js"],
  "spine_basename": "chapter",
  "cover": {
    "template": "minimal",
    "background_color": "#ffffff",
    "text_color": "#000000",
    "font_family": "serif"
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

1. **Package EPUB**: Increment `draft_id` in `settings.json`
2. **Update Metadata**: Append draft ID to book title (e.g., "My Book 3")
3. **Filename Generation**: Include draft ID in downloaded filename
4. **Import Detection**: On unpacking, detect and clean draft title suffix

### Transform Integration

- Settings drive transform pipeline script selection
- Scripts loaded from extracted `SOURCE/` directory during editing
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
- Corrupted settings.json (fallback to defaults)
- Invalid transform script paths (graceful degradation)
- Draft title detection edge cases

## Implementation Notes

### Settings File Management

- **Global Settings**: Direct localStorage read/write with JSON serialization
- **Workspace Settings**: Update existing `.workspace-metadata.json` structure
- **EPUB Settings**: Atomic file operations in `SOURCE/settings.json`
- **Concurrency**: Handle multiple settings views/editors gracefully

### Integration Points

#### Theme Application

```typescript
// Apply theme change globally
function applyTheme(theme: 'light' | 'dark' | 'system') {
  if (theme === 'system') {
    // Use media query preference
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
```

#### Locale Change

```typescript
// Integrate with i18n system
import { setLocale } from '$lib/i18n';

function applyLocale(locale: string) {
  setLocale(locale);
  // Locale change triggers reactive UI updates automatically
}
```

#### Extension Integration

```typescript
// Populate transform dropdowns
async function loadTransformOptions(workspaceId: string): Promise<TransformOption[]> {
  const extensions = await extensionManager.listWorkspaceExtensions(workspaceId);
  const options: TransformOption[] = [];

  for (const ext of extensions) {
    for (const file of ext.files) {
      if (file.type === 'javascript') {
        options.push({
          path: `SOURCE/extensions/${ext.name}/${file.filename}`,
          extensionName: ext.name,
          fileName: file.filename,
        });
      }
    }
  }

  return options;
}
```

### Performance Considerations

- **Debounced Saves**: Debounce form changes to avoid excessive file writes
- **Cached Extension Lists**: Cache extension listings during settings session
- **Lazy Accordion Loading**: Only load data for open accordion sections
- **Optimistic UI**: Update UI immediately, save in background

### Error Handling

- **Storage Quota**: Check quota before saving large EPUB settings
- **Invalid JSON Recovery**: Backup and restore on parse errors
- **Extension Conflicts**: Prevent duplicate extension imports
- **Transform Validation**: Verify script paths exist before saving

### User Experience

#### UI Layout

- **Accordion Structure**: Collapsible sections for each settings category
  - Global Settings (theme, locale,)
  - Workspace Settings (cache busting, advanced mode)
  - EPUB Settings (transforms, spine basename, cover)
  - Extensions (workspace and cache management)
- **Split Pane View**:
  - Start pane: Form inputs for active accordion section
  - End pane: Live JSON preview of settings being edited
- **Real-time Updates**: Changes reflected immediately in JSON preview

#### Form Elements

- **Global Settings**:
  - Theme: Radio buttons (Light/Dark/System)
  - Locale: Dropdown with language names in native script

- **Workspace Settings**:
  - Cache Bust: Toggle switch with draft ID display
  - Advanced Mode: Toggle switch with feature list
  - Preview Delay: Slider (100-2000ms)

- **EPUB Settings**:
  - Text Transform: Dropdown of available scripts
  - DOM Transforms: Multi-select list
  - Spine Basename: Text input with example
  - Cover Settings: Collapsible sub-form

- **Extensions**:
  - Workspace list with size info and remove buttons
  - Cache list with "Add to Workspace" buttons
  - Upload button for new extensions
  - Add file button for existing extensions

#### Validation & Feedback

- **Inline Validation**: Error messages below invalid fields
- **Save Confirmation**: Toast notification on successful save
- **Reset Options**: Per-section reset to defaults
- **Dirty State**: Visual indicator for unsaved changes
