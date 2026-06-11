import { writable } from 'svelte/store';

export const dirHandle = writable<FileSystemDirectoryHandle | null>(null);

/** The open project's dc:identifier, pushed by the host via the context message. */
export const activeIdentifier = writable<string | undefined>(undefined);
