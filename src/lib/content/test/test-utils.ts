/**
 * Test utilities for Translation Content System
 *
 * Provides mock objects and helper functions following existing project patterns
 * for testing the SampleContentGenerator in isolation.
 */

import { vi, expect } from 'vitest';
import type { TranslationCatalog } from '../../i18n/types.js';
import type { LocaleConfig } from '../../i18n/types.js';
import { LOCALE_CONFIGS } from '../../i18n/locale-config.js';
import { createTestCatalogs, createIncompleteCatalogs } from './fixtures.js';

/**
 * Mock I18n System interface matching the real I18nSystem
 */
export interface MockI18nSystem {
  translate: (key: string, params?: Record<string, any>) => string;
  getCurrentLocale: () => string;
  getAvailableLocales: () => LocaleConfig[];
  hasTranslation: (locale: string, key: string) => boolean;
  isLocaleSupported: (locale: string) => boolean;
  isRTL: (locale: string) => boolean;
}

/**
 * Create a mock I18n system with realistic behavior
 */
export function createMockI18nSystem(
  catalogs: Record<string, TranslationCatalog> = createTestCatalogs()
): MockI18nSystem {
  const localeState = { current: 'en' };

  const mockSystem = {
    translate: vi.fn((key: string, params: Record<string, any> = {}) => {
      // Get translation from current locale catalog
      const catalog = catalogs[localeState.current];
      let translation = catalog?.messages[key];

      // Fallback to English if not found (but not for empty strings)
      if (translation === undefined && localeState.current !== 'en') {
        translation = catalogs.en?.messages[key];
      }

      // Ultimate fallback to key itself
      if (translation === undefined) {
        translation = key;
      }

      // Simple parameter interpolation
      if (Object.keys(params).length > 0) {
        for (const [param, value] of Object.entries(params)) {
          translation = translation.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
        }
      }

      return translation;
    }),

    getCurrentLocale: vi.fn(() => localeState.current),

    getAvailableLocales: vi.fn(() => {
      return Object.keys(LOCALE_CONFIGS).map(code => LOCALE_CONFIGS[code]);
    }),

    hasTranslation: vi.fn((locale: string, key: string) => {
      const catalog = catalogs[locale];
      if (!catalog) return false;

      const translation = catalog.messages[key];
      return translation !== undefined && translation.trim() !== '';
    }),

    isLocaleSupported: vi.fn((locale: string) => {
      return locale in LOCALE_CONFIGS;
    }),

    isRTL: vi.fn((locale: string) => {
      const config = LOCALE_CONFIGS[locale];
      return config ? config.direction === 'rtl' : false;
    }),
  };

  // Add a way to change the locale state
  (mockSystem as any)._setLocale = (locale: string) => {
    localeState.current = locale;
    (mockSystem.getCurrentLocale as any).mockReturnValue(locale);
  };

  return mockSystem;
}

/**
 * Create a mock I18n system with missing translations for error testing
 */
export function createMockI18nSystemWithMissing(): MockI18nSystem {
  const incompleteCatalogData = createIncompleteCatalogs();
  const allCatalogs = { ...createTestCatalogs(), ...incompleteCatalogData };

  const mockSystem = createMockI18nSystem(allCatalogs);

  // Override isLocaleSupported to include the test locales for error testing
  mockSystem.isLocaleSupported = vi.fn((locale: string) => {
    // Include the standard supported locales plus the test locales
    return (
      locale in LOCALE_CONFIGS || locale === 'fr' || locale === 'es' || locale === 'problematic'
    );
  });

  // Add catalog introspection helper for distinguishing missing vs empty keys
  (mockSystem as any)._hasKeyInCatalog = (locale: string, key: string) => {
    const catalog = allCatalogs[locale];
    return catalog && key in catalog.messages;
  };

  // Update hasTranslation to distinguish missing vs empty more accurately
  mockSystem.hasTranslation = vi.fn((locale: string, key: string) => {
    const catalog = allCatalogs[locale];
    if (!catalog || !(key in catalog.messages)) return false;

    const translation = catalog.messages[key];
    // Return true if the key exists in the catalog, even if it's empty
    // This allows the validation logic to distinguish between missing and empty keys
    return translation !== undefined;
  });

  return mockSystem;
}

/**
 * Create a mock I18n system that simulates unsupported locale
 */
export function createMockI18nSystemUnsupported(): MockI18nSystem {
  const mockSystem = createMockI18nSystem();

  // Override to return false for unsupported locales
  mockSystem.isLocaleSupported = vi.fn((locale: string) => {
    return locale !== 'invalid-xx' && locale in LOCALE_CONFIGS;
  });

  return mockSystem;
}

/**
 * Helper to set current locale on mock system
 */
export function setMockLocale(mockSystem: MockI18nSystem, locale: string): void {
  // Use the internal _setLocale method to properly update the locale state
  if ('_setLocale' in mockSystem) {
    (mockSystem as any)._setLocale(locale);
  } else {
    // Fallback for older mock systems
    (mockSystem.getCurrentLocale as any).mockReturnValue(locale);
  }
}

/**
 * Verify that mock system methods were called correctly
 */
export function expectTranslationCalls(
  mockSystem: MockI18nSystem,
  expectedKeys: readonly string[]
): void {
  const translateSpy = mockSystem.translate as any;

  expectedKeys.forEach(key => {
    expect(translateSpy).toHaveBeenCalledWith(key, expect.any(Object));
  });
}

/**
 * Verify locale support checks
 */
export function expectLocaleSupportCheck(mockSystem: MockI18nSystem, locale: string): void {
  expect(mockSystem.isLocaleSupported).toHaveBeenCalledWith(locale);
}

/**
 * Verify RTL direction checks
 */
export function expectRTLCheck(mockSystem: MockI18nSystem, locale: string): void {
  expect(mockSystem.isRTL).toHaveBeenCalledWith(locale);
}

/**
 * Create EPUBMetadata type mock for testing (based on EPUB spec)
 */
export function createMockEPUBMetadata() {
  return {
    title: 'Mock EPUB Title',
    language: 'en',
    identifier: 'mock-epub-123',
    creator: ['Mock Author'],
    publisher: 'Mock Publisher',
    description: 'Mock EPUB description',
    pageProgressionDirection: 'ltr' as const,
  };
}

/**
 * Assertion helpers for complex object matching
 */
export function expectLocalizedContent(
  actual: any,
  locale: string,
  expectedChapterCount: number = 4
): void {
  expect(actual).toEqual({
    locale,
    metadata: expect.objectContaining({
      title: expect.any(String),
      description: expect.any(String),
      author: expect.any(String),
      publisher: expect.any(String),
    }),
    chapters: expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        content: expect.any(String),
        linear: expect.any(Boolean),
      }),
    ]),
    isRTL: expect.any(Boolean),
    pageProgressionDirection: expect.stringMatching(/^(ltr|rtl)$/),
  });

  expect(actual.chapters).toHaveLength(expectedChapterCount);
}

/**
 * Assertion helpers for DemoChapter arrays
 */
export function expectDemoChapters(actual: any[], expectedCount: number = 4): void {
  expect(actual).toHaveLength(expectedCount);

  actual.forEach(chapter => {
    expect(chapter).toEqual({
      id: expect.any(String),
      title: expect.any(String),
      content: expect.any(String),
      linear: expect.any(Boolean),
      mediaType: 'application/xhtml+xml',
    });
  });
}

/**
 * Assertion helpers for EPUB metadata
 */
export function expectEPUBMetadata(actual: any, locale: string): void {
  expect(actual).toEqual({
    title: expect.any(String),
    language: locale,
    identifier: expect.stringMatching(/^sample-content-[a-z-]+-\d+$/),
    creator: expect.arrayContaining([expect.any(String)]),
    publisher: expect.any(String),
    description: expect.any(String),
    pageProgressionDirection: expect.stringMatching(/^(ltr|rtl)$/),
  });
}

/**
 * Assertion helpers for validation results
 */
export function expectValidationResult(
  actual: any,
  locale: string,
  isValid: boolean,
  missingKeys: string[] = [],
  emptyKeys: string[] = []
): void {
  expect(actual).toEqual({
    isValid,
    missingKeys: expect.arrayContaining(missingKeys),
    emptyKeys: expect.arrayContaining(emptyKeys),
    locale,
  });

  if (missingKeys.length > 0) {
    expect(actual.missingKeys).toHaveLength(missingKeys.length);
  }

  if (emptyKeys.length > 0) {
    expect(actual.emptyKeys).toHaveLength(emptyKeys.length);
  }
}

/**
 * Mock browser console for error/warning testing
 */
export function createMockConsole() {
  return {
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
    info: vi.fn(),
  };
}

/**
 * Reset all mocks helper
 */
export function resetAllMocks(mockSystem: MockI18nSystem): void {
  // Preserve current locale state before reset
  const currentLocale = mockSystem.getCurrentLocale();

  vi.clearAllMocks();
  Object.values(mockSystem).forEach(method => {
    if (typeof method === 'function' && 'mockReset' in method) {
      (method as any).mockReset();
    }
  });

  // Restore locale state after reset
  if ('_setLocale' in mockSystem) {
    (mockSystem as any)._setLocale(currentLocale);
  }
}

/**
 * Expected sample content keys for validation testing
 */
export const EXPECTED_SAMPLE_KEYS = [
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
  'sample.appendix.content',
] as const;

/**
 * Available test locales
 */
export const TEST_LOCALES = ['en', 'de', 'ar'] as const;

/**
 * Helper to create test workspace ID
 */
export function createTestWorkspaceId(): string {
  return `test-workspace-${Date.now()}`;
}
