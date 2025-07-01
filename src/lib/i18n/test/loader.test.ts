/**
 * Unit tests for translation loader
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createI18nLoader } from '../loader.js';
import { 
  MockLocalStorage, 
  MockDecompressionStream,
  createMockDataUrl,
  createMockTranslationArchive,
  mockTranslationCatalogs 
} from './fixtures/mock-translations.js';

// Mock file storage
const mockFileStorage = {
  init: vi.fn(),
  isInitialized: vi.fn().mockReturnValue(true),
  listFiles: vi.fn(),
  createWorkspace: vi.fn(),
  writeTextFile: vi.fn(),
  readTextFile: vi.fn()
};

// Mock storage module
vi.mock('../storage/index.js', () => ({
  FileStorageAPI: vi.fn().mockImplementation(() => mockFileStorage)
}));

describe('TranslationLoader', () => {
  let loader: ReturnType<typeof createI18nLoader>;
  let mockLocalStorage: MockLocalStorage;
  let originalGlobalThis: any;

  beforeEach(() => {
    // Setup mocks
    mockLocalStorage = new MockLocalStorage();
    
    // Mock globalThis and localStorage
    originalGlobalThis = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      configurable: true
    });

    // Mock fetch globally
    globalThis.fetch = vi.fn();
    
    // Mock DecompressionStream
    globalThis.DecompressionStream = MockDecompressionStream as any;

    // Reset file storage mocks
    mockFileStorage.init.mockReset();
    mockFileStorage.isInitialized.mockReturnValue(true);
    mockFileStorage.listFiles.mockReset();
    mockFileStorage.createWorkspace.mockReset();
    mockFileStorage.writeTextFile.mockReset();
    mockFileStorage.readTextFile.mockReset();

    loader = createI18nLoader();
  });

  afterEach(() => {
    // Restore original globalThis
    if (originalGlobalThis !== undefined) {
      globalThis.localStorage = originalGlobalThis;
    } else {
      delete (globalThis as any).localStorage;
    }
    
    vi.restoreAllMocks();
  });

  describe('needsUpdate()', () => {
    it('should return true when version mismatch', async () => {
      mockLocalStorage.setItem('editme-i18n-version', '0.9.0');
      
      const needsUpdate = await loader.needsUpdate();
      
      expect(needsUpdate).toBe(true);
    });

    it('should return true when no version stored', async () => {
      const needsUpdate = await loader.needsUpdate();
      
      expect(needsUpdate).toBe(true);
    });

    it('should return true when insufficient locale files', async () => {
      mockLocalStorage.setItem('editme-i18n-version', '1.0.0');
      mockFileStorage.listFiles.mockResolvedValue([
        'en.json',
        'de.json'
      ]);
      
      const needsUpdate = await loader.needsUpdate();
      
      expect(needsUpdate).toBe(true);
      expect(mockFileStorage.listFiles).toHaveBeenCalledWith('locales');
    });

    it('should return false when version matches and all files present', async () => {
      mockLocalStorage.setItem('editme-i18n-version', '1.0.0');
      mockFileStorage.listFiles.mockResolvedValue([
        'en.json',
        'de.json',
        'ka.json',
        'ar.json',
        'he.json',
        'zh-Hant.json',
        'ja.json'
      ]);
      
      const needsUpdate = await loader.needsUpdate();
      
      expect(needsUpdate).toBe(false);
    });

    it('should return true on storage error', async () => {
      mockLocalStorage.setItem('editme-i18n-version', '1.0.0');
      mockFileStorage.listFiles.mockRejectedValue(new Error('Storage error'));
      
      const needsUpdate = await loader.needsUpdate();
      
      expect(needsUpdate).toBe(true);
    });
  });

  describe('extractTranslations()', () => {
    it('should extract translations from data URL', async () => {
      const mockDataUrl = createMockDataUrl();
      (globalThis as any).__EDITME_TRANSLATIONS_ZIP__ = mockDataUrl;
      
      // Mock fetch response
      const mockResponse = {
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100))
      };
      (globalThis.fetch as any).mockResolvedValue(mockResponse);

      await loader.extractTranslations();

      expect(globalThis.fetch).toHaveBeenCalledWith(mockDataUrl);
      expect(mockFileStorage.createWorkspace).toHaveBeenCalledWith('locales');
      expect(mockLocalStorage.getItem('editme-i18n-version')).toBe('1.0.0');
    });

    it('should throw error when data URL missing', async () => {
      delete (globalThis as any).__EDITME_TRANSLATIONS_ZIP__;

      await expect(loader.extractTranslations()).rejects.toThrow(
        'Translation data URL not found'
      );
    });

    it('should throw error when fetch fails', async () => {
      const mockDataUrl = createMockDataUrl();
      (globalThis as any).__EDITME_TRANSLATIONS_ZIP__ = mockDataUrl;
      
      const mockResponse = {
        ok: false,
        status: 404
      };
      (globalThis.fetch as any).mockResolvedValue(mockResponse);

      await expect(loader.extractTranslations()).rejects.toThrow(
        'Failed to fetch translation data: 404'
      );
    });

    it('should throw error when DecompressionStream unavailable', async () => {
      delete (globalThis as any).DecompressionStream;
      
      const mockDataUrl = createMockDataUrl();
      (globalThis as any).__EDITME_TRANSLATIONS_ZIP__ = mockDataUrl;
      
      const mockResponse = {
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100))
      };
      (globalThis.fetch as any).mockResolvedValue(mockResponse);

      await expect(loader.extractTranslations()).rejects.toThrow(
        'DecompressionStream not available'
      );
    });
  });

  describe('loadTranslations()', () => {
    it('should load translations from storage', async () => {
      mockFileStorage.listFiles.mockResolvedValue([
        'en.json',
        'de.json',
        'ar.json'
      ]);

      mockFileStorage.readTextFile
        .mockResolvedValueOnce(JSON.stringify({
          '': { Language: 'en' },
          'Save': 'Save',
          'Cancel': 'Cancel'
        }))
        .mockResolvedValueOnce(JSON.stringify({
          '': { Language: 'de' },
          'Save': 'Speichern',
          'Cancel': 'Abbrechen'
        }))
        .mockResolvedValueOnce(JSON.stringify({
          '': { Language: 'ar' },
          'Save': 'حفظ',
          'Cancel': 'إلغاء'
        }));

      const catalogs = await loader.loadTranslations();

      expect(Object.keys(catalogs)).toEqual(['en', 'de', 'ar']);
      expect(catalogs.en.messages.Save).toBe('Save');
      expect(catalogs.de.messages.Save).toBe('Speichern');
      expect(catalogs.ar.messages.Save).toBe('حفظ');
      expect(mockFileStorage.listFiles).toHaveBeenCalledWith('locales');
    });

    it('should handle po2json array values (plurals)', async () => {
      mockFileStorage.listFiles.mockResolvedValue([
        'en.json'
      ]);

      mockFileStorage.readTextFile.mockResolvedValue(JSON.stringify({
        '': { Language: 'en' },
        'Save': 'Save',
        '{count} item': ['{count} item', '{count} items'] // Plural form
      }));

      const catalogs = await loader.loadTranslations();

      expect(catalogs.en.messages['{count} item']).toBe('{count} item');
    });

    it('should skip invalid JSON files', async () => {
      mockFileStorage.listFiles.mockResolvedValue([
        'en.json',
        'invalid.json'
      ]);

      mockFileStorage.readTextFile
        .mockResolvedValueOnce(JSON.stringify({
          '': { Language: 'en' },
          'Save': 'Save'
        }))
        .mockRejectedValueOnce(new Error('Invalid JSON'));

      const catalogs = await loader.loadTranslations();

      expect(Object.keys(catalogs)).toEqual(['en']);
      expect(catalogs.en.messages.Save).toBe('Save');
    });

    it('should throw error on storage failure', async () => {
      mockFileStorage.listFiles.mockRejectedValue(new Error('Storage failure'));

      await expect(loader.loadTranslations()).rejects.toThrow('Storage failure');
    });
  });

  describe('extractMessages()', () => {
    it('should extract messages from po2json format', async () => {
      const po2jsonData = {
        '': { Language: 'en', 'Content-Type': 'text/plain; charset=UTF-8' },
        'Save': 'Save',
        'Cancel': 'Cancel',
        'Delete': 'Delete'
      };

      mockFileStorage.listFiles.mockResolvedValue([
        'test.json'
      ]);

      mockFileStorage.readTextFile.mockResolvedValue(JSON.stringify(po2jsonData));

      const catalogs = await loader.loadTranslations();
      const catalog = catalogs.test;

      expect(catalog.messages).toEqual({
        'Save': 'Save',
        'Cancel': 'Cancel',
        'Delete': 'Delete'
      });
      expect(catalog.headers).toEqual({
        Language: 'en',
        'Content-Type': 'text/plain; charset=UTF-8'
      });
    });

    it('should skip non-string values', async () => {
      const po2jsonData = {
        '': { Language: 'en' },
        'Save': 'Save',
        'InvalidNumber': 123,
        'InvalidObject': { nested: 'value' },
        'ValidString': 'Valid'
      };

      mockFileStorage.listFiles.mockResolvedValue([
        'test.json'
      ]);

      mockFileStorage.readTextFile.mockResolvedValue(JSON.stringify(po2jsonData));

      const catalogs = await loader.loadTranslations();
      const messages = catalogs.test.messages;

      expect(messages).toEqual({
        'Save': 'Save',
        'ValidString': 'Valid'
      });
      expect(messages.InvalidNumber).toBeUndefined();
      expect(messages.InvalidObject).toBeUndefined();
    });
  });
});