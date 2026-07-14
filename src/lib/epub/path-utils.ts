/**
 * EPUB Path Utilities
 *
 * Handles path conversions between manifest-relative paths (used in OPF files)
 * and XHTML-file-relative paths (used in content files for asset references).
 */

/**
 * Convert manifest-relative path to XHTML-file-relative path
 *
 * In EPUB structure:
 * - Manifest paths are relative to the OPF file location (e.g., "Styles/page.css")
 * - XHTML paths are relative to the XHTML file location (e.g., "../Styles/page.css")
 *
 * @param manifestHref - Path from manifest relative to OPF file
 * @param xhtmlDir - Directory of XHTML file relative to OPF (default: "Text")
 * @returns XHTML-relative path suitable for use in href/src attributes
 *
 * @example
 * // For XHTML files in OEBPS/Text/ directory:
 * convertManifestPathToXHTMLPath("Styles/page.css") → "../Styles/page.css"
 * convertManifestPathToXHTMLPath("Scripts/reader.js") → "../Scripts/reader.js"
 * convertManifestPathToXHTMLPath("Images/cover.jpg") → "../Images/cover.jpg"
 */
export function convertManifestPathToXHTMLPath(
  manifestHref: string,
  xhtmlDir: string = 'Text'
): string {
  // Already has relative path prefix - return as is
  if (manifestHref.startsWith('../') || manifestHref.startsWith('./')) {
    return manifestHref;
  }

  // Absolute URLs or special protocols - return as is
  if (
    manifestHref.startsWith('http') ||
    manifestHref.startsWith('data:') ||
    manifestHref.startsWith('blob:') ||
    manifestHref.startsWith('/')
  ) {
    return manifestHref;
  }

  // For files in subdirectories (like Text/), need to go up to parent
  if (xhtmlDir && xhtmlDir !== '') {
    return `../${manifestHref}`;
  }

  // Files at same level as OPF - no change needed
  return manifestHref;
}

/**
 * Convert XHTML-relative path back to manifest-relative path
 *
 * Reverse operation of convertManifestPathToXHTMLPath for cases where
 * manifest paths need to be extracted from XHTML references.
 *
 * @param xhtmlHref - XHTML-relative path from href/src attribute
 * @param xhtmlDir - Directory of XHTML file relative to OPF (default: "Text")
 * @returns Manifest-relative path suitable for manifest href attributes
 *
 * @example
 * convertXHTMLPathToManifestPath("../Styles/page.css") → "Styles/page.css"
 */
export function convertXHTMLPathToManifestPath(
  xhtmlHref: string,
  xhtmlDir: string = 'Text'
): string {
  // Already manifest-relative or special protocol - return as is
  if (
    !xhtmlHref.startsWith('../') ||
    xhtmlHref.startsWith('http') ||
    xhtmlHref.startsWith('data:') ||
    xhtmlHref.startsWith('blob:')
  ) {
    return xhtmlHref;
  }

  // For files in subdirectories, remove the ../ prefix
  if (xhtmlDir && xhtmlDir !== '' && xhtmlHref.startsWith('../')) {
    return xhtmlHref.substring(3); // Remove "../"
  }

  return xhtmlHref;
}
