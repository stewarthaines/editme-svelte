/**
 * Unit tests for i18n runtime system
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import {
  t,
  initI18n,
  setLocale,
  currentLocale,
  documentDirection,
  isLoading,
  isInitialized,
  getAvailableLocales,
  getCurrentLocaleConfig,
  _resetI18nForTesting,
} from '../index.js';
import { MockLocalStorage, mockTranslationCatalogs } from './fixtures/mock-translations.js';

// Mock the loader
const mockLoader = {
  needsUpdate: vi.fn(),
  extractTranslations: vi.fn(),
  loadTranslations: vi.fn(),
};

vi.mock('../loader.js', () => ({
  createI18nLoader: () => mockLoader,
}));

// Mock navigator for browser locale detection
const mockNavigator = {
  languages: ['en-US', 'en'],
  language: 'en-US',
};

describe('i18n runtime system', () => {
  let mockLocalStorage: MockLocalStorage;
  let originalNavigator: any;
  let originalDocument: any;

  beforeEach(() => {
    // Setup mocks
    mockLocalStorage = new MockLocalStorage();
    originalNavigator = globalThis.navigator;
    originalDocument = globalThis.document;

    // Reset mock navigator to default English
    mockNavigator.languages = ['en-US', 'en'];
    mockNavigator.language = 'en-US';

    // Mock globalThis properties
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true,
    });

    // Mock document
    const mockDocumentElement = {
      dir: 'ltr',
      setAttribute: vi.fn(),
    };

    Object.defineProperty(globalThis, 'document', {
      value: {
        documentElement: mockDocumentElement,
      },
      writable: true,
      configurable: true,
    });

    // Reset i18n system state
    _resetI18nForTesting();

    // Reset loader mocks
    mockLoader.needsUpdate.mockReset();
    mockLoader.extractTranslations.mockReset();
    mockLoader.loadTranslations.mockReset();
  });

  afterEach(() => {
    // Restore originals
    if (originalNavigator !== undefined) {
      globalThis.navigator = originalNavigator;
    } else {
      delete (globalThis as any).navigator;
    }

    if (originalDocument !== undefined) {
      globalThis.document = originalDocument;
    } else {
      delete (globalThis as any).document;
    }

    vi.restoreAllMocks();
  });

  describe('translation function t()', () => {
    beforeEach(async () => {
      // Setup with mock catalogs
      _resetI18nForTesting();
      mockLoader.needsUpdate.mockResolvedValue(false);
      mockLoader.loadTranslations.mockResolvedValue(mockTranslationCatalogs);
      await initI18n();
    });

    it('should translate basic strings', () => {
      expect(get(t)('Save')).toBe('Save');
      expect(get(t)('Cancel')).toBe('Cancel');
      expect(get(t)('Delete')).toBe('Delete');
    });

    it('should handle missing translations with fallback', () => {
      expect(get(t)('Nonexistent key')).toBe('Nonexistent key');
    });

    it('should interpolate parameters', () => {
      expect(get(t)('Found {count} items', { count: 5 })).toBe('Found 5 items');
      expect(get(t)('Found {count} items', { count: 0 })).toBe('Found 0 items');
    });

    it('should handle multiple parameters', () => {
      const result = get(t)('Hello {name}, you have {count} messages', {
        name: 'John',
        count: 3,
      });
      expect(result).toBe('Hello John, you have 3 messages');
    });

    it('should translate to German when locale is set', async () => {
      await setLocale('de');

      expect(get(t)('Save')).toBe('Speichern');
      expect(get(t)('Cancel')).toBe('Abbrechen');
      expect(get(t)('Delete')).toBe('Löschen');
    });

    it('should fall back to English for missing German translations', async () => {
      await setLocale('de');

      // This key doesn't exist in German catalog
      expect(get(t)('Nonexistent key')).toBe('Nonexistent key');
    });

    it('should ignore a switch to a non-enabled locale (Arabic) and stay on English', async () => {
      // Arabic is scaffolded but not enabled (no genuine translation shipped), so
      // setLocale must refuse it rather than surface a placeholder/English-stub UI.
      await setLocale('ar');

      expect(get(currentLocale)).toBe('en');
      expect(get(t)('Save')).toBe('Save');
    });
  });

  describe('initI18n()', () => {
    it('should initialize successfully with mock catalogs', async () => {
      expect(get(isInitialized)).toBe(false);
      expect(get(isLoading)).toBe(false);

      mockLoader.needsUpdate.mockResolvedValue(false);
      mockLoader.loadTranslations.mockResolvedValue(mockTranslationCatalogs);

      await initI18n();

      expect(get(isInitialized)).toBe(true);
      expect(get(isLoading)).toBe(false);
      expect(get(currentLocale)).toBe('en');
    });

    it('should extract translations when update needed', async () => {
      mockLoader.needsUpdate.mockResolvedValue(true);
      mockLoader.extractTranslations.mockResolvedValue(undefined);
      mockLoader.loadTranslations.mockResolvedValue(mockTranslationCatalogs);

      await initI18n();

      expect(mockLoader.extractTranslations).toHaveBeenCalled();
      expect(get(isInitialized)).toBe(true);
    });

    it('should not initialize twice', async () => {
      mockLoader.needsUpdate.mockResolvedValue(false);
      mockLoader.loadTranslations.mockResolvedValue(mockTranslationCatalogs);

      await initI18n();
      await initI18n(); // Second call

      expect(mockLoader.loadTranslations).toHaveBeenCalledTimes(1);
    });

    it('should fall back to English on error', async () => {
      mockLoader.needsUpdate.mockRejectedValue(new Error('Load failed'));

      await initI18n();

      expect(get(isInitialized)).toBe(true);
      expect(get(currentLocale)).toBe('en');
      expect(get(t)('Save')).toBe('Save'); // Fallback English
    });

    it('should ignore a non-enabled browser locale (Arabic) and use English/LTR', async () => {
      // An Arabic browser must not auto-select the not-yet-translated ar catalog.
      mockNavigator.languages = ['ar-SA', 'ar'];
      mockLoader.needsUpdate.mockResolvedValue(false);
      mockLoader.loadTranslations.mockResolvedValue(mockTranslationCatalogs);

      await initI18n();

      expect(get(currentLocale)).toBe('en');
      expect(globalThis.document?.documentElement.lang).toBe('en');
      expect(globalThis.document?.documentElement.setAttribute).toHaveBeenCalledWith(
        'data-dir',
        'ltr'
      );
      expect(globalThis.document?.documentElement.setAttribute).toHaveBeenCalledWith(
        'data-locale',
        'en'
      );
    });

    it('should set document direction for LTR locale', async () => {
      mockNavigator.languages = ['de-DE', 'de'];
      mockLoader.needsUpdate.mockResolvedValue(false);
      mockLoader.loadTranslations.mockResolvedValue(mockTranslationCatalogs);

      await initI18n();

      expect(globalThis.document?.documentElement.setAttribute).toHaveBeenCalledWith(
        'data-dir',
        'ltr'
      );
      expect(globalThis.document?.documentElement.setAttribute).toHaveBeenCalledWith(
        'data-locale',
        'de'
      );
    });
  });

  describe('setLocale()', () => {
    beforeEach(async () => {
      _resetI18nForTesting();
      mockLoader.needsUpdate.mockResolvedValue(false);
      mockLoader.loadTranslations.mockResolvedValue(mockTranslationCatalogs);
      await initI18n();
    });

    it('should switch locale successfully', async () => {
      expect(get(currentLocale)).toBe('en');

      await setLocale('de');

      expect(get(currentLocale)).toBe('de');
      expect(get(t)('Save')).toBe('Speichern');
      // The real <html lang>/dir track the active UI locale, not just data-*.
      expect(globalThis.document?.documentElement.lang).toBe('de');
      expect(globalThis.document?.documentElement.dir).toBe('ltr');
    });

    it('should refuse to switch to a non-enabled locale and stay LTR', async () => {
      await setLocale('ar'); // not enabled

      expect(get(currentLocale)).toBe('en');
      expect(get(documentDirection)).toBe('ltr');
    });

    it('should store locale preference', async () => {
      await setLocale('de');

      expect(mockLocalStorage.getItem('editme-locale')).toBe('de');
    });

    it('should throw error for unsupported locale', async () => {
      await expect(setLocale('invalid')).rejects.toThrow('Unsupported locale: invalid');
    });

    it('should throw error when not initialized', async () => {
      // Reset to uninitialized state
      _resetI18nForTesting();
      mockLoader.needsUpdate.mockResolvedValue(false);
      mockLoader.loadTranslations.mockResolvedValue({});

      await expect(setLocale('de')).rejects.toThrow('i18n system not initialized');
    });

    it('should warn and no-op when switching to a non-enabled locale', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
        /* silence */
      });

      await setLocale('ja'); // known but not enabled

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('is not enabled'));
      expect(get(currentLocale)).toBe('en');

      consoleSpy.mockRestore();
    });
  });

  describe('reactive stores', () => {
    beforeEach(async () => {
      _resetI18nForTesting();
      mockLoader.needsUpdate.mockResolvedValue(false);
      mockLoader.loadTranslations.mockResolvedValue(mockTranslationCatalogs);
      await initI18n();
    });

    it('should update currentLocale store', async () => {
      expect(get(currentLocale)).toBe('en');

      await setLocale('de');

      expect(get(currentLocale)).toBe('de');
    });

    it('should keep documentDirection LTR when a non-enabled RTL locale is attempted', async () => {
      expect(get(documentDirection)).toBe('ltr');

      await setLocale('ar'); // not enabled — refused

      expect(get(documentDirection)).toBe('ltr');
    });

    it('should keep documentDirection LTR across enabled locales', async () => {
      await setLocale('de');

      expect(get(documentDirection)).toBe('ltr');
    });
  });

  describe('utility functions', () => {
    beforeEach(async () => {
      _resetI18nForTesting();
      mockLoader.needsUpdate.mockResolvedValue(false);
      mockLoader.loadTranslations.mockResolvedValue(mockTranslationCatalogs);
      await initI18n();
    });

    it('should return only the enabled locales (English, German)', () => {
      const locales = getAvailableLocales();
      const codes = locales.map(l => l.code).sort();

      expect(codes).toEqual(['de', 'en']);
      // Scaffolded-but-not-enabled locales must not appear in the picker.
      expect(codes).not.toContain('ar');
      expect(codes).not.toContain('ja');
    });

    it('should return current locale config', () => {
      const config = getCurrentLocaleConfig();

      expect(config).toEqual({
        code: 'en',
        name: 'English',
        direction: 'ltr',
        englishName: 'English',
      });
    });

    it('should return current locale config after switching', async () => {
      await setLocale('de');

      const config = getCurrentLocaleConfig();

      expect(config).toEqual({
        code: 'de',
        name: 'Deutsch',
        direction: 'ltr',
        englishName: 'German',
      });
    });
  });

  describe('browser locale detection', () => {
    it('should detect exact locale match', async () => {
      mockNavigator.languages = ['de-DE', 'en-US'];
      mockLoader.needsUpdate.mockResolvedValue(false);
      mockLoader.loadTranslations.mockResolvedValue(mockTranslationCatalogs);

      await initI18n();

      expect(get(currentLocale)).toBe('de');
    });

    it('should detect language code match', async () => {
      mockNavigator.languages = ['de-AT', 'en-US']; // Austrian German
      mockLoader.needsUpdate.mockResolvedValue(false);
      mockLoader.loadTranslations.mockResolvedValue(mockTranslationCatalogs);

      await initI18n();

      expect(get(currentLocale)).toBe('de');
    });

    it('should fall back to English for unsupported language', async () => {
      mockNavigator.languages = ['fr-FR', 'es-ES']; // Unsupported languages
      mockLoader.needsUpdate.mockResolvedValue(false);
      mockLoader.loadTranslations.mockResolvedValue(mockTranslationCatalogs);

      await initI18n();

      expect(get(currentLocale)).toBe('en');
    });

    it('should fall back to English for a non-enabled browser locale (zh-TW)', async () => {
      // zh-Hant is scaffolded but not enabled, so a Taiwan browser stays on English.
      mockNavigator.languages = ['zh-TW'];
      mockLoader.needsUpdate.mockResolvedValue(false);
      mockLoader.loadTranslations.mockResolvedValue(mockTranslationCatalogs);

      await initI18n();

      expect(get(currentLocale)).toBe('en');
    });

    it('should fall back to English for a non-enabled browser locale (Japanese)', async () => {
      mockNavigator.languages = ['ja-JP', 'ja'];
      mockLoader.needsUpdate.mockResolvedValue(false);
      mockLoader.loadTranslations.mockResolvedValue(mockTranslationCatalogs);

      await initI18n();

      expect(get(currentLocale)).toBe('en');
    });
  });
});
