# MetadataManager Unit Test Plan

This test plan defines comprehensive unit tests for the MetadataManager system based on the public API specification in `./api_public.md`.

## Test Structure

### Test Files

- `MetadataManager.test.ts` - Main manager class tests
- `MetadataValidator.test.ts` - Validation logic tests
- `MetadataUtils.test.ts` - Utility functions tests

### Mock Setup

- `WorkspaceManager` - Use existing mock at @src/lib/test/mocks/workspace-manager.mock.ts
- `Crypto.randomUUID()` - Mock for predictable identifier generation
- `Date` - Mock for consistent date generation testing

## MetadataManager Tests

### Core Data Operations

#### loadMetadata()

```typescript
describe('loadMetadata', () => {
  it('should load metadata from workspace manager');
  it('should cache loaded metadata');
  it('should return cached metadata on subsequent calls');
  it('should throw WorkspaceNotFoundError for invalid workspace');
  it('should throw MetadataCorruptedError for corrupted metadata');
  it('should handle empty metadata gracefully');
});
```

#### updateField()

```typescript
describe('updateField', () => {
  it('should update string fields correctly');
  it('should update array fields correctly');
  it('should persist changes to workspace manager');
  it('should update cache after successful save');
  it('should throw errors on save failures');
  it('should handle StorageQuotaExceededError');
  it('should handle NetworkError');
});
```

#### validateMetadata()

```typescript
describe('validateMetadata', () => {
  it('should validate required fields (title, language, identifier)');
  it('should validate optional fields when present');
  it('should validate array fields');
  it('should return empty array for valid metadata');
  it('should return multiple validation errors');
  it('should distinguish between errors and warnings');
});
```

### Array Field Operations

#### Creator Operations

```typescript
describe('creator operations', () => {
  describe('addCreator', () => {
    it('should add creator with provided name');
    it('should add creator with empty string when no name provided');
    it('should persist changes via updateField');
    it('should handle errors from updateField');
  });

  describe('removeCreator', () => {
    it('should remove creator at valid index');
    it('should throw error for out-of-bounds index');
    it('should handle empty creator array');
    it('should persist changes via updateField');
  });

  describe('updateCreator', () => {
    it('should update creator at valid index');
    it('should throw error for out-of-bounds index');
    it('should handle empty creator array');
    it('should persist changes via updateField');
  });
});
```

#### Subject Operations

```typescript
describe('subject operations', () => {
  // Same test structure as creator operations
  describe('addSubject', () => {
    /* ... */
  });
  describe('removeSubject', () => {
    /* ... */
  });
  describe('updateSubject', () => {
    /* ... */
  });
});
```

#### Contributor Operations

```typescript
describe('contributor operations', () => {
  // Same test structure as creator operations
  describe('addContributor', () => {
    /* ... */
  });
  describe('removeContributor', () => {
    /* ... */
  });
  describe('updateContributor', () => {
    /* ... */
  });
});
```

### Utility Methods

#### generateIdentifier()

```typescript
describe('generateIdentifier', () => {
  it('should generate URN UUID format identifier');
  it('should generate unique identifiers on multiple calls');
  it('should use crypto.randomUUID internally');
  it('should return consistent format with mocked UUID');
});
```

#### getCurrentDate()

```typescript
describe('getCurrentDate', () => {
  it('should return current date in YYYY-MM-DD format');
  it('should use system time');
  it('should return consistent format with mocked date');
});
```

#### getLanguageOptions()

```typescript
describe('getLanguageOptions', () => {
  it('should return array of language options');
  it('should include expected languages (en, es, fr, de, it, pt, ja, zh, ar, he, ka, zh-TW)');
  it('should return objects with code and name properties');
  it('should be pure function (same output for same input)');
});
```

#### getAccessibilityOptions()

```typescript
describe('getAccessibilityOptions', () => {
  it('should return accessibility options object');
  it('should include access modes (textual, visual, auditory, tactile)');
  it('should include accessibility features');
  it('should include accessibility hazards');
  it('should return consistent structure');
});
```

#### clearCache()

```typescript
describe('clearCache', () => {
  it('should clear specific workspace cache when ID provided');
  it('should clear entire cache when no ID provided');
  it('should handle clearing non-existent workspace cache');
});
```

#### preloadMetadata()

```typescript
describe('preloadMetadata', () => {
  it('should load metadata into cache');
  it('should not duplicate cached metadata');
  it('should throw WorkspaceNotFoundError for invalid workspace');
  it('should handle MetadataCorruptedError');
});
```

## MetadataValidator Tests

### validateRequired()

```typescript
describe('validateRequired', () => {
  it('should return null for valid non-empty string');
  it('should return error for null value');
  it('should return error for undefined value');
  it('should return error for empty string');
  it('should return error for whitespace-only string');
  it('should include field name in error message');
});
```

### validateLanguageCode()

```typescript
describe('validateLanguageCode', () => {
  it('should return null for empty string (optional field)');
  it('should return null for valid 2-letter codes (en, fr, de)');
  it('should return null for valid codes with region (en-US, zh-CN)');
  it('should return null for valid codes with script (zh-Hans-CN)');
  it('should return error for invalid format');
  it('should return error for numeric codes');
  it('should return error for mixed case');
});
```

### validateIdentifier()

```typescript
describe('validateIdentifier', () => {
  it('should return null for empty string (handled by required validation)');
  it('should return null for URN UUID format');
  it('should return null for URN ISBN format');
  it('should return null for HTTP/HTTPS URLs');
  it('should return null for simple alphanumeric identifiers');
  it('should return warning (not error) for questionable formats');
  it('should allow custom identifier formats');
});
```

### validateDate()

```typescript
describe('validateDate', () => {
  it('should return null for empty string (optional field)');
  it('should return null for valid YYYY format');
  it('should return null for valid YYYY-MM format');
  it('should return null for valid YYYY-MM-DD format');
  it('should return null for valid ISO 8601 with time');
  it('should return error for invalid date formats');
  it('should return error for invalid dates (Feb 30th)');
  it('should return error for non-parseable strings');
});
```

### validateArrayField()

```typescript
describe('validateArrayField', () => {
  it('should return empty array for valid array');
  it('should return warning for arrays exceeding maxItems');
  it('should return error for empty array items');
  it('should return error for whitespace-only items');
  it('should include array index in error field names');
  it('should handle custom maxItems parameter');
  it('should handle empty arrays');
});
```

## MetadataUtils Tests

### Static Methods

```typescript
describe('MetadataUtils', () => {
  describe('generateIdentifier', () => {
    it('should delegate to crypto.randomUUID');
    it('should return URN UUID format');
  });

  describe('getCurrentDate', () => {
    it('should return current date in YYYY-MM-DD format');
    it('should use system time');
  });

  describe('getLanguageOptions', () => {
    it('should return same result as MetadataManager instance method');
  });

  describe('getAccessibilityOptions', () => {
    it('should return same result as MetadataManager instance method');
  });
});
```

## Error Handling Tests

### Error Propagation

```typescript
describe('error handling', () => {
  it('should propagate WorkspaceNotFoundError from workspace manager');
  it('should propagate MetadataCorruptedError from workspace manager');
  it('should propagate StorageQuotaExceededError from workspace manager');
  it('should propagate NetworkError from workspace manager');
  it('should throw ValidationError for critical validation failures');
});
```

### Edge Cases

```typescript
describe('edge cases', () => {
  it('should handle undefined metadata gracefully');
  it('should handle null workspace IDs');
  it('should handle empty workspace IDs');
  it('should handle invalid field names in updateField');
  it('should handle concurrent operations');
  it('should handle cache corruption scenarios');
});
```

## Integration Tests

### Workflow Tests

```typescript
describe('integration workflows', () => {
  it('should handle complete metadata creation workflow');
  it('should handle metadata loading and updating workflow');
  it('should handle array operations workflow');
  it('should handle validation and error correction workflow');
  it('should handle cache preloading workflow');
});
```

## Test Data

### Sample Metadata Objects

```typescript
const VALID_METADATA: EPUBMetadata = {
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

const INVALID_METADATA: EPUBMetadata = {
  title: '', // Required field empty
  language: 'invalid-code', // Invalid language code
  identifier: '', // Required field empty
  creator: ['', 'Valid Creator'], // Empty creator
  date: 'invalid-date', // Invalid date format
};
```

## Test Execution Strategy

### Test Organization

1. **Unit Tests**: Focus on individual methods and pure functions
2. **Integration Tests**: Test interaction between components
3. **Error Scenario Tests**: Comprehensive error handling coverage

### Coverage Goals

- **Line Coverage**: 100% of public API methods
- **Branch Coverage**: All conditional paths and error scenarios
- **Edge Case Coverage**: Boundary conditions and invalid inputs
- **Integration Coverage**: Cross-component interactions

### Test Environment

- **Test Runner**: Vitest with happy-dom
- **Mocking**: vi.mock() for external dependencies
- **Assertions**: expect() with custom matchers for metadata validation
- **Async Testing**: Proper async/await patterns for Promise-based APIs
