/**
 * MetadataValidator - Validation utilities for EPUB metadata
 * 
 * Provides static validation methods for different types of metadata fields
 * following EPUB and Dublin Core specifications.
 */

export interface ValidationResult {
  type: 'error' | 'warning';
  field: string;
  message: string;
}

export class MetadataValidator {
  /**
   * Validates required fields (title, language, identifier)
   */
  static validateRequired(value: string, fieldName: string): ValidationResult | null {
    if (value == null || value.trim() === '') {
      return {
        type: 'error',
        field: fieldName,
        message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`
      };
    }
    return null;
  }

  /**
   * Validates language code according to RFC 5646 (BCP 47)
   */
  static validateLanguageCode(code: string): ValidationResult | null {
    if (!code || code.trim() === '') {
      return null; // Optional field
    }

    // RFC 5646 language tag format validation
    // Simplified pattern that accepts common BCP 47 formats used in EPUB
    // Primary language (2-3 letters) followed by optional subtags
    const bcp47Pattern = /^[a-z]{2,3}(-[A-Za-z0-9]{1,8})*$/;
    
    if (!bcp47Pattern.test(code)) {
      return {
        type: 'error',
        field: 'language',
        message: 'Language code must be a valid BCP 47 language tag'
      };
    }

    return null;
  }

  /**
   * Validates identifier format
   * Accepts various formats but warns for non-standard ones
   */
  static validateIdentifier(identifier: string): ValidationResult | null {
    if (!identifier || identifier.trim() === '') {
      return null; // Required validation will catch this
    }

    // Accept various identifier formats
    const validFormats = [
      /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, // URN UUID
      /^urn:isbn:[0-9-]+$/i, // URN ISBN
      /^https?:\/\/.+/, // HTTP/HTTPS URLs
      /^[a-zA-Z0-9._:-]+$/ // Simple alphanumeric with common separators
    ];

    const isValid = validFormats.some(pattern => pattern.test(identifier));
    
    if (!isValid) {
      return {
        type: 'warning',
        field: 'identifier',
        message: 'Identifier format may not be widely recognized'
      };
    }

    return null;
  }

  /**
   * Validates date format (ISO 8601 compliant)
   */
  static validateDate(dateString: string): ValidationResult | null {
    if (!dateString || dateString.trim() === '') {
      return null; // Optional field
    }

    // Accept various ISO 8601 formats
    const isoFormats = [
      /^\d{4}$/, // YYYY
      /^\d{4}-\d{2}$/, // YYYY-MM
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?([+-]\d{2}:\d{2}|Z)?$/ // Full ISO 8601
    ];

    const matchesFormat = isoFormats.some(pattern => pattern.test(dateString));
    
    if (!matchesFormat) {
      return {
        type: 'error',
        field: 'date',
        message: 'Date must be in YYYY, YYYY-MM, or YYYY-MM-DD format'
      };
    }

    // For complete dates, validate that they're actually valid dates
    if (dateString.length >= 10) {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return {
          type: 'error',
          field: 'date',
          message: 'Date must be in YYYY, YYYY-MM, or YYYY-MM-DD format'
        };
      }
      
      // For basic YYYY-MM-DD format, check if it matches when converted back
      if (dateString.length === 10) {
        const reconstructed = date.toISOString().split('T')[0];
        if (reconstructed !== dateString) {
          return {
            type: 'error',
            field: 'date',
            message: 'Date must be in YYYY, YYYY-MM, or YYYY-MM-DD format'
          };
        }
      }
    }

    return null;
  }

  /**
   * Validates array fields (creator, subject, contributor, etc.)
   */
  static validateArrayField(
    values: string[], 
    fieldName: string, 
    maxItems: number = 10
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Check for too many items
    if (values.length > maxItems) {
      results.push({
        type: 'warning',
        field: fieldName,
        message: `Too many items in ${fieldName} (${values.length}), consider reducing to ${maxItems} or fewer`
      });
    }

    // Check each item for empty values
    values.forEach((value, index) => {
      if (!value || value.trim() === '') {
        results.push({
          type: 'error',
          field: `${fieldName}[${index}]`,
          message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} item cannot be empty`
        });
      }
    });

    return results;
  }
}