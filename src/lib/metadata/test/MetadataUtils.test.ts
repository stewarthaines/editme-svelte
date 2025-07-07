import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MetadataUtils } from '../MetadataUtils.js';

// Mock crypto.randomUUID
const mockRandomUUID = vi.fn();
vi.stubGlobal('crypto', {
  randomUUID: mockRandomUUID,
});

// Mock Date for consistent testing
const mockDate = new Date('2024-01-15T10:30:00Z');
vi.setSystemTime(mockDate);

describe('MetadataUtils', () => {
  beforeEach(() => {
    mockRandomUUID.mockReturnValue('123e4567-e89b-12d3-a456-426614174000');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateIdentifier', () => {
    it('should delegate to crypto.randomUUID', () => {
      MetadataUtils.generateIdentifier();

      expect(mockRandomUUID).toHaveBeenCalled();
    });

    it('should return URN UUID format', () => {
      const identifier = MetadataUtils.generateIdentifier();

      expect(identifier).toBe('urn:uuid:123e4567-e89b-12d3-a456-426614174000');
    });

    it('should generate unique identifiers on multiple calls', () => {
      mockRandomUUID
        .mockReturnValueOnce('123e4567-e89b-12d3-a456-426614174000')
        .mockReturnValueOnce('987f6543-e21c-34d5-b678-524613285001');

      const id1 = MetadataUtils.generateIdentifier();
      const id2 = MetadataUtils.generateIdentifier();

      expect(id1).toBe('urn:uuid:123e4567-e89b-12d3-a456-426614174000');
      expect(id2).toBe('urn:uuid:987f6543-e21c-34d5-b678-524613285001');
      expect(id1).not.toBe(id2);
    });

    it('should return consistent format with mocked UUID', () => {
      const identifier = MetadataUtils.generateIdentifier();

      expect(identifier).toMatch(
        /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });

  describe('getCurrentDate', () => {
    it('should return current date in YYYY-MM-DD format', () => {
      const date = MetadataUtils.getCurrentDate();

      expect(date).toBe('2024-01-15');
    });

    it('should use system time', () => {
      const date = MetadataUtils.getCurrentDate();

      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return consistent format with mocked date', () => {
      const date = MetadataUtils.getCurrentDate();

      expect(date).toBe('2024-01-15');
    });

    it('should handle different system times', () => {
      vi.setSystemTime(new Date('2023-12-25T00:00:00Z'));

      const date = MetadataUtils.getCurrentDate();

      expect(date).toBe('2023-12-25');
    });
  });

  describe('getLanguageOptions', () => {
    it('should return same result as MetadataManager instance method', () => {
      const options = MetadataUtils.getLanguageOptions();

      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBeGreaterThan(0);
    });

    it('should return array of language options', () => {
      const options = MetadataUtils.getLanguageOptions();

      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBeGreaterThan(0);

      options.forEach(option => {
        expect(option).toHaveProperty('code');
        expect(option).toHaveProperty('name');
        expect(typeof option.code).toBe('string');
        expect(typeof option.name).toBe('string');
      });
    });

    it('should include expected languages (en, es, fr, de, it, pt, ja, zh, ar, he, ka, zh-TW)', () => {
      const options = MetadataUtils.getLanguageOptions();
      const codes = options.map(opt => opt.code);

      expect(codes).toContain('en');
      expect(codes).toContain('es');
      expect(codes).toContain('fr');
      expect(codes).toContain('de');
      expect(codes).toContain('it');
      expect(codes).toContain('pt');
      expect(codes).toContain('ja');
      expect(codes).toContain('zh');
      expect(codes).toContain('ar');
      expect(codes).toContain('he');
      expect(codes).toContain('ka');
      expect(codes).toContain('zh-TW');
    });

    it('should return objects with code and name properties', () => {
      const options = MetadataUtils.getLanguageOptions();

      options.forEach(option => {
        expect(option).toHaveProperty('code');
        expect(option).toHaveProperty('name');
        expect(typeof option.code).toBe('string');
        expect(typeof option.name).toBe('string');
        expect(option.code.length).toBeGreaterThan(0);
        expect(option.name.length).toBeGreaterThan(0);
      });
    });

    it('should be pure function (same output for same input)', () => {
      const options1 = MetadataUtils.getLanguageOptions();
      const options2 = MetadataUtils.getLanguageOptions();

      expect(options1).toEqual(options2);
    });

    it('should return consistent language data', () => {
      const options = MetadataUtils.getLanguageOptions();

      const englishOption = options.find(opt => opt.code === 'en');
      expect(englishOption).toBeDefined();
      expect(englishOption?.name).toBe('English');

      const spanishOption = options.find(opt => opt.code === 'es');
      expect(spanishOption).toBeDefined();
      expect(spanishOption?.name).toBe('Spanish');
    });
  });

  describe('getAccessibilityOptions', () => {
    it('should return same result as MetadataManager instance method', () => {
      const options = MetadataUtils.getAccessibilityOptions();

      expect(typeof options).toBe('object');
      expect(options).not.toBeNull();
    });

    it('should return accessibility options object', () => {
      const options = MetadataUtils.getAccessibilityOptions();

      expect(typeof options).toBe('object');
      expect(options).not.toBeNull();
    });

    it('should include access modes (textual, visual, auditory, tactile)', () => {
      const options = MetadataUtils.getAccessibilityOptions();

      expect(options).toHaveProperty('accessModes');
      expect(Array.isArray(options.accessModes)).toBe(true);
      expect(options.accessModes).toContain('textual');
      expect(options.accessModes).toContain('visual');
      expect(options.accessModes).toContain('auditory');
      expect(options.accessModes).toContain('tactile');
    });

    it('should include accessibility features', () => {
      const options = MetadataUtils.getAccessibilityOptions();

      expect(options).toHaveProperty('accessibilityFeatures');
      expect(Array.isArray(options.accessibilityFeatures)).toBe(true);
      expect(options.accessibilityFeatures.length).toBeGreaterThan(0);
    });

    it('should include accessibility hazards', () => {
      const options = MetadataUtils.getAccessibilityOptions();

      expect(options).toHaveProperty('accessibilityHazards');
      expect(Array.isArray(options.accessibilityHazards)).toBe(true);
      expect(options.accessibilityHazards.length).toBeGreaterThan(0);
    });

    it('should return consistent structure', () => {
      const options1 = MetadataUtils.getAccessibilityOptions();
      const options2 = MetadataUtils.getAccessibilityOptions();

      expect(options1).toEqual(options2);
    });

    it('should include common accessibility features', () => {
      const options = MetadataUtils.getAccessibilityOptions();

      expect(options.accessibilityFeatures).toContain('alternativeText');
      expect(options.accessibilityFeatures).toContain('longDescription');
      expect(options.accessibilityFeatures).toContain('structuralNavigation');
    });

    it('should include common accessibility hazards', () => {
      const options = MetadataUtils.getAccessibilityOptions();

      expect(options.accessibilityHazards).toContain('flashing');
      expect(options.accessibilityHazards).toContain('motionSimulation');
      expect(options.accessibilityHazards).toContain('sound');
    });
  });

  describe('utility function integration', () => {
    it('should work together for complete metadata creation', () => {
      const identifier = MetadataUtils.generateIdentifier();
      const date = MetadataUtils.getCurrentDate();
      const languageOptions = MetadataUtils.getLanguageOptions();
      const accessibilityOptions = MetadataUtils.getAccessibilityOptions();

      expect(identifier).toMatch(/^urn:uuid:[0-9a-f-]{36}$/);
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Array.isArray(languageOptions)).toBe(true);
      expect(typeof accessibilityOptions).toBe('object');

      const englishOption = languageOptions.find(opt => opt.code === 'en');
      expect(englishOption).toBeDefined();
    });

    it('should provide consistent results across multiple calls', () => {
      const date1 = MetadataUtils.getCurrentDate();
      const date2 = MetadataUtils.getCurrentDate();
      const languages1 = MetadataUtils.getLanguageOptions();
      const languages2 = MetadataUtils.getLanguageOptions();
      const accessibility1 = MetadataUtils.getAccessibilityOptions();
      const accessibility2 = MetadataUtils.getAccessibilityOptions();

      expect(date1).toBe(date2);
      expect(languages1).toEqual(languages2);
      expect(accessibility1).toEqual(accessibility2);
    });

    it('should handle edge cases gracefully', () => {
      expect(() => MetadataUtils.generateIdentifier()).not.toThrow();
      expect(() => MetadataUtils.getCurrentDate()).not.toThrow();
      expect(() => MetadataUtils.getLanguageOptions()).not.toThrow();
      expect(() => MetadataUtils.getAccessibilityOptions()).not.toThrow();
    });
  });

  describe('performance characteristics', () => {
    it('should efficiently generate multiple identifiers', () => {
      const identifiers = [];
      for (let i = 0; i < 10; i++) {
        mockRandomUUID.mockReturnValueOnce(`${i}23e4567-e89b-12d3-a456-426614174000`);
        identifiers.push(MetadataUtils.generateIdentifier());
      }

      expect(identifiers).toHaveLength(10);
      expect(new Set(identifiers).size).toBe(10); // All unique
    });

    it('should cache static data for performance', () => {
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        MetadataUtils.getLanguageOptions();
      }
      const languageTime = performance.now() - start;

      const start2 = performance.now();
      for (let i = 0; i < 100; i++) {
        MetadataUtils.getAccessibilityOptions();
      }
      const accessibilityTime = performance.now() - start2;

      expect(languageTime).toBeLessThan(50); // Should be very fast
      expect(accessibilityTime).toBeLessThan(50); // Should be very fast
    });
  });

  describe('data validation', () => {
    it('should return valid language codes', () => {
      const options = MetadataUtils.getLanguageOptions();

      options.forEach(option => {
        expect(option.code).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
        expect(option.name).toMatch(/^[A-Z][a-z]+( [A-Z][a-z]+)*$/);
      });
    });

    it('should return valid accessibility data structure', () => {
      const options = MetadataUtils.getAccessibilityOptions();

      expect(options.accessModes).toHaveLength(4);
      expect(options.accessibilityFeatures.length).toBeGreaterThan(5);
      expect(options.accessibilityHazards.length).toBeGreaterThan(3);

      options.accessModes.forEach(mode => {
        expect(typeof mode).toBe('string');
        expect(mode.length).toBeGreaterThan(0);
      });

      options.accessibilityFeatures.forEach(feature => {
        expect(typeof feature).toBe('string');
        expect(feature.length).toBeGreaterThan(0);
      });

      options.accessibilityHazards.forEach(hazard => {
        expect(typeof hazard).toBe('string');
        expect(hazard.length).toBeGreaterThan(0);
      });
    });

    it('should generate RFC-compliant UUIDs', () => {
      const uuid = MetadataUtils.generateIdentifier();
      const uuidPart = uuid.replace('urn:uuid:', '');

      expect(uuidPart).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should generate ISO 8601 compliant dates', () => {
      const date = MetadataUtils.getCurrentDate();

      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(date).toISOString().split('T')[0]).toBe(date);
    });
  });

  describe('error handling', () => {
    it('should handle crypto.randomUUID failure gracefully', () => {
      mockRandomUUID.mockImplementationOnce(() => {
        throw new Error('Crypto API not available');
      });

      expect(() => MetadataUtils.generateIdentifier()).toThrow('Crypto API not available');
    });

    it('should handle date formatting edge cases', () => {
      vi.setSystemTime(new Date('2024-02-29T23:59:59Z')); // Leap year

      const date = MetadataUtils.getCurrentDate();
      expect(date).toBe('2024-02-29');
    });
  });

  describe('internationalization support', () => {
    it('should include RTL languages', () => {
      const options = MetadataUtils.getLanguageOptions();
      const codes = options.map(opt => opt.code);

      expect(codes).toContain('ar'); // Arabic
      expect(codes).toContain('he'); // Hebrew
    });

    it('should include languages with regional variants', () => {
      const options = MetadataUtils.getLanguageOptions();
      const codes = options.map(opt => opt.code);

      expect(codes).toContain('zh-TW'); // Traditional Chinese
    });

    it('should provide proper language names', () => {
      const options = MetadataUtils.getLanguageOptions();

      const arabicOption = options.find(opt => opt.code === 'ar');
      const hebrewOption = options.find(opt => opt.code === 'he');
      const georgianOption = options.find(opt => opt.code === 'ka');

      expect(arabicOption?.name).toBe('Arabic');
      expect(hebrewOption?.name).toBe('Hebrew');
      expect(georgianOption?.name).toBe('Georgian');
    });
  });
});
