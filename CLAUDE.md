# Claude Code Project Instructions

## EDITME.html - EPUB Editor

This is a Svelte-based EPUB editor that runs in modern browsers, replacing a previous Vue.js version. It allows users to create and edit EPUB files using plain text sources that are transformed to XHTML.

## Project Structure

- `plans/` - Project documentation and planning
  - `overview.md` - Complete project specification
  - `features.md` - Feature breakdown and development phases
  - `screens/` - UI mockup screenshots
- `src/` - Svelte application source code
- `static/` - Static assets (inlined by Vite build)

## Technical Architecture

### Browser Support

- Modern browsers only (recent Safari, Chromium, Firefox, Edge)
- Supports both web server and file:// scheme URLs
- No external library dependencies in core app
- All static resources inlined by Vite build system

### Code Style Preferences

- **XML/HTML Parsing**: Use `DOMParser` and `querySelector` instead of regular expressions for robust parsing
- Browser-native APIs preferred over regex for structured data handling

### Storage Strategy

- OPFS (Origin Private File System) for performance
- IndexedDB fallback for broader browser support
- Feature detection for `.createWritable()` support
- Workspace-based organization with unique IDs

### Text Processing Pipeline

```
Plain text source → transformText.js → transformDom.js → XHTML → Preview
```

### Key Features

- EPUB unpacking/packaging using Compression Streams API
- Real-time plain text to XHTML transformation
- Multi-device preview (iPhone, iPad, Pixel phone variants)
- Extensible transform scripts loaded from EPUB manifest
- Accessibility-focused design

## Development Phases

### Phase 1: Foundation

1. File Storage API (OPFS + IndexedDB fallback)
2. EPUB Unpacking (Compression Streams)
3. EPUB Packaging (ZIP creation)
4. Workspace & OPF Manager

### Phase 2: Data & UI

5. Blob URL Manager
6. Layout System (resizable panels)
7. Navigation Router

### Phase 3: Content Management

8. Manifest View (file listing)
9. Metadata Editor (form-based)
10. Spine Item Manager (chapter ordering)
11. Theme System (light/dark mode)

### Phase 4: Text Processing

12. Transform Pipeline (dynamic function execution)
13. Text Editor (debounced preview updates)
14. Error Handling (transform failures)

### Phase 5: Preview & Polish

15. Device Preview (responsive + multi-device)
16. Preview Iframe (blob URL substitution)
17. Navigation Editor (TOC editing)
18. Storage Quota Monitor
19. Audio Clip Editor

## Active EPUB Format

Extension to standard EPUB structure:

```
mimetype
META-INF/content.opf
OEBPS/ (standard EPUB content)
EDITME/ (editor-specific files)
  ├── src/ (plain text sources)
  ├── scripts/ (transform functions)
  ├── ext/ (third-party libraries)
  └── EDITME.html (editor app)
```

## Commands

### Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Testing

- `npm test` - Run unit tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:stories` - Run Storybook tests with Vitest
- `npm run screenshots` - Capture component screenshots
- Use proper ES module imports (await import()) instead of require() for mocked modules

### Storybook

- `npm run storybook` - Start Storybook development server
- `npm run build-storybook` - Build Storybook for production
- See `STORYBOOK.md` for backend feature demonstration patterns

### Linting

- `npm run lint` - ESLint check
- `npm run check` - TypeScript validation

## ZIP Library Implementation

### Location: `src/lib/zip/`

The ZIP library is complete and fully tested, ready for Features 2 & 3 implementation.

#### Core Files:

- **`zip-reader.ts`** - ZIP parsing and extraction using DecompressionStream
- **`zip-writer.ts`** - ZIP creation with EPUB compliance using CompressionStream
- **`utils.ts`** - Stream conversion, downloads, data reading utilities
- **`types.ts`** - Complete TypeScript interfaces and type definitions
- **`index.ts`** - Clean API exports

#### Key Features:

- Browser-native Compression Streams API (no external dependencies)
- EPUB-compliant ZIP handling (mimetype file first, uncompressed)
- Memory-efficient streaming for large files
- File type-based compression optimization
- CRC32 checksum calculation and DOS timestamp conversion
- Unicode filename support and error handling

#### Usage Examples:

```typescript
// Reading ZIP files
import { Zip } from "$lib/zip";
const zip = new Zip(arrayBuffer);
for (const entry of zip.entries) {
  const blob = await entry.extract();
}

// Creating ZIP files
import { ZipWriter } from "$lib/zip";
const writer = new ZipWriter();
await writer.addFile("mimetype", "application/epub+zip");
await writer.addFile("content.txt", "Hello World");
const zipBlob = await writer.buildBlob();
```

#### Testing:

- **64 comprehensive tests** across utils, reader, and writer
- Browser API mocking (document, window, URL, Compression Streams)
- Edge cases, error handling, and EPUB workflow scenarios
- Run with: `npm test src/lib/zip`

### Integration Notes:

- Ready for File Storage API integration (Feature 1)
- Supports OPFS and IndexedDB storage backends
- Handles workspace-based file organization
- Compatible with blob URL management for previews

## API Documentation Standards

### Writing API Documentation

When implementing new features, create comprehensive API documentation in `src/lib/{feature}/API.md` following these standards:

#### Required Sections:

1. **Overview** - Brief description of main classes and purpose
2. **Class Documentation** - Each public class with constructor and methods
3. **Method Documentation** - Input/Output/Side Effects/Usage examples for each method
4. **Type Definitions** - All publicly useful interfaces and types
5. **Common Integration Patterns** - Real-world usage examples
6. **Error Handling** - Exception types and error handling patterns

#### Documentation Style:

````typescript
#### methodName()

```typescript
methodName(param: Type): Promise<ReturnType>
```

**Input:**
- `param: Type` - Description of parameter

**Output:** `Promise<ReturnType>` - Description of return value

**Side Effects:** List any side effects (file creation, state changes, etc.)

**Usage:**

```typescript
const example = new ClassName();
const result = await example.methodName(value);
console.log('Result:', result);
```
````

#### Key Guidelines:

- **Focus on Integration**: Show how the API integrates with other features
- **Practical Examples**: Include real-world usage patterns, not toy examples
- **Error Scenarios**: Document common error cases and handling
- **Browser Compatibility**: Note any browser-specific behavior or limitations
- **Performance Notes**: Highlight performance characteristics and optimization tips

#### Examples to Follow:

- `src/lib/epub/API.md` - Comprehensive EPUB library documentation
- `src/lib/storage/API.md` - File Storage API with backend detection details

#### When to Create API Docs:

- **New feature implementation** - Always create API.md for new `src/lib/{feature}/` modules
- **Public API changes** - Update existing API.md when interfaces change
- **Integration points** - Document any APIs that other features will consume
- **Complex workflows** - Show end-to-end integration patterns

API documentation should be created **after implementation and tests are working**, not as an afterthought. It helps clarify API design decisions and serves as integration reference for dependent features.
