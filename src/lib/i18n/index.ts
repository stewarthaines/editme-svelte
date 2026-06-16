/**
 * Main i18n runtime system
 */

import { writable, derived, get } from 'svelte/store';
import type { I18nState, TranslationFunction, TranslationCatalog } from './types.js';
import {
  LOCALE_CONFIGS,
  DEFAULT_LOCALE,
  getEnabledBrowserLocale,
  isLocaleEnabled,
  isRTL,
} from './locale-config.js';
import { createI18nLoader } from './loader.js';

// Internal state store
const i18nState = writable<I18nState>({
  currentLocale: DEFAULT_LOCALE,
  locales: LOCALE_CONFIGS,
  catalogs: {},
  initialized: false,
  loading: false,
});

// Public stores
export const currentLocale = derived(i18nState, $state => $state.currentLocale);
export const isLoading = derived(i18nState, $state => $state.loading);
export const isInitialized = derived(i18nState, $state => $state.initialized);
export const documentDirection = derived(currentLocale, $locale =>
  isRTL($locale) ? 'rtl' : 'ltr'
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
function applyDocumentLocale(locale: string): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  const dir = isRTL(locale) ? 'rtl' : 'ltr';
  el.lang = locale;
  el.dir = dir;
  el.setAttribute('data-dir', dir);
  el.setAttribute('data-locale', locale);
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

    // Always extract translations from ZIP bundle
    await loader.extractTranslations();

    // Load translation catalogs
    const catalogs = await loader.loadTranslations();

    // Ensure English fallback is available
    if (!catalogs.en) {
      catalogs.en = englishFallback;
    }

    // Determine initial locale. getEnabledBrowserLocale() only returns a shipped
    // locale, so a Japanese/Arabic/… browser stays on English rather than loading a
    // placeholder; the catalog check is a second guard (those catalogs aren't bundled).
    const preferredLocale = getEnabledBrowserLocale();
    const initialLocale = catalogs[preferredLocale] ? preferredLocale : DEFAULT_LOCALE;

    // Reflect the resolved locale on <html> (real lang/dir + data-* hooks).
    applyDocumentLocale(initialLocale);

    i18nState.update(s => ({
      ...s,
      currentLocale: initialLocale,
      catalogs,
      initialized: true,
      loading: false,
    }));
  } catch (error) {
    console.error('Failed to initialize i18n:', error);

    // Fallback to English only
    applyDocumentLocale(DEFAULT_LOCALE);
    i18nState.update(s => ({
      ...s,
      currentLocale: DEFAULT_LOCALE,
      catalogs: { en: englishFallback },
      initialized: true,
      loading: false,
    }));
  }
}

/**
 * Switch to a different locale
 */
export async function setLocale(locale: string): Promise<void> {
  const state = get(i18nState);

  if (!state.initialized) {
    throw new Error('i18n system not initialized');
  }

  if (!LOCALE_CONFIGS[locale]) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  // Known but not shipped (no genuine translation yet): refuse to switch so a stale
  // preference or a programmatic call can't surface placeholder/English-stub UI.
  if (!isLocaleEnabled(locale)) {
    console.warn(`Locale ${locale} is not enabled; ignoring switch.`);
    return;
  }

  if (!state.catalogs[locale]) {
    console.warn(`Translation catalog for ${locale} not loaded, falling back to English`);
  }

  // Reflect the new locale on <html> (real lang/dir + data-* hooks).
  applyDocumentLocale(locale);

  // Store preference
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('editme-locale', locale);
  }

  i18nState.update(s => ({ ...s, currentLocale: locale }));
}

/**
 * Get available locales
 */
export function getAvailableLocales() {
  const state = get(i18nState);
  // Only shipped locales — scaffolded-but-untranslated ones stay out of the picker.
  return Object.keys(state.locales)
    .filter(code => isLocaleEnabled(code))
    .map(code => state.locales[code]);
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
  i18nState.set({
    currentLocale: DEFAULT_LOCALE,
    locales: LOCALE_CONFIGS,
    catalogs: {},
    initialized: false,
    loading: false,
  });
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
