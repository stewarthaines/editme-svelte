/**
 * Locale configuration data
 */

import type { LocaleConfig } from './types.js';

export const LOCALE_CONFIGS: Record<string, LocaleConfig> = {
  en: {
    code: 'en',
    name: 'English',
    direction: 'ltr',
    englishName: 'English',
  },
  de: {
    code: 'de',
    name: 'Deutsch',
    direction: 'ltr',
    englishName: 'German',
  },
  ka: {
    code: 'ka',
    name: 'ქართული',
    direction: 'ltr',
    englishName: 'Georgian',
  },
  ar: {
    code: 'ar',
    name: 'العربية',
    direction: 'rtl',
    englishName: 'Arabic',
  },
  he: {
    code: 'he',
    name: 'עברית',
    direction: 'rtl',
    englishName: 'Hebrew',
  },
  'zh-Hant': {
    code: 'zh-Hant',
    name: '繁體中文',
    direction: 'ltr',
    englishName: 'Traditional Chinese',
  },
  ja: {
    code: 'ja',
    name: '日本語',
    direction: 'ltr',
    englishName: 'Japanese',
  },
};

export const DEFAULT_LOCALE = 'en';

/**
 * Locales we actually ship to users. The others in LOCALE_CONFIGS are scaffolded
 * (display names, RTL flags, .po files) but NOT yet genuinely translated, so they
 * are kept out of the bundle, the language picker, and locale auto-detection — a
 * not-enabled locale must never surface as broken/placeholder UI. Re-enable a code
 * here once it has a real, reviewed translation bundled.
 *
 * Build-side mirror: build-scripts/enabled-locales.js — keep the two in sync.
 */
export const ENABLED_LOCALES = ['en', 'de'];

export const RTL_LOCALES = ['ar', 'he'];

/**
 * Whether a locale is shipped/enabled (vs merely known/scaffolded).
 */
export function isLocaleEnabled(locale: string): boolean {
  return ENABLED_LOCALES.includes(locale);
}

/**
 * Get locale configuration
 */
export function getLocaleConfig(locale: string): LocaleConfig | undefined {
  return LOCALE_CONFIGS[locale];
}

/**
 * Check if locale uses RTL text direction
 */
export function isRTL(locale: string): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * Get browser's preferred locale from available options
 */
export function getBrowserLocale(): string {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LOCALE;
  }

  // Get browser language preferences
  const languages = navigator.languages || [navigator.language];

  for (const lang of languages) {
    // Try exact match first
    if (LOCALE_CONFIGS[lang]) {
      return lang;
    }

    // Try language code only (e.g., 'en' from 'en-US')
    const langCode = lang.split('-')[0];
    if (LOCALE_CONFIGS[langCode]) {
      return langCode;
    }

    // Try region-specific variants (e.g., 'zh-Hant' from 'zh-TW')
    if (langCode === 'zh') {
      // Traditional Chinese for HK, TW, MO
      if (['zh-TW', 'zh-HK', 'zh-MO'].includes(lang)) {
        return 'zh-Hant';
      }
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * The browser's preferred locale for the *UI*, restricted to enabled locales.
 *
 * Distinct from getBrowserLocale(): that one maps the browser language to any known
 * locale (used to seed a new book's dc:language, which should reflect the user's real
 * language). This one only returns a locale we actually ship, so a Japanese/Arabic/…
 * browser falls back to English UI instead of a not-yet-translated catalog.
 */
export function getEnabledBrowserLocale(): string {
  const preferred = getBrowserLocale();
  return isLocaleEnabled(preferred) ? preferred : DEFAULT_LOCALE;
}
