import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

/**
 * Advanced mode — a single app-level preference (set once, applies across every
 * project), persisted to localStorage. Mirrors the theme/locale stores: the UI
 * binds to it reactively and `set()` writes through to storage.
 *
 * It unlocks power-user surfaces app-wide: extra metadata fields, the manifest's
 * individual SOURCE files, the Plugins / Available Extensions / EPUB / Extensions /
 * Generators settings, JavaScript files in the editor, and the catalog URL import.
 */

const STORAGE_KEY = 'editme_advanced_mode';

function read(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function persist(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Persistence is best-effort.
  }
}

interface AdvancedModeStore extends Writable<boolean> {
  toggle(): void;
}

function createAdvancedModeStore(): AdvancedModeStore {
  const { subscribe, set, update } = writable<boolean>(read());

  return {
    subscribe,
    set(value: boolean) {
      persist(value);
      set(value);
    },
    update,
    toggle() {
      update(v => {
        persist(!v);
        return !v;
      });
    },
  };
}

export const advancedMode = createAdvancedModeStore();
