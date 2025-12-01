/**
 * A multi-tiered, unified key/value store for EPUB environments.
 * It provides a consistent synchronous API for getItem and setItem,
 * and automatically falls back to the best available storage mechanism.
 * * Storage Priority:
 * 1. localStorage (for persistence)
 * 2. sessionStorage (for session-level storage)
 * 3. In-memory object (for no persistence, a final fallback)
 */
(function () {
  'use strict';

  let storageBackend;

  /**
   * Defines the interface for the global Store object.
   * @type {{getItem: function(string): any, setItem: function(string, any): void}}
   */
  const Store = {
    getItem: null,
    setItem: null,
  };

  /**
   * In-memory storage implementation.
   * A final fallback with no persistence.
   */
  class InMemoryStorage {
    constructor() {
      this.data = new Map();
      console.log('Using in-memory storage. No data will be persisted.');
    }

    getItem(key) {
      return this.data.get(key);
    }

    setItem(key, value) {
      this.data.set(key, value);
    }
  }

  // --- Storage Detection and Initialization ---

  // Attempt to use localStorage
  try {
    const testKey = '__test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    console.log('Using localStorage for persistent storage.');

    Store.getItem = key => window.localStorage.getItem(key);
    Store.setItem = (key, value) => window.localStorage.setItem(key, value);
  } catch (e) {
    // localStorage is not available, try sessionStorage
    try {
      const testKey = '__test__';
      window.sessionStorage.setItem(testKey, testKey);
      window.sessionStorage.removeItem(testKey);
      console.log('Using sessionStorage for session-level storage.');

      Store.getItem = key => window.sessionStorage.getItem(key);
      Store.setItem = (key, value) => window.sessionStorage.setItem(key, value);
    } catch (e) {
      // sessionStorage not available, use in-memory
      storageBackend = new InMemoryStorage();
      Store.getItem = storageBackend.getItem.bind(storageBackend);
      Store.setItem = storageBackend.setItem.bind(storageBackend);
    }
  }

  // Expose the global Store object
  window.Store = Store;
})();
