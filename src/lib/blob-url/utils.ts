/**
 * Blob URL Manager Utilities
 *
 * Helper functions for URL classification, path resolution, and XHTML processing
 */

/**
 * Resolve manifest item href to full workspace path
 */
export function resolveManifestPath(href: string, basePath: string): string {
  // Handle OPF in container root (empty basePath)
  if (!basePath) return href;

  // Standard case: basePath + href
  // Examples: "OEBPS" + "images/cover.jpg" → "OEBPS/images/cover.jpg"
  return `${basePath}/${href}`;
}
