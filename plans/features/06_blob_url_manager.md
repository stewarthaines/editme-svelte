# 06. Blob URL Manager

## Overview
Converts manifest items from storage into blob URLs for preview iframe usage, with proper resource cleanup and support for multiple content types.

## Requirements
- Convert manifest items to blob URLs for preview
- Handle different content types (text, image, audio, video)
- Resource cleanup and memory management
- URL substitution for preview iframe

## Dependencies
- **#1 File Storage API** - for reading manifest item content

## Technical Approach
- Create blob objects from stored file content
- Generate blob URLs with proper MIME types
- Track created URLs for cleanup
- Substitute resource references in XHTML content

## API Design
```typescript
interface BlobURLManager {
  // Blob creation
  createBlobURL(workspaceId: string, filePath: string, mimeType: string): Promise<string>
  createBlobFromContent(content: ArrayBuffer | string, mimeType: string): string
  
  // URL management
  revokeBlobURL(url: string): void
  revokeAllURLs(): void
  
  // Content processing
  substituteResourceURLs(xhtmlContent: string, workspaceId: string): Promise<string>
  
  // Utilities
  getMimeType(filePath: string): string
  isResourcePath(href: string): boolean
}

interface BlobURLRegistry {
  urls: Map<string, string>  // filePath -> blobURL
  created: Map<string, Date> // track creation time
  cleanup(): void
}
```

## MIME Type Detection
```typescript
const MIME_TYPES = {
  // Text
  '.html': 'text/html',
  '.xhtml': 'application/xhtml+xml',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.txt': 'text/plain',
  '.json': 'application/json',
  
  // Images
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  
  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  
  // Video
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg'
}
```

## Resource URL Substitution
- Parse XHTML content for resource references
- Find `<link>`, `<img>`, `<audio>`, `<video>`, `<script>` elements
- Replace relative URLs with blob URLs
- Preserve absolute URLs and data URLs
- Handle CSS @import statements

## Blob Creation Process
1. Read file content from storage
2. Determine MIME type from file extension
3. Create Blob object with proper type
4. Generate blob URL
5. Register URL for cleanup
6. Return blob URL

## Resource Reference Patterns
```typescript
// HTML/XHTML references to substitute
const RESOURCE_PATTERNS = [
  /<link[^>]+href=["']([^"']+)["']/g,
  /<img[^>]+src=["']([^"']+)["']/g,
  /<audio[^>]+src=["']([^"']+)["']/g,
  /<video[^>]+src=["']([^"']+)["']/g,
  /<script[^>]+src=["']([^"']+)["']/g,
  /@import\s+url\(["']?([^"']+)["']?\)/g
]
```

## Memory Management
- Track all created blob URLs
- Implement cleanup on workspace switch
- Set cleanup timeouts for unused URLs
- Monitor memory usage
- Revoke URLs when no longer needed

## Caching Strategy
- Cache blob URLs for frequently accessed resources
- Invalidate cache when files are modified
- LRU eviction for memory management
- Consider file modification timestamps

## Error Handling
- File not found in storage
- Invalid MIME type detection
- Blob creation failures
- URL substitution errors
- Memory limits exceeded

## Performance Considerations
- Lazy blob creation on demand
- Batch URL substitution operations
- Avoid creating duplicate blobs
- Efficient pattern matching for substitution

## Testing Considerations
- Test blob creation for all supported file types
- Test URL substitution accuracy
- Test memory cleanup functionality
- Test with large files and many resources
- Verify MIME type detection
- Test error handling scenarios

## Implementation Notes
- Start with basic blob creation
- Add URL substitution incrementally
- Implement proper cleanup from the beginning
- Consider using Web Workers for large file processing
- Test memory usage patterns thoroughly