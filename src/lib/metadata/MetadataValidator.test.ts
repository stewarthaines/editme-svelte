import { describe, it, expect } from 'vitest';
import { MetadataValidator } from './MetadataValidator.js';

describe('MetadataValidator', () => {
  describe('validateRequired', () => {
    it('should return null for valid non-empty string', () => {
      const result = MetadataValidator.validateRequired('Valid Title', 'title');
      
      expect(result).toBeNull();
    });

    it('should return error for null value', () => {
      const result = MetadataValidator.validateRequired(null, 'title');
      
      expect(result).toEqual({
        type: 'error',
        field: 'title',
        message: 'Title is required'
      });
    });

    it('should return error for undefined value', () => {
      const result = MetadataValidator.validateRequired(undefined, 'title');
      
      expect(result).toEqual({
        type: 'error',
        field: 'title',
        message: 'Title is required'
      });
    });

    it('should return error for empty string', () => {
      const result = MetadataValidator.validateRequired('', 'title');
      
      expect(result).toEqual({
        type: 'error',
        field: 'title',
        message: 'Title is required'
      });
    });

    it('should return error for whitespace-only string', () => {
      const result = MetadataValidator.validateRequired('   ', 'title');
      
      expect(result).toEqual({
        type: 'error',
        field: 'title',
        message: 'Title is required'
      });
    });

    it('should include field name in error message', () => {
      const result = MetadataValidator.validateRequired('', 'identifier');
      
      expect(result?.message).toContain('Identifier');
    });
  });

  describe('validateLanguageCode', () => {
    it('should return null for empty string (optional field)', () => {
      const result = MetadataValidator.validateLanguageCode('');
      
      expect(result).toBeNull();
    });

    it('should return null for valid 2-letter codes (en, fr, de)', () => {
      expect(MetadataValidator.validateLanguageCode('en')).toBeNull();
      expect(MetadataValidator.validateLanguageCode('fr')).toBeNull();
      expect(MetadataValidator.validateLanguageCode('de')).toBeNull();
    });

    it('should return null for valid codes with region (en-US, zh-CN)', () => {
      expect(MetadataValidator.validateLanguageCode('en-US')).toBeNull();
      expect(MetadataValidator.validateLanguageCode('zh-CN')).toBeNull();
    });

    it('should return null for valid codes with script (zh-Hans-CN)', () => {
      expect(MetadataValidator.validateLanguageCode('zh-Hans-CN')).toBeNull();
    });

    it('should return error for invalid format', () => {
      const result = MetadataValidator.validateLanguageCode('invalid-format-code');
      
      expect(result).toEqual({
        type: 'error',
        field: 'language',
        message: 'Language code must be a valid BCP 47 language tag'
      });
    });

    it('should return error for numeric codes', () => {
      const result = MetadataValidator.validateLanguageCode('123');
      
      expect(result).toEqual({
        type: 'error',
        field: 'language',
        message: 'Language code must be a valid BCP 47 language tag'
      });
    });

    it('should return error for mixed case', () => {
      const result = MetadataValidator.validateLanguageCode('EN-us');
      
      expect(result).toEqual({
        type: 'error',
        field: 'language',
        message: 'Language code must be a valid BCP 47 language tag'
      });
    });
  });

  describe('validateIdentifier', () => {
    it('should return null for empty string (handled by required validation)', () => {
      const result = MetadataValidator.validateIdentifier('');
      
      expect(result).toBeNull();
    });

    it('should return null for URN UUID format', () => {
      const result = MetadataValidator.validateIdentifier('urn:uuid:123e4567-e89b-12d3-a456-426614174000');
      
      expect(result).toBeNull();
    });

    it('should return null for URN ISBN format', () => {
      const result = MetadataValidator.validateIdentifier('urn:isbn:978-0-123456-78-9');
      
      expect(result).toBeNull();
    });

    it('should return null for HTTP/HTTPS URLs', () => {
      expect(MetadataValidator.validateIdentifier('http://example.com/book')).toBeNull();
      expect(MetadataValidator.validateIdentifier('https://example.com/book')).toBeNull();
    });

    it('should return null for simple alphanumeric identifiers', () => {
      const result = MetadataValidator.validateIdentifier('book123');
      
      expect(result).toBeNull();
    });

    it('should return warning (not error) for questionable formats', () => {
      const result = MetadataValidator.validateIdentifier('questionable-format!@#');
      
      expect(result).toEqual({
        type: 'warning',
        field: 'identifier',
        message: 'Identifier format may not be widely recognized'
      });
    });

    it('should allow custom identifier formats', () => {
      const result = MetadataValidator.validateIdentifier('custom:format:123');
      
      expect(result).toBeNull();
    });
  });

  describe('validateDate', () => {
    it('should return null for empty string (optional field)', () => {
      const result = MetadataValidator.validateDate('');
      
      expect(result).toBeNull();
    });

    it('should return null for valid YYYY format', () => {
      const result = MetadataValidator.validateDate('2024');
      
      expect(result).toBeNull();
    });

    it('should return null for valid YYYY-MM format', () => {
      const result = MetadataValidator.validateDate('2024-01');
      
      expect(result).toBeNull();
    });

    it('should return null for valid YYYY-MM-DD format', () => {
      const result = MetadataValidator.validateDate('2024-01-15');
      
      expect(result).toBeNull();
    });

    it('should return null for valid ISO 8601 with time', () => {
      const result = MetadataValidator.validateDate('2024-01-15T10:30:00Z');
      
      expect(result).toBeNull();
    });

    it('should return error for invalid date formats', () => {
      const result = MetadataValidator.validateDate('invalid-date');
      
      expect(result).toEqual({
        type: 'error',
        field: 'date',
        message: 'Date must be in YYYY, YYYY-MM, or YYYY-MM-DD format'
      });
    });

    it('should return error for invalid dates (Feb 30th)', () => {
      const result = MetadataValidator.validateDate('2024-02-30');
      
      expect(result).toEqual({
        type: 'error',
        field: 'date',
        message: 'Date must be in YYYY, YYYY-MM, or YYYY-MM-DD format'
      });
    });

    it('should return error for non-parseable strings', () => {
      const result = MetadataValidator.validateDate('not-a-date');
      
      expect(result).toEqual({
        type: 'error',
        field: 'date',
        message: 'Date must be in YYYY, YYYY-MM, or YYYY-MM-DD format'
      });
    });
  });

  describe('validateArrayField', () => {
    it('should return empty array for valid array', () => {
      const result = MetadataValidator.validateArrayField(['Item 1', 'Item 2'], 'creator');
      
      expect(result).toEqual([]);
    });

    it('should return warning for arrays exceeding maxItems', () => {
      const longArray = Array.from({ length: 11 }, (_, i) => `Item ${i + 1}`);
      const result = MetadataValidator.validateArrayField(longArray, 'creator', 10);
      
      expect(result).toEqual([{
        type: 'warning',
        field: 'creator',
        message: 'Too many items in creator (11), consider reducing to 10 or fewer'
      }]);
    });

    it('should return error for empty array items', () => {
      const result = MetadataValidator.validateArrayField(['Valid Item', '', 'Another Valid Item'], 'creator');
      
      expect(result).toEqual([{
        type: 'error',
        field: 'creator[1]',
        message: 'Creator item cannot be empty'
      }]);
    });

    it('should return error for whitespace-only items', () => {
      const result = MetadataValidator.validateArrayField(['Valid Item', '   ', 'Another Valid Item'], 'creator');
      
      expect(result).toEqual([{
        type: 'error',
        field: 'creator[1]',
        message: 'Creator item cannot be empty'
      }]);
    });

    it('should include array index in error field names', () => {
      const result = MetadataValidator.validateArrayField(['Valid', '', 'Also Valid', '  '], 'subject');
      
      expect(result).toEqual([
        {
          type: 'error',
          field: 'subject[1]',
          message: 'Subject item cannot be empty'
        },
        {
          type: 'error',
          field: 'subject[3]',
          message: 'Subject item cannot be empty'
        }
      ]);
    });

    it('should handle custom maxItems parameter', () => {
      const result = MetadataValidator.validateArrayField(['Item 1', 'Item 2', 'Item 3'], 'creator', 2);
      
      expect(result).toEqual([{
        type: 'warning',
        field: 'creator',
        message: 'Too many items in creator (3), consider reducing to 2 or fewer'
      }]);
    });

    it('should handle empty arrays', () => {
      const result = MetadataValidator.validateArrayField([], 'creator');
      
      expect(result).toEqual([]);
    });
  });

  describe('integration tests', () => {
    it('should validate complete metadata object', () => {
      const metadata = {
        title: 'Test Book',
        language: 'en',
        identifier: 'urn:uuid:123e4567-e89b-12d3-a456-426614174000',
        creator: ['John Doe', 'Jane Smith'],
        subject: ['Fiction', 'Adventure'],
        contributor: ['Editor Name'],
        publisher: 'Test Publisher',
        date: '2023-12-31',
        description: 'A test book for unit testing',
      };

      const titleResult = MetadataValidator.validateRequired(metadata.title, 'title');
      const languageResult = MetadataValidator.validateLanguageCode(metadata.language);
      const identifierResult = MetadataValidator.validateIdentifier(metadata.identifier);
      const creatorResult = MetadataValidator.validateArrayField(metadata.creator, 'creator');
      const subjectResult = MetadataValidator.validateArrayField(metadata.subject, 'subject');
      const contributorResult = MetadataValidator.validateArrayField(metadata.contributor, 'contributor');
      const dateResult = MetadataValidator.validateDate(metadata.date);

      expect(titleResult).toBeNull();
      expect(languageResult).toBeNull();
      expect(identifierResult).toBeNull();
      expect(creatorResult).toEqual([]);
      expect(subjectResult).toEqual([]);
      expect(contributorResult).toEqual([]);
      expect(dateResult).toBeNull();
    });

    it('should validate metadata with errors', () => {
      const metadata = {
        title: '', // Required field empty
        language: 'invalid-code', // Invalid language code
        identifier: '', // Required field empty
        creator: ['', 'Valid Creator'], // Empty creator
        date: 'invalid-date', // Invalid date format
      };

      const titleResult = MetadataValidator.validateRequired(metadata.title, 'title');
      const languageResult = MetadataValidator.validateLanguageCode(metadata.language);
      const identifierResult = MetadataValidator.validateRequired(metadata.identifier, 'identifier');
      const creatorResult = MetadataValidator.validateArrayField(metadata.creator, 'creator');
      const dateResult = MetadataValidator.validateDate(metadata.date);

      expect(titleResult).toEqual({
        type: 'error',
        field: 'title',
        message: 'Title is required'
      });
      expect(languageResult).toEqual({
        type: 'error',
        field: 'language',
        message: 'Language code must be a valid BCP 47 language tag'
      });
      expect(identifierResult).toEqual({
        type: 'error',
        field: 'identifier',
        message: 'Identifier is required'
      });
      expect(creatorResult).toEqual([{
        type: 'error',
        field: 'creator[0]',
        message: 'Creator item cannot be empty'
      }]);
      expect(dateResult).toEqual({
        type: 'error',
        field: 'date',
        message: 'Date must be in YYYY, YYYY-MM, or YYYY-MM-DD format'
      });
    });

    it('should handle partial metadata validation', () => {
      const partialMetadata = {
        title: 'Partial Book',
        language: 'en'
      };

      const titleResult = MetadataValidator.validateRequired(partialMetadata.title, 'title');
      const languageResult = MetadataValidator.validateLanguageCode(partialMetadata.language);

      expect(titleResult).toBeNull();
      expect(languageResult).toBeNull();
    });

    it('should handle edge cases in field validation', () => {
      // Test with null values
      expect(MetadataValidator.validateLanguageCode(null as any)).toBeNull();
      expect(MetadataValidator.validateIdentifier(null as any)).toBeNull();
      expect(MetadataValidator.validateDate(null as any)).toBeNull();
      
      // Test with undefined values
      expect(MetadataValidator.validateLanguageCode(undefined as any)).toBeNull();
      expect(MetadataValidator.validateIdentifier(undefined as any)).toBeNull();
      expect(MetadataValidator.validateDate(undefined as any)).toBeNull();
    });

    it('should handle complex language codes', () => {
      const complexCodes = [
        'en-US',
        'zh-Hans-CN',
        'zh-Hant-HK',
        'pt-BR',
        'es-419',
        'sr-Latn-RS'
      ];

      complexCodes.forEach(code => {
        const result = MetadataValidator.validateLanguageCode(code);
        expect(result).toBeNull();
      });
    });

    it('should handle various identifier formats', () => {
      const identifiers = [
        'urn:uuid:123e4567-e89b-12d3-a456-426614174000',
        'urn:isbn:978-0-123456-78-9',
        'http://example.com/book/123',
        'https://doi.org/10.1000/182',
        'custom:format:123',
        'simple-id-123'
      ];

      identifiers.forEach(identifier => {
        const result = MetadataValidator.validateIdentifier(identifier);
        expect(result).toBeNull();
      });
    });

    it('should handle various date formats', () => {
      const dates = [
        '2024',
        '2024-01',
        '2024-01-15',
        '2024-01-15T10:30:00Z',
        '2024-01-15T10:30:00.123Z',
        '2024-01-15T10:30:00+05:30'
      ];

      dates.forEach(date => {
        const result = MetadataValidator.validateDate(date);
        expect(result).toBeNull();
      });
    });

    it('should handle array validation with mixed content', () => {
      const mixedArray = [
        'Valid Item 1',
        '',
        'Valid Item 2',
        '   ',
        'Valid Item 3'
      ];

      const result = MetadataValidator.validateArrayField(mixedArray, 'creator');
      
      expect(result).toEqual([
        {
          type: 'error',
          field: 'creator[1]',
          message: 'Creator item cannot be empty'
        },
        {
          type: 'error',
          field: 'creator[3]',
          message: 'Creator item cannot be empty'
        }
      ]);
    });
  });
});