/**
 * Blob URL Manager - Main Exports
 *
 * Public API for the Blob URL Manager feature, providing blob URL creation
 * and XHTML processing for EPUB preview iframes.
 */

// Main classes
export { BlobURLManager } from './blob-url-manager.js';

// Type definitions
export type {
  BlobURLManagerConfig,
  BlobURLRegistry,
  AssetSelector,
  XHTMLProcessingResult,
  AssetProcessingError,
  ExtendedFileStorageAPI,
} from './types.js';
