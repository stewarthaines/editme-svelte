/**
 * Test Fixtures for Text Editor Store Tests
 *
 * Provides test data, helper functions, and mock utilities for text editor store testing.
 * Follows TESTING.md patterns for creating focused, behavior-based test fixtures.
 */

// ============================================================================
// Test Data Constants
// ============================================================================

/**
 * Valid editor ID patterns for testing
 */
export const VALID_EDITOR_IDS = [
  'outline-nav',
  'chapter-1-source',
  'chapter-2-source',
  'transform-text-js',
  'transform-dom-js',
  'spine-item-1',
  'metadata-editor',
  'settings-editor',
  'extension-config',
  'nav-document',
] as const;

/**
 * Sample content for testing different scenarios
 */
export const SAMPLE_CONTENT = {
  SHORT_TEXT: 'Hello, world!',
  MEDIUM_TEXT: `# Chapter 1: Introduction

This is a sample chapter with multiple lines of content.
It includes various formatting and text patterns.

## Section 1.1
Some more content here with **bold** and *italic* text.

- List item 1
- List item 2
- List item 3

The end.`,
  LARGE_TEXT:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50) +
    'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. '.repeat(30),
  EMPTY_STRING: '',
  WHITESPACE_ONLY: '   \n\t  \r\n  ',
  UNICODE_TEXT: '🎉 Unicode content with émojis and spëcial chars 中文 العربية',
  SPECIAL_CHARS: '<script>alert("test")</script>&lt;&gt;"\'',
  MULTILINE_TEXT: 'Line 1\nLine 2\nLine 3\n\nLine 5',
} as const;

/**
 * Edge case content patterns for comprehensive testing
 */
export const EDGE_CASE_CONTENT: Array<[string, string]> = [
  ['empty string', ''],
  ['single space', ' '],
  ['newline only', '\n'],
  ['tab only', '\t'],
  ['carriage return', '\r'],
  ['multiple whitespace', '   \n\t  \r\n  '],
  ['null character', '\0'],
  ['unicode emoji', '🎉🚀💯'],
  ['unicode text', '中文 العربية हिंदी'],
  ['html entities', '&lt;div&gt;&amp;nbsp;&lt;/div&gt;'],
  ['javascript code', 'function test() { return "hello"; }'],
  ['json content', '{"key": "value", "number": 42}'],
  ['xml content', '<?xml version="1.0"?><root><item>value</item></root>'],
  ['markdown content', '# Header\n\n**bold** and *italic* text'],
  ['very long line', 'x'.repeat(1000)],
  ['mixed line endings', 'line1\nline2\r\nline3\rline4'],
];

/**
 * Invalid inputs that should be ignored by updateContent()
 */
export const INVALID_INPUTS: Array<[string, any]> = [
  ['null', null],
  ['undefined', undefined],
  ['number', 42],
  ['boolean true', true],
  ['boolean false', false],
  ['object', { text: 'content' }],
  ['array', ['a', 'b', 'c']],
  ['function', () => 'content'],
  ['symbol', Symbol('test')],
  ['bigint', BigInt(123)],
  ['NaN', NaN],
  ['Infinity', Infinity],
  ['Date object', new Date()],
  ['RegExp object', /pattern/g],
  ['Error object', new Error('test')],
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a unique editor ID for testing to avoid collisions
 */
export function createUniqueEditorId(prefix = 'test-editor'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
