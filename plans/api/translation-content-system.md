# Translation Content System API Documentation

## Overview

The Translation Content System is the foundational component for generating localized sample EPUB content in the enhanced "Create New" workspace feature. It provides a scalable, translation-driven approach to creating sample content that automatically adapts to any supported locale without requiring code changes.

### Purpose

- Generate localized sample EPUB content from translation catalogs
- Enable infinite locale scalability through translation-only additions
- Provide consistent sample content structure across all languages
- Integrate seamlessly with the existing i18n infrastructure

### Architectural Principles

- **Translation-Driven**: All content sourced from translation catalogs
- **Locale-Agnostic**: No conditional logic based on language or script
- **Scalable**: Adding new locales requires only translation files
- **Consistent**: Same content structure and educational value across all languages

## Translation Key Schema

### Key Naming Convention

Translation keys follow a hierarchical structure: `sample.{section}.{element}`

```typescript
type SampleContentSection = 'book' | 'prologue' | 'chapter1' | 'chapter2' | 'appendix';
type SampleContentElement = 'title' | 'content' | 'description' | 'name';
```

### Core Translation Keys

#### Book Metadata Keys

```json
{
  "sample.book.title": "Sample Book Project",
  "sample.book.description": "A complete sample EPUB demonstrating Active EPUB capabilities with SOURCE files and transform scripts",
  "sample.author.name": "Demo Author",
  "sample.publisher.name": "EDITME.html Demo"
}
```

#### Chapter Content Keys

````json
{
  "sample.prologue.title": "Prologue",
  "sample.prologue.content": "# Prologue\n\nThe story begins in a small village nestled between rolling hills and ancient forests. Here, where time seems to move more slowly, our tale unfolds...\n\nThis is where everything started, long before the main events that would change everything.",

  "sample.chapter1.title": "Chapter 1",
  "sample.chapter1.content": "# Chapter 1\n\n## The Adventure Begins\n\nIn this chapter, we explore new territories and meet fascinating characters. Each chapter builds upon the last, creating a rich tapestry of story and meaning.",

  "sample.chapter2.title": "Chapter 2",
  "sample.chapter2.content": "# Chapter 2\n\n## Advanced Formatting\n\nThis chapter demonstrates more sophisticated formatting capabilities:\n\n> \"The best way to learn is by doing, and the best way to do is by understanding.\"\n> \n> — *Ancient Proverb*\n\n## Subheadings help organize content\n**Bold** and *italic* text add emphasis\n```\n\nThe transform pipeline will convert this formatting into properly structured XHTML.",

  "sample.appendix.title": "Appendix: About Active EPUBs",
  "sample.appendix.content": "# Appendix: About Active EPUBs\n\nThis appendix explains the Active EPUB format and its unique capabilities.\n\n## What is an Active EPUB?\n\nAn Active EPUB is a standard EPUB file that contains its own editing environment. It includes:\n\n### SOURCE Directory Structure\n\n- **SOURCE/text/**: Plain text source files\n- **SOURCE/scripts/**: Transform scripts that convert text to XHTML\n- **SOURCE/extensions/**: Additional plugins and enhancements\n- **SOURCE/settings.json**: Configuration for the editing environment\n\n### Key Features\n\n1. **Self-Editing**: The EPUB can edit itself using embedded tools\n2. **Version Control**: Track changes and maintain editing history\n3. **Transform Pipeline**: Convert plain text to formatted XHTML\n4. **Cross-Platform**: Works on any device that supports EPUB\n\n### How It Works\n\nThe EDITME.html application extracts the SOURCE files, allows editing in a user-friendly interface, runs the transform scripts, and packages everything back into a standard EPUB.\n\n## Getting Started\n\nTo begin editing this Active EPUB:\n\n1. Extract the EDITME.html file to your device\n2. Open it in a web browser\n3. Load this EPUB file\n4. Start editing the SOURCE files\n5. Preview your changes in real-time\n6. Export the updated EPUB when finished\n\nThis system enables collaborative authoring, version control, and sophisticated formatting while maintaining EPUB standard compliance."
}
````

### Content Requirements

Each content key must provide:

- **Educational Value**: Explains EPUB and Active EPUB concepts
- **Progressive Complexity**: Builds from basic to advanced features
- **Formatting Examples**: Demonstrates basic formatting capabilities
- **Technical Accuracy**: Correctly describes Active EPUB functionality

## Core Interfaces

### SampleContentKey Type

```typescript
/**
 * Strongly-typed sample content keys for translation lookup
 */
type SampleContentKey =
  | 'sample.book.title'
  | 'sample.book.description'
  | 'sample.author.name'
  | 'sample.publisher.name'
  | 'sample.prologue.title'
  | 'sample.prologue.content'
  | 'sample.chapter1.title'
  | 'sample.chapter1.content'
  | 'sample.chapter2.title'
  | 'sample.chapter2.content'
  | 'sample.appendix.title'
  | 'sample.appendix.content';
```

### LocalizedSampleContent Interface

```typescript
/**
 * Structured sample content for a specific locale
 */
interface LocalizedSampleContent {
  /** Locale code (e.g., 'en', 'fr', 'ar') */
  locale: string;

  /** Book metadata in the target locale */
  metadata: {
    title: string;
    description: string;
    author: string;
    publisher: string;
  };

  /** Chapter content in the target locale */
  chapters: Array<{
    id: string;
    title: string;
    content: string;
    linear: boolean;
  }>;

  /** Whether this locale uses RTL text direction */
  isRTL: boolean;

  /** EPUB page progression direction for RTL languages */
  pageProgressionDirection?: 'rtl' | 'ltr';
}
```

### SampleContentGenerator Class

```typescript
/**
 * Main class for generating localized sample content
 */
class SampleContentGenerator {
  constructor(private i18nSystem: I18nSystem);

  /**
   * Generate complete localized sample content for a locale
   */
  generateLocalizedContent(locale: string): Promise<LocalizedSampleContent>;

  /**
   * Generate localized EPUB metadata
   */
  generateLocalizedMetadata(locale: string): Promise<EPUBMetadata>;

  /**
   * Generate localized chapter content
   */
  generateLocalizedChapters(locale: string): Promise<DemoChapter[]>;

  /**
   * Get available locales with sample content
   */
  getAvailableLocales(): Promise<string[]>;

  /**
   * Validate that all required translation keys exist for a locale
   */
  validateLocaleCompleteness(locale: string): Promise<ValidationResult>;
}
```

## Public API Methods

### generateLocalizedContent()

```typescript
/**
 * Generate complete localized sample content for the specified locale
 *
 * @param locale - Target locale code (e.g., 'en', 'fr', 'ar')
 * @returns Promise resolving to complete localized sample content
 * @throws TranslationMissingError if required keys are missing
 * @throws UnsupportedLocaleError if locale is not configured
 */
async generateLocalizedContent(locale: string): Promise<LocalizedSampleContent> {
  // Implementation validates locale, loads translations, generates content
}
```

**Example Usage:**

```typescript
const generator = new SampleContentGenerator(i18nSystem);
const content = await generator.generateLocalizedContent('fr');
// Returns French sample content with proper metadata and chapters
```

### generateLocalizedMetadata()

```typescript
/**
 * Generate EPUB metadata for the specified locale
 *
 * @param locale - Target locale code
 * @returns Promise resolving to EPUBMetadata with localized strings
 */
async generateLocalizedMetadata(locale: string): Promise<EPUBMetadata> {
  const isRTLLocale = isRTL(locale);

  return {
    title: await this.translate('sample.book.title', locale),
    language: locale,
    identifier: `sample-book-${locale}-${Date.now()}`,
    creator: [await this.translate('sample.author.name', locale)],
    publisher: await this.translate('sample.publisher.name', locale),
    description: await this.translate('sample.book.description', locale),
    subject: ['Sample', 'Demo', 'EPUB', 'Active EPUB'],
    date: new Date().toISOString().split('T')[0],
    ...(isRTLLocale && { pageProgressionDirection: 'rtl' })
  };
}
```

### generateLocalizedChapters()

```typescript
/**
 * Generate chapter content for the specified locale
 *
 * @param locale - Target locale code
 * @returns Promise resolving to array of localized chapters
 */
async generateLocalizedChapters(locale: string): Promise<DemoChapter[]> {
  const chapters = ['prologue', 'chapter1', 'chapter2', 'appendix'];

  return Promise.all(chapters.map(async (chapterId) => ({
    id: chapterId,
    title: await this.translate(`sample.${chapterId}.title`, locale),
    content: await this.translate(`sample.${chapterId}.content`, locale),
    linear: true,
    mediaType: 'application/xhtml+xml'
  })));
}
```

### validateLocaleCompleteness()

```typescript
/**
 * Validate that all required translation keys exist for a locale
 *
 * @param locale - Locale to validate
 * @returns Promise resolving to validation results
 */
async validateLocaleCompleteness(locale: string): Promise<ValidationResult> {
  const requiredKeys: SampleContentKey[] = [
    'sample.book.title',
    'sample.book.description',
    'sample.author.name',
    'sample.publisher.name',
    'sample.prologue.title',
    'sample.prologue.content',
    'sample.chapter1.title',
    'sample.chapter1.content',
    'sample.chapter2.title',
    'sample.chapter2.content',
    'sample.appendix.title',
    'sample.appendix.content'
  ];

  const missingKeys: string[] = [];
  const emptyKeys: string[] = [];

  for (const key of requiredKeys) {
    const translation = await this.getTranslation(key, locale);
    if (!translation) {
      missingKeys.push(key);
    } else if (translation.trim() === '') {
      emptyKeys.push(key);
    }
  }

  return {
    isValid: missingKeys.length === 0 && emptyKeys.length === 0,
    missingKeys,
    emptyKeys,
    locale
  };
}
```

## Error Handling

### Error Types

```typescript
/**
 * Error thrown when required translation keys are missing
 */
class TranslationMissingError extends Error {
  constructor(
    public readonly locale: string,
    public readonly missingKeys: string[]
  ) {
    super(`Missing translation keys for locale ${locale}: ${missingKeys.join(', ')}`);
  }
}

/**
 * Error thrown when locale is not configured in the system
 */
class UnsupportedLocaleError extends Error {
  constructor(public readonly locale: string) {
    super(`Unsupported locale: ${locale}`);
  }
}

/**
 * Error thrown when translation content is invalid or corrupted
 */
class InvalidContentError extends Error {
  constructor(
    public readonly locale: string,
    public readonly key: string,
    public readonly reason: string
  ) {
    super(`Invalid content for ${locale}.${key}: ${reason}`);
  }
}
```

### Error Handling Patterns

```typescript
try {
  const content = await generator.generateLocalizedContent('fr');
} catch (error) {
  if (error instanceof TranslationMissingError) {
    // Handle missing translations - possibly fall back to English
    console.warn(`Missing French translations: ${error.missingKeys}`);
    const fallbackContent = await generator.generateLocalizedContent('en');
    return fallbackContent;
  } else if (error instanceof UnsupportedLocaleError) {
    // Handle unsupported locale - use default
    return await generator.generateLocalizedContent('en');
  } else {
    // Handle other errors
    throw error;
  }
}
```

## Usage Examples

### Basic Usage

```typescript
import { SampleContentGenerator } from './sample-content-generator';
import { i18nSystem } from '../i18n';

// Initialize generator
const generator = new SampleContentGenerator(i18nSystem);

// Generate English content
const englishContent = await generator.generateLocalizedContent('en');

// Generate Arabic content (RTL)
const arabicContent = await generator.generateLocalizedContent('ar');
console.log(arabicContent.isRTL); // true
console.log(arabicContent.pageProgressionDirection); // 'rtl'
```

### Integration with Workspace Creation

```typescript
// In WorkspaceManager.createEPUBStructure()
async createEPUBStructure(workspaceId: string): Promise<void> {
  const currentLocale = getCurrentLocale();
  const generator = new SampleContentGenerator(this.i18nSystem);

  // Generate localized sample content
  const sampleContent = await generator.generateLocalizedContent(currentLocale);

  // Use generated metadata
  const opfDocument: OPFDocument = {
    version: '3.0',
    metadata: await generator.generateLocalizedMetadata(currentLocale),
    manifest: [],
    spine: [],
    ...(sampleContent.isRTL && {
      pageProgressionDirection: 'rtl'
    })
  };

  // Create content files
  const chapters = await generator.generateLocalizedChapters(currentLocale);
  for (const chapter of chapters) {
    await this.storage.writeTextFile(
      workspaceId,
      `OEBPS/Text/${chapter.id}.xhtml`,
      this.transformToXHTML(chapter.content)
    );

    await this.storage.writeTextFile(
      workspaceId,
      `SOURCE/text/${chapter.id}.txt`,
      chapter.content
    );
  }
}
```

### Locale Validation

```typescript
// Validate all configured locales have complete translations
const locales = ['en', 'de', 'ar', 'he', 'ja', 'ka', 'zh-Hant'];
const validationResults = await Promise.all(
  locales.map(locale => generator.validateLocaleCompleteness(locale))
);

const incompleteLocales = validationResults.filter(result => !result.isValid);
if (incompleteLocales.length > 0) {
  console.warn('Incomplete translations found:', incompleteLocales);
}
```

## Testing Specifications

### Unit Test Requirements

#### Translation Key Coverage

```typescript
describe('SampleContentGenerator', () => {
  test('should have all required translation keys for English', async () => {
    const result = await generator.validateLocaleCompleteness('en');
    expect(result.isValid).toBe(true);
    expect(result.missingKeys).toHaveLength(0);
  });

  test('should generate valid metadata for all supported locales', async () => {
    const locales = ['en', 'de', 'ar', 'he', 'ja', 'ka', 'zh-Hant'];

    for (const locale of locales) {
      const metadata = await generator.generateLocalizedMetadata(locale);
      expect(metadata.language).toBe(locale);
      expect(metadata.title).toBeTruthy();
      expect(metadata.creator).toHaveLength(1);
    }
  });

  test('should handle RTL locales correctly', async () => {
    const arabicContent = await generator.generateLocalizedContent('ar');
    expect(arabicContent.isRTL).toBe(true);
    expect(arabicContent.pageProgressionDirection).toBe('rtl');

    const englishContent = await generator.generateLocalizedContent('en');
    expect(englishContent.isRTL).toBe(false);
    expect(englishContent.pageProgressionDirection).toBeUndefined();
  });
});
```

#### Error Handling Tests

```typescript
describe('Error Handling', () => {
  test('should throw TranslationMissingError for incomplete translations', async () => {
    await expect(generator.generateLocalizedContent('incomplete-locale')).rejects.toThrow(
      TranslationMissingError
    );
  });

  test('should throw UnsupportedLocaleError for unknown locales', async () => {
    await expect(generator.generateLocalizedContent('xyz')).rejects.toThrow(UnsupportedLocaleError);
  });
});
```

### Integration Test Strategy

#### I18n System Integration

- Test with actual translation catalogs
- Verify fallback behavior to English

#### Content Quality Validation

- Verify generated content contains proper markdown-style formatting
- Check that all chapters have educational value

#### Performance Testing

- Test content generation time across locales
- Verify memory usage with large translation catalogs

## Implementation Guidelines

### Integration Points

#### With Existing I18n System

```typescript
// The generator integrates with existing translation infrastructure
class SampleContentGenerator {
  constructor(private i18nSystem: I18nSystem) {}

  private async translate(key: SampleContentKey, locale: string): Promise<string> {
    // Use existing translation system
    return this.i18nSystem.translate(key, {}, locale);
  }
}
```

#### With WorkspaceManager

```typescript
// WorkspaceManager creates and uses the generator
export class WorkspaceManager {
  private sampleContentGenerator: SampleContentGenerator;

  constructor() {
    this.sampleContentGenerator = new SampleContentGenerator(i18nSystem);
  }

  async createEPUBWorkspace(metadata?: Partial<EPUBMetadata>): Promise<string> {
    const currentLocale = getCurrentLocale();
    const localizedMetadata =
      await this.sampleContentGenerator.generateLocalizedMetadata(currentLocale);

    // Merge with any provided metadata overrides
    const finalMetadata = { ...localizedMetadata, ...metadata };

    return this.createEPUBStructure(workspaceId, finalMetadata);
  }
}
```

### Performance Considerations

#### Translation Loading

- Don't cache translations
- Use lazy loading for translation catalogs
- Implement efficient key lookup mechanisms

#### Content Generation

- Generate content asynchronously where possible
- Don't cache generated content
- Stream large content instead of loading all at once

#### Memory Management

- Use weak references where appropriate

### Configuration

#### Translation Key Registration

```typescript
// Register all sample content keys with the i18n system
const SAMPLE_CONTENT_KEYS: SampleContentKey[] = [
  'sample.book.title',
  'sample.book.description',
  // ... all other keys
];

// Validate keys exist in base locale
export function validateSampleContentKeys(): ValidationResult {
  // Implementation validates all keys exist in English
}
```

#### Locale Configuration

```typescript
// Extend existing locale configuration
interface LocaleConfig {
  code: string;
  name: string;
  direction: 'ltr' | 'rtl';
  englishName: string;
  sampleContentAvailable: boolean; // New flag
}
```

## Dependencies

### Required Dependencies

- **Existing I18n System**: For translation lookup and locale management
- **Existing Locale Configuration**: For RTL detection and locale validation
- **EPUB OPF Types**: For metadata type definitions

This API documentation provides the foundation for implementing scalable, localized sample content generation while maintaining consistency with the existing codebase architecture.
