# 05. Content.opf Parser/Generator

## Overview
Handles parsing and generation of EPUB content.opf manifest files, providing structured access to metadata, manifest items, and spine ordering.

## Requirements
- Parse existing content.opf files
- Generate valid content.opf from workspace data
- Metadata field validation
- Manifest item management (add/remove/update)

## Dependencies
- **#1 File Storage API** - for reading/writing content.opf files

## Technical Approach
- XML parsing for content.opf structure
- Object model for programmatic access
- XML generation with proper namespaces
- Validation against EPUB specification

## API Design
```typescript
interface ContentOPFParser {
  // Parsing
  parseOPF(xmlContent: string): OPFDocument
  validateOPF(doc: OPFDocument): ValidationResult[]
  
  // Generation
  generateOPF(doc: OPFDocument): string
  
  // Utilities
  addManifestItem(doc: OPFDocument, item: ManifestItem): void
  removeManifestItem(doc: OPFDocument, id: string): void
  updateSpineOrder(doc: OPFDocument, itemRefs: string[]): void
}

interface OPFDocument {
  metadata: EPUBMetadata
  manifest: ManifestItem[]
  spine: SpineItem[]
  guide?: GuideItem[]
}

interface ManifestItem {
  id: string
  href: string
  mediaType: string
  properties?: string[]
}

interface SpineItem {
  idref: string
  linear?: boolean
  properties?: string[]
}

interface EPUBMetadata {
  // Required
  title: string
  language: string
  identifier: string
  
  // Optional
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
}
```

## XML Parsing Strategy
- Use DOMParser for XML parsing
- Handle XML namespaces properly
- Extract metadata elements with fallbacks
- Parse manifest and spine elements
- Validate required elements exist

## XML Generation
- Create valid XML with proper DOCTYPE
- Include required namespaces (OPF, Dublin Core)
- Generate metadata section with required fields
- Create manifest entries with proper media types
- Generate spine with correct item references

## Metadata Validation
- Required fields: title, language, identifier
- Date format validation (ISO 8601)
- Language code validation (RFC 3066)
- Identifier uniqueness checking
- Media type validation for manifest items

## Manifest Management
- Add new items with auto-generated IDs
- Remove items and update spine references
- Update existing item properties
- Validate href paths and media types
- Handle duplicate ID conflicts

## Media Type Detection
```typescript
const MEDIA_TYPES = {
  '.xhtml': 'application/xhtml+xml',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4'
}
```

## Spine Ordering
- Maintain reading order through spine
- Handle linear/non-linear items
- Validate spine item references exist in manifest
- Support spine item properties (page-spread, etc.)

## Error Handling
- Malformed XML parsing errors
- Missing required metadata fields
- Invalid manifest item references
- Spine ordering conflicts
- Namespace resolution issues

## EPUB Version Support
- EPUB 2.0 compatibility
- EPUB 3.0 features (properties, nav doc)
- Version detection and appropriate handling
- Migration between versions

## Testing Considerations
- Test with valid EPUB 2.0/3.0 files
- Test malformed XML handling
- Test metadata extraction accuracy
- Test manifest manipulation operations
- Verify generated XML validity
- Test edge cases (missing fields, etc.)

## Implementation Notes
- Start with basic parsing/generation
- Add validation incrementally
- Handle both EPUB 2.0 and 3.0 formats
- Consider using XML libraries if needed
- Implement proper error recovery