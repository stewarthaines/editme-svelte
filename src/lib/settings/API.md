# Settings Manager API Documentation

## Overview

The Settings Manager provides a unified interface for managing application settings across three storage tiers:

1. **Global Settings** (localStorage) - User preferences that persist across all workspaces
2. **Workspace Settings** (.workspace-metadata.json) - Workspace-specific editor configuration
3. **EPUB Settings** (SOURCE/settings.json) - Book-specific settings that travel with the EPUB

The manager integrates with existing systems including the theme store, i18n localization, extension manager, and file storage APIs to provide a cohesive settings experience.

## Main Classes

### SettingsManager

Core class that orchestrates all settings operations across the three storage tiers, providing validation, defaults, and integration with other system components.

## Constructor

#### SettingsManager()

```typescript
constructor(fileStorage: FileStorageAPI, extensionManager: ExtensionManager)
```

**Input:**

- `fileStorage: FileStorageAPI` - Initialized file storage instance for workspace/EPUB settings
- `extensionManager: ExtensionManager` - Extension manager instance for transform script discovery

**Output:** `SettingsManager` instance

**Side Effects:** None (lazy initialization)

**Usage:**

```typescript
import { FileStorageAPI } from '$lib/storage';
import { ExtensionManager } from '$lib/extensions';
import { SettingsManager } from '$lib/settings';

const fileStorage = new FileStorageAPI();
await fileStorage.init();

const extensionManager = new ExtensionManager(fileStorage);
const settingsManager = new SettingsManager(fileStorage, extensionManager);
```

## Global Settings Methods

Global settings are stored in localStorage and persist across all workspaces.

#### loadGlobalSettings()

```typescript
loadGlobalSettings(): GlobalSettings
```

**Input:** None

**Output:** `GlobalSettings` - Current global settings or defaults if not found

**Side Effects:** None (read-only from localStorage)

**Usage:**

```typescript
const globalSettings = settingsManager.loadGlobalSettings();
console.log('Current theme:', globalSettings.theme);
console.log('Current locale:', globalSettings.locale);
console.log('Editor font size:', globalSettings.editor_font_size);
```

#### saveGlobalSettings()

```typescript
saveGlobalSettings(settings: GlobalSettings): void
```

**Input:**

- `settings: GlobalSettings` - Complete global settings object to save

**Output:** None

**Side Effects:**

- Writes to localStorage key `editme_global_settings`
- Updates theme store if theme changed
- Updates locale if language changed

**Usage:**

```typescript
const settings = settingsManager.loadGlobalSettings();
settings.editor_font_size = 16;
settingsManager.saveGlobalSettings(settings);
```

#### getDefaultGlobalSettings()

```typescript
getDefaultGlobalSettings(): GlobalSettings
```

**Input:** None

**Output:** `GlobalSettings` - Default global settings

**Side Effects:** None (pure function)

**Usage:**

```typescript
const defaults = settingsManager.getDefaultGlobalSettings();
// Returns: { theme: 'system', locale: 'en', editor_font_size: 14 }
```

## Workspace Settings Methods

Workspace settings are stored in `.workspace-metadata.json` within each workspace.

#### loadWorkspaceSettings()

```typescript
loadWorkspaceSettings(workspaceId: string): Promise<WorkspaceSettings>
```

**Input:**

- `workspaceId: string` - Target workspace identifier

**Output:** `Promise<WorkspaceSettings>` - Current workspace settings or defaults

**Side Effects:** None (reads from file storage)

**Usage:**

```typescript
const workspaceSettings = await settingsManager.loadWorkspaceSettings('workspace-123');
console.log('Cache busting enabled:', workspaceSettings.bust_cache);
console.log('Current draft ID:', workspaceSettings.draft_id);
```

#### saveWorkspaceSettings()

```typescript
saveWorkspaceSettings(workspaceId: string, settings: WorkspaceSettings): Promise<void>
```

**Input:**

- `workspaceId: string` - Target workspace identifier
- `settings: WorkspaceSettings` - Complete workspace settings to save

**Output:** `Promise<void>`

**Side Effects:** Updates `.workspace-metadata.json` in workspace

**Usage:**

```typescript
const settings = await settingsManager.loadWorkspaceSettings('workspace-123');
settings.editor.advanced_mode = true;
await settingsManager.saveWorkspaceSettings('workspace-123', settings);
```

#### getDefaultWorkspaceSettings()

```typescript
getDefaultWorkspaceSettings(): WorkspaceSettings
```

**Input:** None

**Output:** `WorkspaceSettings` - Default workspace settings

**Side Effects:** None (pure function)

**Usage:**

```typescript
const defaults = settingsManager.getDefaultWorkspaceSettings();
// Returns: {
//   bust_cache: false,
//   draft_id: 0,
//   editor: { advanced_mode: false, preview_delay_ms: 500 }
// }
```

## EPUB Settings Methods

EPUB settings are stored in `SOURCE/settings.json` and travel with the EPUB file.

#### loadEPUBSettings()

```typescript
loadEPUBSettings(workspaceId: string): Promise<EPUBSettings>
```

**Input:**

- `workspaceId: string` - Target workspace identifier

**Output:** `Promise<EPUBSettings>` - Current EPUB settings or defaults

**Side Effects:** None (reads from SOURCE/settings.json)

**Usage:**

```typescript
const epubSettings = await settingsManager.loadEPUBSettings('workspace-123');
console.log('Text transform:', epubSettings.text_transform);
console.log('DOM transforms:', epubSettings.dom_transforms);
```

#### saveEPUBSettings()

```typescript
saveEPUBSettings(workspaceId: string, settings: EPUBSettings): Promise<void>
```

**Input:**

- `workspaceId: string` - Target workspace identifier
- `settings: EPUBSettings` - Complete EPUB settings to save

**Output:** `Promise<void>`

**Side Effects:** Writes to `SOURCE/settings.json` in workspace

**Usage:**

```typescript
const settings = await settingsManager.loadEPUBSettings('workspace-123');
settings.spine_basename = 'section';
settings.text_transform = 'SOURCE/scripts/transform.js';
await settingsManager.saveEPUBSettings('workspace-123', settings);
```

#### getDefaultEPUBSettings()

```typescript
getDefaultEPUBSettings(): EPUBSettings
```

**Input:** None

**Output:** `EPUBSettings` - Default EPUB settings

**Side Effects:** None (pure function)

**Usage:**

```typescript
const defaults = settingsManager.getDefaultEPUBSettings();
// Returns: {
//   text_transform: 'SOURCE/scripts/transform.js',
//   dom_transforms: [],
//   spine_basename: 'chapter',
//   cover: { template: 'minimal', ... }
// }
```

## Draft Mode Utilities

Methods for managing cache busting and draft mode functionality.

#### incrementDraftId()

```typescript
incrementDraftId(workspaceId: string): Promise<number>
```

**Input:**

- `workspaceId: string` - Target workspace identifier

**Output:** `Promise<number>` - New draft ID after increment

**Side Effects:**

- Updates `draft_id` in workspace settings
- Saves updated settings to `.workspace-metadata.json`

**Usage:**

```typescript
// Called during EPUB packaging when bust_cache is enabled
const newDraftId = await settingsManager.incrementDraftId('workspace-123');
console.log('Packaging with draft ID:', newDraftId);
```

#### generateDraftTitle()

```typescript
generateDraftTitle(baseTitle: string, draftId: number): string
```

**Input:**

- `baseTitle: string` - Original book title
- `draftId: number` - Draft ID to append

**Output:** `string` - Title with draft ID suffix

**Side Effects:** None (pure function)

**Usage:**

```typescript
const draftTitle = settingsManager.generateDraftTitle('My Book', 3);
// Returns: 'My Book 3'

const draftTitle2 = settingsManager.generateDraftTitle('Guide to Testing', 1);
// Returns: 'Guide to Testing 1'
```

#### extractDraftInfo()

```typescript
extractDraftInfo(title: string): { baseTitle: string; draftId: number | null }
```

**Input:**

- `title: string` - Book title that may contain draft ID suffix

**Output:** Object containing:

- `baseTitle: string` - Title without draft ID
- `draftId: number | null` - Extracted draft ID or null if not found

**Side Effects:** None (pure function)

**Usage:**

```typescript
const info = settingsManager.extractDraftInfo('My Book 3');
// Returns: { baseTitle: 'My Book', draftId: 3 }

const info2 = settingsManager.extractDraftInfo('Regular Title');
// Returns: { baseTitle: 'Regular Title', draftId: null }
```

## Transform Management Methods

Methods for discovering and validating transform scripts from extensions.

#### getAvailableTransforms()

```typescript
getAvailableTransforms(workspaceId: string): Promise<TransformOption[]>
```

**Input:**

- `workspaceId: string` - Target workspace identifier

**Output:** `Promise<TransformOption[]>` - Array of available transform scripts

**Side Effects:** None (reads extension information)

**Usage:**

```typescript
const transforms = await settingsManager.getAvailableTransforms('workspace-123');
// Returns array of options for populating dropdowns:
// [
//   {
//     path: 'SOURCE/extensions/markdown-it/transform.js',
//     extensionName: 'markdown-it',
//     fileName: 'transform.js'
//   },
//   ...
// ]
```

#### resolveTransformScripts()

```typescript
resolveTransformScripts(
  workspaceId: string,
  settings: EPUBSettings
): Promise<{
  textTransform: string | null;
  domTransforms: string[];
}>
```

**Input:**

- `workspaceId: string` - Target workspace identifier
- `settings: EPUBSettings` - Settings containing transform paths

**Output:** Promise resolving to:

- `textTransform: string | null` - Validated text transform path or null
- `domTransforms: string[]` - Array of validated DOM transform paths

**Side Effects:** None (validates file existence)

**Usage:**

```typescript
const epubSettings = await settingsManager.loadEPUBSettings('workspace-123');
const resolved = await settingsManager.resolveTransformScripts('workspace-123', epubSettings);

if (resolved.textTransform) {
  console.log('Text transform found:', resolved.textTransform);
} else {
  console.log('Text transform not found, using default');
}
```

## Validation Methods

Methods for validating settings before saving.

#### validateGlobalSettings()

```typescript
validateGlobalSettings(settings: Partial<GlobalSettings>): SettingsValidation
```

**Input:**

- `settings: Partial<GlobalSettings>` - Settings to validate

**Output:** `SettingsValidation` - Validation result

**Side Effects:** None (pure validation)

**Usage:**

```typescript
const validation = settingsManager.validateGlobalSettings({
  theme: 'dark',
  locale: 'invalid-locale',
  editor_font_size: -5,
});

if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
  // ['Invalid locale: invalid-locale', 'Font size must be between 8 and 32']
}
```

#### validateWorkspaceSettings()

```typescript
validateWorkspaceSettings(settings: Partial<WorkspaceSettings>): SettingsValidation
```

**Input:**

- `settings: Partial<WorkspaceSettings>` - Settings to validate

**Output:** `SettingsValidation` - Validation result

**Side Effects:** None (pure validation)

**Usage:**

```typescript
const validation = settingsManager.validateWorkspaceSettings({
  bust_cache: true,
  draft_id: -1,
  editor: { preview_delay_ms: 50 },
});

if (!validation.isValid) {
  console.error('Errors:', validation.errors);
  // ['Draft ID must be non-negative', 'Preview delay must be at least 100ms']
}
```

#### validateEPUBSettings()

```typescript
validateEPUBSettings(settings: Partial<EPUBSettings>): SettingsValidation
```

**Input:**

- `settings: Partial<EPUBSettings>` - Settings to validate

**Output:** `SettingsValidation` - Validation result

**Side Effects:** None (pure validation)

**Usage:**

```typescript
const validation = settingsManager.validateEPUBSettings({
  text_transform: '../../../etc/passwd',
  spine_basename: '',
  cover: { template: 'unknown' },
});

if (!validation.isValid) {
  console.error('Errors:', validation.errors);
  // ['Invalid transform path', 'Spine basename cannot be empty', 'Unknown cover template']
}
```

## Type Definitions

### GlobalSettings

```typescript
interface GlobalSettings {
  theme: 'light' | 'dark' | 'system';
  locale: string; // e.g., 'en', 'de', 'ar', 'he', 'ja', 'ka', 'zh-hant'
  editor_font_size: number; // Font size in pixels (8-32)
}
```

### WorkspaceSettings

```typescript
interface WorkspaceSettings {
  bust_cache: boolean; // Enable draft mode for cache busting
  draft_id: number; // Current draft version number
  editor?: {
    preview_delay_ms: number; // Delay before preview updates (100-2000)
    advanced_mode: boolean; // Show advanced features and JSON preview
  };
}
```

### EPUBSettings

```typescript
interface EPUBSettings {
  text_transform: string; // Path to text transform script
  dom_transforms: string[]; // Array of DOM transform script paths
  spine_basename: string; // Base name for new spine items
  cover?: {
    template: string; // Cover template name
    background_color: string; // Hex color for background
    text_color: string; // Hex color for text
    font_family: string; // Font family name
  };
}
```

### SettingsValidation

```typescript
interface SettingsValidation {
  isValid: boolean; // Overall validation status
  errors: string[]; // Critical errors preventing save
  warnings: string[]; // Non-critical issues
}
```

### TransformOption

```typescript
interface TransformOption {
  path: string; // Full path to script file
  extensionName: string; // Parent extension name
  fileName: string; // Script filename
}
```

## Integration Patterns

### Theme Integration

The Settings Manager integrates with the existing theme store:

```typescript
import { themeStore } from '$lib/stores/theme';

// When saving global settings
function saveGlobalSettings(settings: GlobalSettings): void {
  // Save to localStorage
  localStorage.setItem('editme_global_settings', JSON.stringify(settings));

  // Update theme store (enhanced to support 'system')
  if (settings.theme === 'system') {
    themeStore.useSystemPreference();
  } else {
    themeStore.setTheme(settings.theme);
  }
}
```

### Locale Integration

Integration with the i18n system:

```typescript
import { setLocale, currentLocale, getAvailableLocales } from '$lib/i18n';
import { get } from 'svelte/store';

// Load current locale for display
function loadGlobalSettings(): GlobalSettings {
  const stored = localStorage.getItem('editme_global_settings');
  const settings = stored ? JSON.parse(stored) : getDefaultGlobalSettings();

  // Sync with i18n system
  settings.locale = get(currentLocale);
  return settings;
}

// Save locale change
async function saveGlobalSettings(settings: GlobalSettings): Promise<void> {
  localStorage.setItem('editme_global_settings', JSON.stringify(settings));

  // Update i18n system (also saves to its own localStorage)
  await setLocale(settings.locale);
}
```

### Extension Integration

Working with the Extension Manager to populate transform options:

```typescript
// Get available transforms for dropdowns
async function getAvailableTransforms(workspaceId: string): Promise<TransformOption[]> {
  const extensions = await this.extensionManager.listWorkspaceExtensions(workspaceId);
  const options: TransformOption[] = [];

  // Add default scripts from SOURCE/scripts/
  const sourceFiles = await this.fileStorage.listFiles(workspaceId, 'SOURCE/scripts');
  for (const file of sourceFiles) {
    if (file.endsWith('.js')) {
      options.push({
        path: `SOURCE/scripts/${file}`,
        extensionName: 'built-in',
        fileName: file,
      });
    }
  }

  // Add extension scripts
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

### Workspace Metadata Integration

Extending existing workspace metadata:

```typescript
// Load workspace settings from metadata file
async function loadWorkspaceSettings(workspaceId: string): Promise<WorkspaceSettings> {
  try {
    const metadata = await this.fileStorage.readJSONFile(workspaceId, '.workspace-metadata.json');

    // Extract settings or use defaults
    return {
      bust_cache: metadata.bust_cache ?? false,
      draft_id: metadata.draft_id ?? 0,
      editor: metadata.editor ?? {
        preview_delay_ms: 500,
        advanced_mode: false,
      },
    };
  } catch {
    return this.getDefaultWorkspaceSettings();
  }
}

// Save workspace settings back to metadata
async function saveWorkspaceSettings(
  workspaceId: string,
  settings: WorkspaceSettings
): Promise<void> {
  const metadata = await this.fileStorage.readJSONFile(workspaceId, '.workspace-metadata.json');

  // Merge settings into existing metadata
  const updated = {
    ...metadata,
    bust_cache: settings.bust_cache,
    draft_id: settings.draft_id,
    editor: settings.editor,
  };

  await this.fileStorage.writeJSONFile(workspaceId, '.workspace-metadata.json', updated);
}
```

## Error Handling

### Common Error Scenarios

#### Storage Errors

```typescript
try {
  await settingsManager.saveEPUBSettings('workspace-123', settings);
} catch (error) {
  if (error.message.includes('quota exceeded')) {
    showError('Storage quota exceeded. Please free up space.');
  } else if (error.message.includes('permission denied')) {
    showError('Cannot save settings. Check file permissions.');
  } else {
    showError(`Failed to save settings: ${error.message}`);
  }
}
```

#### Validation Errors

```typescript
const validation = settingsManager.validateEPUBSettings(formData);
if (!validation.isValid) {
  // Show inline errors in UI
  validation.errors.forEach(error => {
    showFieldError(error);
  });
  return; // Don't save invalid settings
}

// Safe to save
await settingsManager.saveEPUBSettings(workspaceId, formData);
```

#### Missing Settings Files

```typescript
// Settings manager handles missing files gracefully
const settings = await settingsManager.loadEPUBSettings('workspace-123');
// Returns defaults if SOURCE/settings.json doesn't exist

// First save creates the file
await settingsManager.saveEPUBSettings('workspace-123', settings);
```

## Performance Considerations

### Caching Strategy

The Settings Manager implements intelligent caching:

```typescript
class SettingsManager {
  private transformCache = new Map<string, TransformOption[]>();
  private transformCacheTTL = 5 * 60 * 1000; // 5 minutes

  async getAvailableTransforms(workspaceId: string): Promise<TransformOption[]> {
    const cached = this.transformCache.get(workspaceId);
    if (cached && cached.timestamp > Date.now() - this.transformCacheTTL) {
      return cached.options;
    }

    // Load and cache
    const options = await this.loadTransformOptions(workspaceId);
    this.transformCache.set(workspaceId, {
      options,
      timestamp: Date.now(),
    });

    return options;
  }
}
```

### Debounced Saves

For UI integration with frequent changes:

```typescript
import { debounce } from '$lib/utils/debounce';

// Create debounced save function
const debouncedSave = debounce(
  async (workspaceId: string, settings: EPUBSettings) => {
    await settingsManager.saveEPUBSettings(workspaceId, settings);
  },
  1000 // 1 second delay
);

// Use in form handlers
function handleSettingChange(field: string, value: any) {
  settings[field] = value;
  debouncedSave(workspaceId, settings);
}
```

## Testing Considerations

### Unit Tests

Key scenarios to test:

1. **Default Generation**: All `getDefault*` methods return valid defaults
2. **Validation Logic**: Invalid settings are caught with appropriate errors
3. **Draft Mode**: ID increment, title generation, and extraction work correctly
4. **Transform Resolution**: Scripts are validated and missing files handled
5. **localStorage Handling**: Errors are caught and don't crash the app

### Integration Tests

1. **Theme Store Integration**: Theme changes propagate correctly
2. **i18n Integration**: Locale changes update the UI
3. **File Storage Integration**: Settings persist through save/load cycles
4. **Extension Integration**: Transform lists update when extensions change

### Edge Cases

1. **Corrupted Settings**: Invalid JSON falls back to defaults
2. **Missing Permissions**: Storage errors are handled gracefully
3. **Concurrent Updates**: Multiple settings views don't conflict
4. **Large Settings**: Performance remains good with many transforms

## Internal Implementation Details

### Settings Priority

When loading settings, the manager follows this priority:

1. **Stored settings** - From localStorage or file system
2. **Migration** - Apply any necessary migrations
3. **Defaults** - Fall back to defaults for missing values

### File Structure

Settings are stored in these locations:

```
localStorage:
  editme_global_settings     # Global settings
  editme_theme_preference    # Theme store (existing)
  editme-locale              # i18n system (existing)

Workspace:
  .workspace-metadata.json   # Workspace settings (extended)
  SOURCE/settings.json       # EPUB settings
```

### Validation Rules

Settings are validated according to these rules:

- **Theme**: Must be 'light', 'dark', or 'system'
- **Locale**: Must exist in available locales
- **Font Size**: Must be between 8 and 32 pixels
- **Draft ID**: Must be non-negative integer
- **Preview Delay**: Must be between 100-2000ms
- **Transform Paths**: Must start with SOURCE/ and end with .js
- **Spine Basename**: Must be non-empty alphanumeric
- **Colors**: Must be valid hex colors (#RRGGBB)
