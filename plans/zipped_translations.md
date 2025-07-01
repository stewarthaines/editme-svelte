# Zipped Translations Implementation Plan

## Problem Statement

The current i18n loader assumes translations.zip is served from `/translations.zip`, but EDITME is a single-file application embedded in EPUBs. The translation data needs to be inlined into the HTML file as a data URL.

## Current Implementation Issues

1. **Wrong fetch approach**: `fetch('/translations.zip')` won't work in embedded context
2. **Missing data URL integration**: Translations need to be embedded in build output
3. **No fallback strategy**: Should work without network access
4. **Untested**: No unit test coverage for complex loader logic

## Refined Approach

### 1. Build-Time Integration

**Update Vite config** to:

- Generate `translations.zip` during build
- Convert ZIP to base64 data URL
- Inject data URL into HTML template as global variable
- Ensure single-file app includes all translation data

**Build workflow**:

```bash
npm run i18n:build  # Extract, convert, compress
npm run build       # Vite build with data URL injection
```

### 2. Runtime Loading Strategy

**Data URL access**:

```typescript
// Instead of fetch('/translations.zip')
const translationsDataUrl = (window as any).__EDITME_TRANSLATIONS_ZIP__;
const response = await fetch(translationsDataUrl);
```

**Fallback chain**:

1. Load from storage (if already extracted)
2. Extract from embedded data URL (first run or version mismatch)
3. Use bundled English fallback (if all else fails)

### 3. Storage Integration

**Version-based cache**:

- Store app version + translation version in localStorage
- Re-extract if either version changes
- Use 'locales' workspace ID in existing storage system

**Storage structure**:

```
OPFS/IndexedDB:
└── locales/
    ├── en.json
    ├── de.json
    ├── ar.json
    └── ... (other locales)
```

## Implementation Tasks

### Phase 1: Fix Data URL Loading

1. **Update loader.ts**:
   - Replace `fetch('/translations.zip')` with data URL access
   - Add proper error handling for missing data URL
   - Maintain existing storage integration

2. **Update build process**:
   - Modify Vite config to inject translation data URL
   - Ensure data URL is properly base64 encoded
   - Handle build-time compression integration

### Phase 2: Add Unit Tests

3. **Test translation loader**:
   - Mock storage and data URL access
   - Test version checking logic
   - Test extraction and loading workflows
   - Test error scenarios and fallbacks

4. **Test i18n runtime**:
   - Test `t()` function with various inputs
   - Test locale switching and direction changes
   - Test browser locale detection
   - Test fallback scenarios

### Phase 3: Integration Testing

5. **Test complete workflow**:
   - Build with real translations
   - Test first-run extraction
   - Test version-based updates
   - Test storage persistence

## File Structure

```
src/lib/i18n/
├── index.ts              # Main runtime (✅ complete)
├── types.ts              # Type definitions (✅ complete)
├── locale-config.ts      # Locale configurations (✅ complete)
├── loader.ts             # ZIP loader (🔧 needs data URL fix)
├── test/
│   ├── loader.test.ts    # ❌ needs creation
│   ├── i18n.test.ts      # ❌ needs creation
│   ├── integration.test.ts # ❌ needs creation
│   └── fixtures/
│       └── mock-translations.ts # ❌ needs creation
```

## Technical Details

### Data URL Format

```typescript
// Injected by Vite build
window.__EDITME_TRANSLATIONS_ZIP__ = 'data:application/gzip;base64,H4sI...';
```

### Vite Plugin Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    // Custom plugin to inject translation data URL
    {
      name: 'embed-translations',
      transformIndexHtml(html) {
        const translationsZip = fs.readFileSync('static/translations.zip');
        const dataUrl = `data:application/gzip;base64,${translationsZip.toString('base64')}`;
        return html.replace(
          '</head>',
          `<script>window.__EDITME_TRANSLATIONS_ZIP__ = '${dataUrl}';</script></head>`
        );
      },
    },
  ],
});
```

### Error Handling Strategy

1. **Missing data URL**: Fall back to English only
2. **Decompression failure**: Fall back to English only
3. **Storage write failure**: Fall back to English only
4. **Storage read failure**: Re-extract from data URL

## Testing Strategy

### Unit Tests (happy-dom compatible)

- Mock data URL access
- Mock storage operations
- Test pure logic functions
- Test error scenarios

### Integration Tests (Storybook)

- Test real data URL extraction
- Test browser DecompressionStream
- Test complete user workflows
- Test different locale switching

## Success Criteria

1. ✅ Translations load from embedded data URL
2. ✅ First-run extraction works in embedded context
3. ✅ Version-based updates function correctly
4. ✅ Complete test coverage for all scenarios
5. ✅ Single-file app includes all required translation data
6. ✅ Works offline without any network dependencies

This approach ensures EDITME can be truly embedded in EPUBs while maintaining the professional gettext workflow and optimal size characteristics.
