/**
 * Locales that are actually shipped to users — the only catalogs compiled into
 * src/lib/i18n/locales/ and bundled into static/i18n-bundle.zip.
 *
 * The other locales in locales/*.po are scaffolded but not genuinely translated, so
 * they are deliberately excluded from the bundle (a not-shipped catalog can never be
 * loaded at runtime, so a placeholder can never surface).
 *
 * Runtime mirror: ENABLED_LOCALES in src/lib/i18n/locale-config.ts — keep in sync.
 */
export const ENABLED_LOCALES = ['en', 'de'];
