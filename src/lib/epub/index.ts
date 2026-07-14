/**
 * EPUB Library Exports
 */

// Type definitions
export type { UnpackResult, ValidationResult, ExtractionResult } from './EPUBUnpacker.js';

export type {
  EPUBMetadata,
  WorkspaceFile,
  CompressionSettings,
  PackageProgress,
  PackageOptions,
  PackageResult,
} from './EPUBPackager.js';

export type {
  OPFDocument,
  ManifestItem,
  SpineItem,
  GuideItem,
  ContainerInfo,
  XMLValidationResult,
  MetadataFieldTypes,
  ArrayMetadataFields,
  StringMetadataFields,
  RequiredMetadataFields,
  OptionalMetadataFields,
} from './opf-utils.js';
