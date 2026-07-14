/**
 * File Storage API Types
 *
 * TypeScript interfaces and types for the EPUB editor's file storage system
 * supporting OPFS with IndexedDB fallback for cross-browser compatibility.
 */

export type BackendType = 'opfs-async' | 'opfs-sync' | 'indexeddb';

export interface FileMetadata {
  name: string;
  size: number;
  lastModified: number;
  type: string;
}

export interface StorageQuota {
  used: number;
  available: number;
}

export interface WorkspaceMetadata {
  id: string;
  created: number;
  title?: string;
  author?: string;
}

/**
 * Unified storage backend interface that abstracts away the specific
 * implementation details of OPFS vs IndexedDB storage.
 */
export interface StorageBackend {
  // Initialization
  init?(): Promise<void>;

  // Workspace management
  createWorkspace(id: string): Promise<void>;
  deleteWorkspace(id: string): Promise<void>;
  listWorkspaces(): Promise<string[]>;

  // File operations
  writeFile(workspaceId: string, path: string, content: ArrayBuffer): Promise<void>;
  readFile(workspaceId: string, path: string): Promise<ArrayBuffer>;
  deleteFile(workspaceId: string, path: string): Promise<void>;
  listFiles(workspaceId: string, path?: string): Promise<string[]>;
  getFileInfo(workspaceId: string, path: string): Promise<{ size: number; lastModified: Date }>;

  // Storage info
  getQuota(): Promise<StorageQuota>;
  getBackendType(): BackendType;
}

/**
 * Result of a worker operation. `error` is a plain message string — that is
 * what opfs-worker.js actually sends (`error.message`), pinned by
 * opfs-worker.protocol.test.ts.
 */
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Message types for worker communication in OPFS sync backend
 */
export interface WorkerMessage {
  type: WorkerMessageType;
  id: number;
  data?: unknown;
}

export interface WorkerResponse {
  type: WorkerMessageType;
  id: number;
  result: OperationResult<unknown>;
}

export enum WorkerMessageType {
  CREATE_WORKSPACE = 'createWorkspace',
  DELETE_WORKSPACE = 'deleteWorkspace',
  LIST_WORKSPACES = 'listWorkspaces',
  WRITE_FILE = 'writeFile',
  READ_FILE = 'readFile',
  DELETE_FILE = 'deleteFile',
  LIST_FILES = 'listFiles',
  GET_FILE_INFO = 'getFileInfo',
  GET_QUOTA = 'getQuota',
}

/**
 * IndexedDB database schema
 */
export interface WorkspaceRecord {
  id: string;
  created: number;
  title?: string;
  author?: string;
}

export interface FileRecord {
  workspaceId: string;
  path: string;
  content: ArrayBuffer;
  modified: number;
  size: number;
  type?: string;
}

/**
 * OPFS file handle types (for browser compatibility)
 */
export interface OPFSFileHandle {
  kind: 'file';
  name: string;
  createWritable(): Promise<FileSystemWritableFileStream>;
  createSyncAccessHandle?(): Promise<FileSystemSyncAccessHandle>;
  getFile(): Promise<File>;
}

export interface OPFSDirectoryHandle {
  kind: 'directory';
  name: string;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<OPFSFileHandle>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<OPFSDirectoryHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  entries(): AsyncIterableIterator<[string, OPFSFileHandle | OPFSDirectoryHandle]>;
}

export interface FileSystemWritableFileStream extends WritableStream {
  write(data: ArrayBuffer | string): Promise<void>;
  close(): Promise<void>;
}

export interface FileSystemSyncAccessHandle {
  read(buffer: ArrayBuffer, options?: { at?: number }): number;
  write(data: ArrayBuffer, options?: { at?: number }): number;
  flush(): void;
  close(): void;
  getSize(): number;
  truncate(size: number): void;
}

/**
 * Storage capability detection results
 */
export interface StorageCapabilities {
  opfs: boolean;
  opfsAsync: boolean;
  opfsSync: boolean;
  opfsSyncWorker: boolean;
  indexedDB: boolean;
  storageEstimate: boolean;
}

/**
 * Browser feature detection utilities
 */
export interface FeatureDetector {
  detectCapabilities(): Promise<StorageCapabilities>;
  detectOptimalBackend(): Promise<BackendType>;
  testOPFSAvailable(): Promise<boolean>;
  testOPFSAsync(): Promise<boolean>;
  testOPFSSync(): Promise<boolean>;
  testOPFSSyncWorker(): Promise<boolean>;
  testIndexedDB(): Promise<boolean>;
  testStorageEstimate(): Promise<boolean>;
}

/**
 * Directory traversal and creation utilities
 */
export interface DirectoryUtils {
  ensureDirectoryPath(handle: OPFSDirectoryHandle, path: string): Promise<OPFSDirectoryHandle>;
  getFileFromPath(handle: OPFSDirectoryHandle, path: string): Promise<OPFSFileHandle>;
  listDirectoryContents(handle: OPFSDirectoryHandle, basePath?: string): Promise<string[]>;
}
