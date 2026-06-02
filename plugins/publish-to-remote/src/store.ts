import { writable } from 'svelte/store';

export const dirHandle = writable<FileSystemDirectoryHandle | null>(null);
