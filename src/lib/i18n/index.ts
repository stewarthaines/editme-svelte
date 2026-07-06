/**
 * Main i18n runtime system
 */

import { writable, derived, get } from 'svelte/store';
import type {
  I18nState,
  TranslationFunction,
  TranslationCatalog,
  AvailableLocale,
  LocalesManifestEntry,
} from './types.js';
import { LOCALE_CONFIGS, DEFAULT_LOCALE, getEnabledBrowserLocale, isRTL } from './locale-config.js';
import { createI18nLoader } from './loader.js';
import {
  isHttpSourceAvailable,
  fetchLocalesManifest,
  fetchCatalogFile,
} from './http-catalog-source.js';

/** localStorage key for the persisted locale preference (load-bearing — do not rename) */
const LOCALE_STORAGE_KEY = 'editme-locale';

/**
 * Manifest entries from the last http fetch this session, keyed by locale code.
 * setLocale needs them to resolve a 'remote' locale to its catalog file.
 */
let remoteEntries: Record<string, LocalesManifestEntry> = {};

/** In-flight background availability refresh (exposed to tests via _awaitRemoteRefresh) */
let remoteRefreshPromise: Promise<void> | null = null;

// Internal state store
const i18nState = writable<I18nState>({
  currentLocale: DEFAULT_LOCALE,
  locales: LOCALE_CONFIGS,
  catalogs: {},
  availableLocales: {},
  initialized: false,
  loading: false,
});

// Public stores
export const currentLocale = derived(i18nState, $state => $state.currentLocale);
export const isLoading = derived(i18nState, $state => $state.loading);
export const isInitialized = derived(i18nState, $state => $state.initialized);
export const documentDirection = derived(i18nState, $state =>
  localeDirection($state, $state.currentLocale)
);
/** Locales the picker can offer — the union of what all catalog sources can supply */
export const availableLocales = derived(i18nState, $state =>
  Object.values($state.availableLocales)
);

// English fallback catalog (bundled for immediate availability)
const englishFallback: TranslationCatalog = {
  locale: 'en',
  messages: {
    Save: 'Save',
    Cancel: 'Cancel',
    Delete: 'Delete',
    Edit: 'Edit',
    File: 'File',
    Settings: 'Settings',
    Workspace: 'Workspace',
    Metadata: 'Metadata',
    Manifest: 'Manifest',
    Navigation: 'Navigation',
    'Spine Items': 'Spine Items',
  },
  headers: {},
};

/**
 * Non-reactive translation function (for non-component usage)
 */
export const translate: TranslationFunction = (key: string, params: Record<string, any> = {}) => {
  const state = get(i18nState);

  // Get translation from current locale catalog
  const catalog = state.catalogs[state.currentLocale];
  let translation = catalog?.messages[key];

  // Fallback to English if not found
  if (!translation && state.currentLocale !== 'en') {
    translation = state.catalogs.en?.messages[key] || englishFallback.messages[key];
  }

  // Ultimate fallback to key itself
  if (!translation) {
    translation = key;
  }

  // Simple parameter interpolation
  if (Object.keys(params).length > 0) {
    for (const [param, value] of Object.entries(params)) {
      translation = translation.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
    }
  }

  return translation;
};

/**
 * Reactive translation store for Svelte components
 * Usage: {$t('key')} or {$t('key', { param: value })}
 */
export const t = derived(
  i18nState,
  ($state): TranslationFunction =>
    (key: string, params: Record<string, any> = {}) => {
      // Get translation from current locale catalog
      const catalog = $state.catalogs[$state.currentLocale];
      let translation = catalog?.messages[key];

      // Fallback to English if not found
      if (!translation && $state.currentLocale !== 'en') {
        translation = $state.catalogs.en?.messages[key] || englishFallback.messages[key];
      }

      // Ultimate fallback to key itself
      if (!translation) {
        translation = key;
      }

      // Simple parameter interpolation
      if (Object.keys(params).length > 0) {
        for (const [param, value] of Object.entries(params)) {
          translation = translation.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
        }
      }

      return translation;
    }
);

/**
 * Reflect the active UI locale on the <html> element: the real `lang`/`dir`
 * attributes (read by screen readers, hyphenation, `:lang()`, translation tools)
 * plus the `data-*` hooks the stylesheets key off.
 */
/**
 * Text direction for a locale: the availability entry (which can carry manifest
 * metadata for locales the runtime doesn't know natively) wins, then the static
 * config, then the RTL list.
 */
function localeDirection(state: I18nState, locale: string): 'ltr' | 'rtl' {
  return (
    state.availableLocales[locale]?.direction ??
    LOCALE_CONFIGS[locale]?.direction ??
    (isRTL(locale) ? 'rtl' : 'ltr')
  );
}

function applyDocumentLocale(locale: string): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  const dir = localeDirection(get(i18nState), locale);
  el.lang = locale;
  el.dir = dir;
  el.setAttribute('data-dir', dir);
  el.setAttribute('data-locale', locale);
}

/**
 * Compute the availability union: English is always available (msgids are the
 * English content), plus every locale a source supplied a catalog for. A catalog
 * whose code has no LOCALE_CONFIGS entry is skipped — we don't invent display
 * metadata for unknown codes.
 */
function computeAvailableLocales(
  catalogs: Record<string, TranslationCatalog>
): Record<string, AvailableLocale> {
  const available: Record<string, AvailableLocale> = {
    [DEFAULT_LOCALE]: { ...LOCALE_CONFIGS[DEFAULT_LOCALE], availability: 'loaded' },
  };

  for (const locale of Object.keys(catalogs)) {
    const config = LOCALE_CONFIGS[locale];
    if (config && !available[locale]) {
      available[locale] = { ...config, availability: 'loaded' };
    }
  }

  return available;
}

/**
 * Read the persisted locale preference, or null when absent/unreadable
 */
function getPersistedLocale(): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(LOCALE_STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

/**
 * Initialize the i18n system
 */
export async function initI18n(): Promise<void> {
  const state = get(i18nState);

  if (state.initialized || state.loading) {
    return;
  }

  i18nState.update(s => ({ ...s, loading: true }));

  try {
    const loader = createI18nLoader();

    // Extract embedded catalogs (if this build carries any) into the workspace,
    // then load everything the workspace holds — whatever source put it there.
    await loader.extractEmbeddedBundle();
    const catalogs = await loader.loadTranslations();

    // Ensure English fallback is available
    if (!catalogs.en) {
      catalogs.en = englishFallback;
    }

    const available = computeAvailableLocales(catalogs);

    // Initial locale: the persisted preference wins when a source can supply it,
    // then the browser preference (already restricted to shipped locales), then
    // English. Availability is the gate — never start on a locale we can't render.
    const persisted = getPersistedLocale();
    const preferred = persisted && available[persisted] ? persisted : getEnabledBrowserLocale();
    const initialLocale = available[preferred] ? preferred : DEFAULT_LOCALE;

    // Reflect the resolved locale on <html> (real lang/dir + data-* hooks).
    applyDocumentLocale(initialLocale);

    i18nState.update(s => ({
      ...s,
      currentLocale: initialLocale,
      catalogs,
      availableLocales: available,
      initialized: true,
      loading: false,
    }));

    // Hosted only: discover fetchable locales in the background. First paint never
    // blocks on the network — remote availability lands as a later store update.
    if (isHttpSourceAvailable()) {
      remoteRefreshPromise = refreshRemoteAvailability().catch(error => {
        console.warn('Failed to refresh remote locale availability:', error);
      });
    }
  } catch (error) {
    console.error('Failed to initialize i18n:', error);

    // Fallback to English only
    applyDocumentLocale(DEFAULT_LOCALE);
    i18nState.update(s => ({
      ...s,
      currentLocale: DEFAULT_LOCALE,
      catalogs: { en: englishFallback },
      availableLocales: computeAvailableLocales({}),
      initialized: true,
      loading: false,
    }));
  }
}

/**
 * Fetch the locales manifest, merge remote availability into the store, drop
 * stale cached catalogs (hash mismatch against the previously stored manifest),
 * and re-resolve the persisted locale preference now that remote locales are
 * known. Runs in the background after init on http deployments.
 */
async function refreshRemoteAvailability(): Promise<void> {
  const manifest = await fetchLocalesManifest();
  if (!manifest) {
    // No sidecar / offline: behave like file:// — local sources only.
    return;
  }

  const loader = createI18nLoader();
  const cachedManifest = await loader.getCachedManifest();
  const cachedHashes = new Map(
    (cachedManifest?.locales ?? []).map(entry => [entry.code, entry.hash])
  );

  const entries = manifest.locales.filter(entry => entry.code !== DEFAULT_LOCALE);
  remoteEntries = Object.fromEntries(entries.map(entry => [entry.code, entry]));

  // A cached catalog whose hash no longer matches the fresh manifest is stale:
  // remove it so no later startup can read it, and downgrade to 'remote' so the
  // next use refetches.
  const stale = entries.filter(
    entry => entry.hash !== undefined && cachedHashes.get(entry.code) !== entry.hash
  );
  for (const entry of stale) {
    await loader.removeCatalog(entry.code);
  }
  const staleCodes = new Set(stale.map(entry => entry.code));

  i18nState.update(s => {
    const available = { ...s.availableLocales };
    for (const entry of entries) {
      const existing = available[entry.code];
      if (existing && !staleCodes.has(entry.code)) {
        continue; // already satisfiable locally and still fresh
      }
      // Display metadata: static config wins; the manifest is the metadata
      // channel for locales the runtime doesn't know natively.
      const meta = LOCALE_CONFIGS[entry.code] ?? {
        code: entry.code,
        name: entry.name,
        englishName: entry.englishName,
        direction: entry.direction === 'rtl' ? 'rtl' : 'ltr',
      };
      available[entry.code] = { ...meta, availability: 'remote' };
    }
    return { ...s, availableLocales: available };
  });

  // Re-resolve the persisted preference: it may have been locally unsatisfiable
  // at init (very first hosted load) and only now fetchable.
  const persisted = getPersistedLocale();
  const state = get(i18nState);
  if (persisted && persisted !== state.currentLocale && state.availableLocales[persisted]) {
    await setLocale(persisted);
  } else if (state.availableLocales[state.currentLocale]?.availability === 'remote') {
    // The active locale's catalog went stale — refetch it in place.
    await setLocale(state.currentLocale);
  }

  // Persist the manifest last: a failed refetch above leaves the old manifest in
  // place, so the staleness is redetected on the next startup.
  await loader.saveManifest(manifest);
}

/**
 * Switch to a different locale
 */
export async function setLocale(locale: string): Promise<void> {
  const state = get(i18nState);

  if (!state.initialized) {
    throw new Error('i18n system not initialized');
  }

  // Unknown = neither statically configured nor supplied by any source (a
  // manifest entry can introduce a locale the runtime doesn't know natively).
  if (!LOCALE_CONFIGS[locale] && !state.availableLocales[locale]) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  // No source can supply this locale's catalog (scaffolded-only, or not delivered
  // to this deployment): refuse to switch so a stale preference or a programmatic
  // call can't surface placeholder/English-stub UI.
  const availability = state.availableLocales[locale]?.availability;
  if (!availability) {
    console.warn(`Locale ${locale} is not available; ignoring switch.`);
    return;
  }

  // Catalog only fetchable over http: download, cache, then switch.
  if (availability === 'remote') {
    const entry = remoteEntries[locale];
    if (!entry) {
      console.warn(`No manifest entry for locale ${locale}; ignoring switch.`);
      return;
    }

    i18nState.update(s => ({ ...s, loading: true }));
    try {
      const jsonText = await fetchCatalogFile(entry);
      if (jsonText === null) {
        console.warn(`Failed to fetch catalog for ${locale}; staying on current locale.`);
        return;
      }
      const loader = createI18nLoader();
      await loader.cacheCatalog(locale, jsonText);
      const catalog = await loader.loadCatalog(locale);
      if (!catalog) {
        console.warn(`Fetched catalog for ${locale} is unreadable; staying on current locale.`);
        return;
      }
      i18nState.update(s => ({
        ...s,
        catalogs: { ...s.catalogs, [locale]: catalog },
        availableLocales: {
          ...s.availableLocales,
          [locale]: { ...s.availableLocales[locale], availability: 'loaded' },
        },
      }));
    } finally {
      i18nState.update(s => ({ ...s, loading: false }));
    }
  }

  // Catalog cached in storage but not in memory yet: load it before switching.
  if (availability === 'cached' && !state.catalogs[locale]) {
    const catalog = await createI18nLoader().loadCatalog(locale);
    if (!catalog) {
      console.warn(`Translation catalog for ${locale} could not be loaded; ignoring switch.`);
      return;
    }
    i18nState.update(s => ({
      ...s,
      catalogs: { ...s.catalogs, [locale]: catalog },
      availableLocales: {
        ...s.availableLocales,
        [locale]: { ...s.availableLocales[locale], availability: 'loaded' },
      },
    }));
  }

  // Reflect the new locale on <html> (real lang/dir + data-* hooks).
  applyDocumentLocale(locale);

  // Store preference — only after a successful switch
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
  } catch {
    // Persistence is best-effort; the in-session switch still applies.
  }

  i18nState.update(s => ({ ...s, currentLocale: locale }));
}

/**
 * Get available locales — the union of what all catalog sources can supply
 */
export function getAvailableLocales() {
  const state = get(i18nState);
  return Object.values(state.availableLocales);
}

/**
 * Get current locale configuration
 */
export function getCurrentLocaleConfig() {
  const state = get(i18nState);
  return state.locales[state.currentLocale];
}

/**
 * Reset i18n system for testing (internal use only)
 * @internal
 */
export function _resetI18nForTesting() {
  remoteEntries = {};
  remoteRefreshPromise = null;
  i18nState.set({
    currentLocale: DEFAULT_LOCALE,
    locales: LOCALE_CONFIGS,
    catalogs: {},
    availableLocales: {},
    initialized: false,
    loading: false,
  });
}

/**
 * Await the background remote-availability refresh initI18n kicked off, if any
 * (internal use only — lets tests assert the post-refresh state deterministically)
 * @internal
 */
export async function _awaitRemoteRefreshForTesting(): Promise<void> {
  await remoteRefreshPromise;
}

// Export i18nState for Storybook and testing
export { i18nState };

/**
 * Unified i18n service for non-component usage
 * Provides all i18n functionality through a single service object
 */
export const i18nService = {
  translate,
  getCurrentLocale: () => get(currentLocale),
  setLocale,
  getAvailableLocales,
  hasTranslation: (locale: string, key: string) => {
    const state = get(i18nState);
    return !!state.catalogs[locale]?.messages[key];
  },
  isLocaleSupported: (locale: string) => !!LOCALE_CONFIGS[locale],
  isRTL,
  getCatalogs: () => {
    const state = get(i18nState);
    return state.catalogs;
  },
  isInitialized: () => {
    const state = get(i18nState);
    return state.initialized;
  },
  init: initI18n,
};
