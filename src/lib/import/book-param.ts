/**
 * The `?book=<url>` deep link — the editor's half of the READ.html hand-off
 * (process/BOOK_PARAM_IMPORT.md). The reader builds `SEED.html?book=<book-url>`
 * from a book's own source URL; this parses it back out at boot.
 *
 * Pure so the scheme guarantee is testable: the param is attacker-suppliable,
 * so only absolute http(s) URLs are accepted — anything else is ignored with
 * a console warning rather than surfaced as an error.
 */
export function parseBookParam(search: string): string | null {
  const raw = new URLSearchParams(search).get('book');
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      console.warn(`Ignoring ?book= URL with unsupported scheme: ${url.protocol}`);
      return null;
    }
    return raw;
  } catch {
    console.warn('Ignoring malformed ?book= URL:', raw);
    return null;
  }
}
