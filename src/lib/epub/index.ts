/**
 * EPUB Library Exports
 */

// Main classes
export { EPUBUnpacker } from './EPUBUnpacker.js';
export { EPUBPackager } from './EPUBPackager.js';

// Type definitions
export type {
	UnpackResult,
	ValidationResult,
	ExtractionResult
} from './EPUBUnpacker.js';

export type {
	EPUBMetadata,
	WorkspaceFile,
	CompressionSettings,
	PackageProgress,
	PackageOptions,
	PackageResult
} from './EPUBPackager.js';
