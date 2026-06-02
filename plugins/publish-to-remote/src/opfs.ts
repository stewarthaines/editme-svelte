/**
 * OPFS utilities for finding and reading the EPUB file, and managing credentials
 */

import type { RemoteConfig, RemotesStore, S3Credentials } from './types.js';

const CREDENTIALS_FILENAME = 'credentials.json';
const REMOTES_FILENAME = 'remotes.json';

export async function findEpubFile(
  dirHandle: FileSystemDirectoryHandle,
): Promise<FileSystemFileHandle | null> {
  const entries: FileSystemHandle[] = [];

  for await (const entry of dirHandle.values()) {
    entries.push(entry);
  }

  // Look for .epub files
  const epubFiles = entries.filter(
    (entry): entry is FileSystemFileHandle =>
      entry.kind === 'file' && entry.name.endsWith('.epub'),
  );

  // Return the first .epub file found
  return epubFiles[0] ?? null;
}

export async function readEpubFile(
  fileHandle: FileSystemFileHandle,
): Promise<File> {
  return fileHandle.getFile();
}

export async function getEpubBlob(
  dirHandle: FileSystemDirectoryHandle,
): Promise<Blob | null> {
  const epubHandle = await findEpubFile(dirHandle);
  if (!epubHandle) return null;
  const file = await readEpubFile(epubHandle);
  return file;
}

/**
 * Credential persistence in OPFS root (shared across all projects)
 */

export async function readCredentials(): Promise<S3Credentials | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(CREDENTIALS_FILENAME);
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text) as S3Credentials;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'NotFoundError') {
      return null;
    }
    // Parse error or other failure
    return null;
  }
}

export async function writeCredentials(creds: S3Credentials): Promise<void> {
  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle(CREDENTIALS_FILENAME, {
    create: true,
  });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(creds, null, 2));
  await writable.close();
}

export async function deleteCredentials(): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(CREDENTIALS_FILENAME);
  } catch (err) {
    // Ignore NotFoundError - idempotent delete
    if (!(err instanceof DOMException && err.name === 'NotFoundError')) {
      throw err;
    }
  }
}

async function migrateCredentials(): Promise<RemoteConfig | null> {
  const creds = await readCredentials();
  if (!creds) return null;

  const remote: RemoteConfig = {
    id: crypto.randomUUID(),
    name: creds.bucket,
    type: 's3-compatible',
    endpoint: creds.endpoint,
    bucket: creds.bucket,
    accessKeyId: creds.accessKeyId,
    secretAccessKey: creds.secretAccessKey,
    region: creds.region,
    publicUrlBase: creds.publicUrlBase,
  };

  return remote;
}

export async function readRemotes(): Promise<RemotesStore> {
  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(REMOTES_FILENAME);
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text) as RemotesStore;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'NotFoundError') {
      // Try to migrate from legacy credentials.json
      const migrated = await migrateCredentials();
      if (migrated) {
        const store: RemotesStore = {
          remotes: [migrated],
          activeRemoteId: migrated.id,
        };
        await writeRemotes(store);
        return store;
      }
      return { remotes: [], activeRemoteId: null };
    }
    return { remotes: [], activeRemoteId: null };
  }
}

export async function writeRemotes(store: RemotesStore): Promise<void> {
  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle(REMOTES_FILENAME, {
    create: true,
  });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(store, null, 2));
  await writable.close();
}
