# Universal Asset Generator API Documentation

## Overview

The Universal Asset Generator creates locale-agnostic CSS and transform scripts that work identically across all languages and writing systems. This component generates the static assets needed for sample EPUB content while ensuring universal compatibility without locale-specific logic.

### Purpose

- Generate CSS using logical properties that adapt automatically to any text direction
- Create transform scripts that work universally across all scripts and languages
- Provide consistent styling and behavior regardless of locale
- Eliminate need for locale-specific asset variants

### Architectural Principles

- **Logical Properties**: Use CSS logical properties (`margin-inline-start`) instead of physical properties (`margin-left`)
- **System Integration**: Leverage browser capabilities for locale-specific rendering
- **Universal Scripts**: Transform scripts contain no language or locale detection logic
- **Single Source**: One set of assets works for all locales

## Asset Types

### CSS Assets

#### page.css (Universal Styling)

Base stylesheet that adapts automatically to any locale through CSS logical properties and system fonts.

#### Features:

- **System Fonts**: Uses `system-ui` font stack for optimal per-locale rendering
- **Logical Properties**: All spacing and layout uses logical properties
- **Direction Inheritance**: Inherits text direction from HTML element
- **Accessibility**: WCAG 2.1 AA compliant styling

### Transform Script Assets

#### transformText.js (Universal Text Processing)

Converts Markdown to HTML without any locale-specific logic.

#### Features:

- **Markdown Processing**: Minimal markdown-to-HTML format conversion
- **Format Agnostic**: Works identically for all scripts and languages

#### transformDom.js (Universal DOM Processing)

Adds ID attributes to H2 elements for navigation linking without any locale-specific logic.

#### Features:

- **Navigation Anchors**: Adds ID attributes to H2 elements for nav.xhtml linking
- **Universal Compatibility**: Works identically across all languages and scripts
- **Error Handling**: Graceful error handling with fallback behavior

## Core Interfaces

### UniversalAssetGenerator Class

```typescript
/**
 * Main class for generating locale-agnostic CSS and transform scripts
 */
class UniversalAssetGenerator {
  constructor();

  /**
   * Generate universal CSS that adapts to any locale
   */
  generateUniversalCSS(): Promise<string>;

  /**
   * Generate universal text transform script
   */
  generateTransformTextScript(): Promise<string>;

  /**
   * Generate universal DOM transform script
   */
  generateTransformDomScript(): Promise<string>;

  /**
   * Generate complete asset bundle
   */
  generateAssetBundle(): Promise<UniversalAssetBundle>;

  /**
   * Validate transform scripts work across all locales
   */
  validateUniversalCompatibility(): Promise<ValidationResult>;
}
```

### UniversalAssetBundle Interface

```typescript
/**
 * Complete bundle of universal assets
 */
interface UniversalAssetBundle {
  /** Universal CSS using logical properties */
  css: {
    fileName: 'page.css';
    content: string;
    size: number;
  };

  /** Universal text transform script */
  transformText: {
    fileName: 'transformText.js';
    content: string;
    size: number;
  };

  /** Universal DOM transform script */
  transformDom: {
    fileName: 'transformDom.js';
    content: string;
    size: number;
  };

  /** Bundle metadata */
  metadata: {
    generated: Date;
    version: string;
    universalCompatibility: boolean;
  };
}
```

### CSSLogicalProperties Interface

```typescript
/**
 * Configuration for CSS logical properties usage
 */
interface CSSLogicalProperties {
  /** Use logical properties for spacing */
  useLogicalSpacing: boolean;

  /** Use logical properties for borders */
  useLogicalBorders: boolean;

  /** Use logical text alignment */
  useLogicalAlignment: boolean;

  /** Use logical positioning */
  useLogicalPositioning: boolean;
}
```

## Public API Methods

### generateUniversalCSS()

```typescript
/**
 * Generate CSS that automatically adapts to any locale and text direction
 *
 * @returns Promise resolving to CSS string with logical properties
 */
async generateUniversalCSS(): Promise<string> {
  return `
/* Universal CSS for all locales with EPUB reading system compatibility */
/* Uses CSS logical properties with progressive enhancement and fallbacks */

/* Accessibility and performance preferences */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-contrast: high) {
  a { text-decoration: underline; }
  blockquote { border-inline-start-width: 6px; }
}

body {
  /* System fonts with enhanced stack for global language support */
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 
               'Noto Sans', 'Liberation Sans', sans-serif;
  font-display: swap; /* Better loading performance */

  /* Enhanced typography for reading contexts */
  font-size: 1.125rem; /* Slightly larger base for better readability */
  line-height: 1.6;
  
  /* Progressive enhancement: physical properties first, then logical */
  margin-left: auto;
  margin-right: auto;
  padding: 1em;
  max-width: 65ch;
  
  /* Modern logical properties with feature query protection */
}

@supports (margin-inline: auto) {
  body {
    margin-left: unset;
    margin-right: unset;
    max-width: unset;
    margin-inline: auto;
    max-inline-size: 65ch;
  }
}

/* Additional language-specific adjustments */
:lang(ja), :lang(ko), :lang(zh) {
  line-height: 1.8; /* Better spacing for CJK characters */
}

:lang(ar), :lang(he) {
  line-height: 1.7; /* Improved RTL script readability */
}

/* Enhanced text flow and hyphenation */
body {
  hyphens: auto;
  -webkit-hyphens: auto;
  -ms-hyphens: auto;
}

/* Inherits direction from html[dir] set by i18n system */
body {
  direction: inherit;
}

/* Headings with progressive enhancement for logical spacing */
h1, h2, h3, h4, h5, h6 {
  /* Physical properties first for compatibility */
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  margin-left: 0;
  margin-right: 0;
  font-weight: 600;
  line-height: 1.2;
}

@supports (margin-block-start: 1.5em) {
  h1, h2, h3, h4, h5, h6 {
    margin-top: unset;
    margin-bottom: unset;
    margin-left: unset;
    margin-right: unset;
    margin-block-start: 1.5em;
    margin-block-end: 0.5em;
    margin-inline: 0;
  }
}

h1 {
  font-size: 2em;
  /* Physical border first for compatibility */
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.25em;
}

@supports (border-block-end: 2px solid #3498db) {
  h1 {
    border-bottom: unset;
    padding-bottom: unset;
    border-block-end: 2px solid #3498db;
    padding-block-end: 0.25em;
  }
}

h2 {
  font-size: 1.5em;
}

h3 {
  font-size: 1.25em;
}

/* Paragraphs with progressive enhancement */
p {
  /* Physical properties first */
  margin-bottom: 1em;
  text-align: left; /* Will be overridden for RTL */
}

/* RTL-specific physical fallback */
[dir="rtl"] p {
  text-align: right;
}

@supports (margin-block-end: 1em) {
  p {
    margin-bottom: unset;
    text-align: start; /* Logical property adapts automatically */
    margin-block-end: 1em;
  }
  
  [dir="rtl"] p {
    text-align: start; /* Override RTL-specific rule */
  }
}

/* Lists with progressive enhancement */
ul, ol {
  /* Physical properties first */
  margin-top: 1em;
  margin-bottom: 1em;
  padding-left: 2em;
}

[dir="rtl"] ul, [dir="rtl"] ol {
  padding-left: 0;
  padding-right: 2em;
}

li {
  margin-bottom: 0.5em;
}

@supports (margin-block: 1em) {
  ul, ol {
    margin-top: unset;
    margin-bottom: unset;
    padding-left: unset;
    margin-block: 1em;
    padding-inline-start: 2em;
  }
  
  [dir="rtl"] ul, [dir="rtl"] ol {
    padding-right: unset;
  }
  
  li {
    margin-bottom: unset;
    margin-block-end: 0.5em;
  }
}

/* Blockquotes with progressive enhancement */
blockquote {
  /* Physical properties first */
  margin-top: 1.5em;
  margin-bottom: 1.5em;
  margin-left: 2em;
  margin-right: 0;
  padding-left: 1em;
  border-left: 4px solid #3498db;
  background-color: #f8f9fa;
  font-style: italic;
}

[dir="rtl"] blockquote {
  margin-left: 0;
  margin-right: 2em;
  padding-left: 0;
  padding-right: 1em;
  border-left: none;
  border-right: 4px solid #3498db;
}

@supports (margin-block: 1.5em) {
  blockquote {
    margin-top: unset;
    margin-bottom: unset;
    margin-left: unset;
    margin-right: unset;
    padding-left: unset;
    border-left: unset;
    margin-block: 1.5em;
    margin-inline: 2em 0;
    padding-inline-start: 1em;
    border-inline-start: 4px solid #3498db;
  }
  
  [dir="rtl"] blockquote {
    margin-right: unset;
    padding-right: unset;
    border-right: unset;
  }
}

/* Code blocks with progressive enhancement */
pre, code {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
  font-size: 0.875em;
}

pre {
  background-color: #f5f5f5;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  margin-top: 1em;
  margin-bottom: 1em;
}

code {
  background-color: #f0f0f0;
  padding-left: 0.25em;
  padding-right: 0.25em;
  border-radius: 2px;
}

@supports (margin-block: 1em) {
  pre {
    margin-top: unset;
    margin-bottom: unset;
    margin-block: 1em;
  }
  
  code {
    padding-left: unset;
    padding-right: unset;
    padding-inline: 0.25em;
  }
}

/* Links with universal styling */
a {
  color: #3498db;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

a:focus {
  outline: 2px solid #3498db;
  outline-offset: 2px;
}

/* Tables with progressive enhancement */
table {
  border-collapse: collapse;
  width: 100%;
  margin-top: 1em;
  margin-bottom: 1em;
}

th, td {
  border: 1px solid #ddd;
  padding: 0.5em;
  text-align: left;
}

[dir="rtl"] th, [dir="rtl"] td {
  text-align: right;
}

th {
  background-color: #f5f5f5;
  font-weight: 600;
}

@supports (margin-block: 1em) {
  table {
    margin-top: unset;
    margin-bottom: unset;
    margin-block: 1em;
  }
  
  th, td {
    text-align: start; /* Logical property adapts to direction */
  }
  
  [dir="rtl"] th, [dir="rtl"] td {
    text-align: start; /* Override RTL-specific rule */
  }
}

/* Images with progressive enhancement */
img {
  max-width: 100%;
  height: auto;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

@supports (max-inline-size: 100%) {
  img {
    max-width: unset;
    height: unset;
    margin-left: unset;
    margin-right: unset;
    max-inline-size: 100%;
    block-size: auto;
    margin-inline: auto;
  }
}

/* Strong and emphasis with universal styling */
strong {
  font-weight: 600;
}

em {
  font-style: italic;
}
`;
}
```

### generateTransformTextScript()

```typescript
/**
 * Generate universal text transform script that works for any locale
 *
 * @returns Promise resolving to JavaScript transform script
 */
async generateTransformTextScript(): Promise<string> {
  return `
/**
 * Universal Text Transform Script
 *
 * Converts markdown text to HTML without any locale-specific logic.
 * Works identically for all languages, scripts, and text directions.
 */

/**
 * Convert markdown to HTML (simplified universal parser)
 * @param {string} markdown - Markdown text
 * @returns {string} HTML output
 */
function markdownToHTML(markdown) {
  let html = markdown;

  // Headers (supports # through ######)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\\*\\*\\*(.*?)\\*\\*\\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
  html = html.replace(/\\*(.*?)\\*/g, '<em>$1</em>');

  // Code blocks
  html = html.replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>');
  html = html.replace(/\`(.*?)\`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\\[([^\\]]+)\\]\\(([^\\)]+)\\)/g, '<a href="$2">$1</a>');

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Lists
  html = html.replace(/^\\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\\d+\\. (.*$)/gim, '<li>$1</li>');

  // Wrap consecutive <li> elements in appropriate list tags
  html = html.replace(/(<li>.*<\\/li>)(\\s*)(?=<li>)/gs, '$1$2');
  html = html.replace(/(<li>.*<\\/li>)/gs, '<ul>$1</ul>');

  // Line breaks and paragraphs
  html = html.replace(/\\n\\n/g, '</p><p>');
  html = html.replace(/\\n/g, '<br>');

  // Wrap in paragraph tags if not already wrapped
  if (!html.includes('<p>') && !html.includes('<h1>') && !html.includes('<h2>')) {
    html = \`<p>\${html}</p>\`;
  }

  return html;
}

// Export for use in EPUB transform pipeline
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { transformText };
}
`;
}
```

### generateTransformDomScript()

```typescript
/**
 * Generate simple DOM transform script for H2 navigation anchors
 *
 * @returns Promise resolving to JavaScript DOM transform script
 */
async generateTransformDomScript(): Promise<string> {
  return `
/**
 * Simple DOM Transform Script
 *
 * Adds ID attributes to H2 elements to make them usable as URL fragments
 * in nav.xhtml for table of contents linking. Works universally across
 * all languages without any locale-specific logic.
 */

/**
 * Transform DOM by adding IDs to H2 headings for navigation
 * @param {Document} htmlDocument - HTML document to transform
 * @returns {Document} Transformed document with H2 IDs
 */
function transformDOM(htmlDocument) {
  try {
    // Find all H2 elements in the document
    const h2Elements = htmlDocument.querySelectorAll('h2');
    
    h2Elements.forEach((h2, index) => {
      // Skip if already has an ID
      if (h2.getAttribute('id')) {
        return;
      }
      
      // Generate ID from text content or use fallback
      const text = h2.textContent || '';
      let id = text
        .toLowerCase()
        .replace(/[^a-z0-9\\s-]/g, '') // Remove special characters
        .replace(/\\s+/g, '-')         // Replace spaces with hyphens
        .replace(/-+/g, '-')          // Collapse multiple hyphens
        .replace(/^-|-$/g, '')        // Remove leading/trailing hyphens
        .substring(0, 50);            // Limit length
      
      // Fallback if no usable text
      if (!id) {
        id = \`heading-\${index + 1}\`;
      }
      
      // Ensure ID is unique in document
      let finalId = id;
      let counter = 1;
      while (htmlDocument.getElementById(finalId)) {
        finalId = \`\${id}-\${counter}\`;
        counter++;
      }
      
      // Set the ID attribute
      h2.setAttribute('id', finalId);
    });
    
    return htmlDocument;
  } catch (error) {
    console.error('DOM transform error:', error);
    return htmlDocument;
  }
}

// Export for use in EPUB transform pipeline
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { transformDOM };
}
`;
}
```

### generateAssetBundle()

```typescript
/**
 * Generate complete bundle of universal assets
 *
 * @returns Promise resolving to complete asset bundle
 */
async generateAssetBundle(): Promise<UniversalAssetBundle> {
  const css = await this.generateUniversalCSS();
  const transformText = await this.generateTransformTextScript();
  const transformDom = await this.generateTransformDomScript();

  return {
    css: {
      fileName: 'page.css',
      content: css,
      size: css.length
    },
    transformText: {
      fileName: 'transformText.js',
      content: transformText,
      size: transformText.length
    },
    transformDom: {
      fileName: 'transformDom.js',
      content: transformDom,
      size: transformDom.length
    },
    metadata: {
      generated: new Date(),
      version: '1.0.0',
      universalCompatibility: true
    }
  };
}
```

### validateUniversalCompatibility()

```typescript
/**
 * Validate that generated transform scripts work universally across locales
 *
 * @returns Promise resolving to validation results
 */
async validateUniversalCompatibility(): Promise<ValidationResult> {
  const validationResults: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    checks: []
  };

  // Validate transform scripts have no locale logic
  const transformText = await this.generateTransformTextScript();
  const textValidation = this.validateScriptUniversality(transformText, 'transformText');
  validationResults.checks.push(textValidation);

  const transformDom = await this.generateTransformDomScript();
  const domValidation = this.validateScriptUniversality(transformDom, 'transformDOM');
  validationResults.checks.push(domValidation);

  // Collect errors and warnings
  validationResults.checks.forEach(check => {
    if (!check.isValid) {
      validationResults.errors.push(...check.errors);
      validationResults.isValid = false;
    }
    validationResults.warnings.push(...check.warnings);
  });

  return validationResults;
}


private validateScriptUniversality(script: string, scriptName: string): ValidationCheck {
  const localeSpecificPatterns = [
    /navigator\.language/,
    /Intl\./,
    /toLocaleString/,
    /getLocale|setLocale/,
    /direction.*===.*rtl/i,
    /arabic|hebrew|chinese|japanese/i
  ];

  const errors: string[] = [];
  const warnings: string[] = [];

  localeSpecificPatterns.forEach(pattern => {
    if (pattern.test(script)) {
      errors.push(`Locale-specific code found in ${scriptName}: ${pattern.source}`);
    }
  });

  // For DOM transform, check for specific required patterns
  if (scriptName.includes('transformDom') || scriptName.includes('transformDOM')) {
    // Check for correct function name
    if (!script.includes('function transformDOM')) {
      errors.push('DOM transform script must export function named "transformDOM"');
    }

    // Check for H2 targeting (simplified script requirement)
    if (!script.includes('h2') && !script.includes('H2')) {
      warnings.push('DOM transform script should target H2 elements for navigation anchors');
    }

    // Check for ID generation
    if (!script.includes('setAttribute') || !script.includes('id')) {
      warnings.push('DOM transform script should add ID attributes for navigation');
    }

    // Check for error handling
    if (!script.includes('try') || !script.includes('catch')) {
      warnings.push('DOM transform script should include error handling');
    }
  }

  // For text transform, check for basic requirements
  if (scriptName.includes('transformText')) {
    if (!script.includes('function transformText')) {
      errors.push('Text transform script must export function named "transformText"');
    }

    // Check for markdown processing
    if (!script.includes('replace') && !script.includes('markdown')) {
      warnings.push('Text transform script should process markdown-style formatting');
    }
  }

  return {
    name: `${scriptName} Validation`,
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
```

## Usage Examples

### Basic Asset Generation

```typescript
import { UniversalAssetGenerator } from './universal-asset-generator';

// Initialize generator
const generator = new UniversalAssetGenerator();

// Generate complete asset bundle
const assets = await generator.generateAssetBundle();

// Write assets to workspace
await writeTextFile(workspaceId, 'OEBPS/Styles/page.css', assets.css.content);
await writeTextFile(workspaceId, 'SOURCE/scripts/transformText.js', assets.transformText.content);
await writeTextFile(workspaceId, 'SOURCE/scripts/transformDom.js', assets.transformDom.content);
```

### Integration with Workspace Creation

```typescript
// In WorkspaceManager.createEPUBStructure()
async addUniversalAssets(workspaceId: string): Promise<void> {
  const assetGenerator = new UniversalAssetGenerator();

  // Validate transform script compatibility
  const validation = await assetGenerator.validateUniversalCompatibility();
  if (!validation.isValid) {
    throw new Error(`Transform script validation failed: ${validation.errors.join(', ')}`);
  }

  // Generate and write assets
  const assets = await assetGenerator.generateAssetBundle();

  await this.storage.writeTextFile(
    workspaceId,
    'OEBPS/Styles/page.css',
    assets.css.content
  );

  await this.storage.writeTextFile(
    workspaceId,
    'SOURCE/scripts/transformText.js',
    assets.transformText.content
  );

  await this.storage.writeTextFile(
    workspaceId,
    'SOURCE/scripts/transformDom.js',
    assets.transformDom.content
  );
}
```

### Testing Universal Compatibility

```typescript
// Test transform scripts work with different locales
const testLocales = ['en', 'ar', 'ja', 'he'];
const generator = new UniversalAssetGenerator();

for (const locale of testLocales) {
  // Test transform scripts with different content
  const transformText = await generator.generateTransformTextScript();
  const transformDOM = await generator.generateTransformDomScript();
  
  const testContent = createTestContent(locale);
  const result = executeTransforms(transformText, transformDOM, testContent);

  expect(result.success).toBe(true);
  expect(result.output).toBeTruthy();
}
```

## Testing Specifications

### Universal CSS Generation

```typescript
describe('Universal CSS Generation', () => {
  test('should generate valid CSS with progressive enhancement', async () => {
    const css = await generator.generateUniversalCSS();

    // Should contain progressive enhancement patterns
    expect(css).toContain('@supports');
    expect(css).toContain('margin-inline');
    expect(css).toContain('margin-left'); // Physical fallback
    expect(css).toContain('prefers-reduced-motion');
    expect(css).toContain('[dir="rtl"]'); // RTL fallbacks
  });

  test('should include accessibility features', async () => {
    const css = await generator.generateUniversalCSS();

    expect(css).toContain('prefers-reduced-motion');
    expect(css).toContain('prefers-contrast');
    expect(css).toContain('hyphens: auto');
    expect(css).toContain(':lang('); // Language-specific adjustments
  });
});
```

### Transform Script Universality

```typescript
describe('Universal Transform Scripts', () => {
  test('transformText should work for any language', async () => {
    const script = await generator.generateTransformTextScript();

    // Should not contain locale-specific code
    expect(script).not.toMatch(/navigator\.language/);
    expect(script).not.toMatch(/Intl\./);
    expect(script).not.toMatch(/arabic|hebrew|chinese/i);

    // Test with different scripts
    const testCases = [
      { locale: 'en', text: '# English Heading\n\nParagraph text.' },
      { locale: 'ar', text: '# عنوان عربي\n\nنص الفقرة.' },
      { locale: 'ja', text: '# 日本語見出し\n\n段落テキスト。' },
    ];

    testCases.forEach(testCase => {
      const result = executeTransformText(script, testCase.text);
      expect(result).toContain('<h1>');
      expect(result).toContain('<p>');
    });
  });

  test('transformDOM should add IDs to H2 elements', async () => {
    const script = await generator.generateTransformDomScript();
    
    // Create test document with H2 elements
    const testDocument = createTestDocumentWithH2Elements();

    executeTransformDOM(script, testDocument);

    // Should add ID attributes to H2 elements
    const h2Elements = testDocument.querySelectorAll('h2');
    h2Elements.forEach(h2 => {
      expect(h2.getAttribute('id')).toBeTruthy();
      expect(h2.getAttribute('id')).toMatch(/^[a-z0-9-]+$/); // Valid ID format
    });

    // Should not duplicate IDs
    const ids = Array.from(h2Elements).map(h2 => h2.getAttribute('id'));
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
});
```

### Cross-Locale Compatibility

```typescript
describe('Cross-Locale Compatibility', () => {
  test('transform scripts should work identically across all locales', async () => {
    const assets = await generator.generateAssetBundle();
    const locales = ['en', 'de', 'ar', 'he', 'ja', 'ka', 'zh-Hant'];

    const results = await Promise.all(locales.map(locale => testTransformScriptsWithLocale(assets, locale)));

    results.forEach((result, index) => {
      expect(result.textTransformWorks).toBe(true);
      expect(result.domTransformWorks).toBe(true);
      expect(result.noLocaleSpecificCode).toBe(true);
    });
  });
});
```

## Performance Considerations

### Asset Generation

- **Template Caching**: Cache generated templates for repeated use
- **Minification**: Optionally minify CSS and JavaScript for production
- **Compression**: Use gzip compression for asset storage

### Runtime Performance

- **CSS Efficiency**: Logical properties have minimal performance impact
- **Script Optimization**: Transform scripts use efficient DOM manipulation
- **Memory Usage**: Scripts clean up temporary variables and references

## EPUB Reading System Compatibility

### Compatibility Matrix (2024)

| Reading System | Logical Properties | Feature Queries | Accessibility | Notes |
|---|---|---|---|---|
| **Apple Books** | ✅ Full | ✅ Yes | ✅ Excellent | WebKit-based, best standards support |
| **Adobe Digital Editions** | ⚠️ Partial | ❌ Limited | ⚠️ Basic | Trident engine, requires fallbacks |
| **Kobo** | ✅ Good | ✅ Yes | ✅ Good | WebKit-based, solid support |
| **Amazon Kindle** | ⚠️ Partial | ⚠️ Limited | ⚠️ Basic | Custom engine, inconsistent support |
| **Google Play Books** | ✅ Good | ✅ Yes | ✅ Good | Chromium-based |
| **Readium** | ✅ Excellent | ✅ Yes | ✅ Excellent | Reference implementation |

### Progressive Enhancement Strategy

The generated CSS uses a three-tier compatibility approach:

1. **Physical Properties First**: Ensure basic layout works everywhere
2. **RTL Fallbacks**: Manual RTL support for systems without logical properties
3. **Feature Queries**: Modern logical properties for capable systems

### Testing Recommendations

- **Primary Testing**: Adobe Digital Editions (weakest compatibility)
- **Standards Testing**: Apple Books, Readium (best standards support)
- **Mobile Testing**: Kobo, Google Play Books (mobile-focused)
- **Cross-Platform**: Test across iOS, Android, Windows, macOS

### Known Issues and Workarounds

#### Adobe Digital Editions
- Limited `@supports` query support
- Inconsistent logical properties rendering
- **Workaround**: Physical properties with `[dir="rtl"]` selectors

#### Amazon Kindle
- Custom CSS interpretation
- Limited font-family support
- **Workaround**: Simplified CSS with system fonts only

#### Older Systems
- No CSS Grid support
- Limited flexbox support
- **Workaround**: Float-based layouts in fallbacks

## Dependencies

### Required Dependencies

- **CSS Logical Properties Support**: Modern browser CSS support with fallbacks
- **DOM API**: Standard DOM manipulation methods
- **EPUB Standards**: EPUB 3.2 specification compliance
- **Feature Query Support**: For progressive enhancement

### Optional Dependencies

- **CSS Validation**: For asset validation during development
- **JavaScript Minification**: For production asset optimization
- **Performance Monitoring**: For asset generation timing
- **EPUB Validators**: For cross-system compatibility testing

## Integration Guidelines

### With Workspace Creation

```typescript
// Integration point in WorkspaceManager
class WorkspaceManager {
  private assetGenerator: UniversalAssetGenerator;

  constructor() {
    this.assetGenerator = new UniversalAssetGenerator();
  }

  async createEPUBStructure(workspaceId: string): Promise<void> {
    // ... other structure creation

    // Add universal assets
    await this.addUniversalAssets(workspaceId);
  }
}
```

### With SourceManager

```typescript
// Integration with SOURCE file creation
class SourceManager {
  async initializeWithSampleContent(workspaceId: string): Promise<void> {
    const assetGenerator = new UniversalAssetGenerator();
    const assets = await assetGenerator.generateAssetBundle();

    // Write transform scripts to SOURCE/scripts/
    await this.writeTransformScripts(workspaceId, assets);
  }
}
```

## Future Enhancements

### Advanced CSS Features

- **Container Queries**: Responsive design based on container size
- **CSS Grid**: Advanced layout capabilities with logical properties
- **Custom Properties**: CSS variables for theming

### Script Enhancements

- **Plugin System**: Extensible transform script architecture
- **Performance Optimization**: Faster markdown parsing and DOM manipulation
- **Advanced Markdown**: Support for tables, footnotes, and custom extensions

### Validation Improvements

- **Automated Testing**: Continuous validation across all supported locales
- **Performance Monitoring**: Track asset generation and runtime performance
- **Accessibility Auditing**: Automated accessibility compliance checking

This API documentation provides the foundation for generating universal assets that work seamlessly across all locales while maintaining optimal performance and accessibility standards.
