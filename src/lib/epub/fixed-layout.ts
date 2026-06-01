/**
 * Fixed-layout (pre-paginated) defaults.
 *
 * EPUB does not mandate a viewport size — fixed-layout dimensions are meant to
 * match the intrinsic size of each page's content. These values are only a
 * neutral, modern 3:4 portrait starting point: shown as a placeholder in the
 * metadata editor and used as the preview fallback when a publication declares
 * no rendition:viewport of its own.
 */
export const DEFAULT_FXL_VIEWPORT_WIDTH = 1200;
export const DEFAULT_FXL_VIEWPORT_HEIGHT = 1600;

/** Canonical rendition:viewport string for the defaults above. */
export const DEFAULT_FXL_VIEWPORT = `width=${DEFAULT_FXL_VIEWPORT_WIDTH}, height=${DEFAULT_FXL_VIEWPORT_HEIGHT}`;
