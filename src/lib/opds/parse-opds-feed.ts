/**
 * OPDS feed parsing for "Import from Catalog".
 *
 * Parses an OPDS (Atom) acquisition feed into the list of downloadable EPUBs it
 * advertises. Mirrors the schema produced by the publish plugin's
 * generateOpdsFeed (entries carrying a
 * `<link rel="http://opds-spec.org/acquisition" type="application/epub+zip">`).
 */

/** A downloadable EPUB advertised by an OPDS feed entry. */
export interface OpdsBook {
  title: string;
  author?: string;
  /** dc:issued / atom:updated timestamp, if present. */
  updated?: string;
  /** Absolute acquisition URL (relative hrefs resolved against the feed URL). */
  href: string;
}

/** A parsed OPDS feed: its display title and the EPUBs it advertises. */
export interface OpdsFeed {
  /** The feed's atom:title, when present. */
  title?: string;
  books: OpdsBook[];
}

const EPUB_TYPE = 'application/epub+zip';

/**
 * Parse an OPDS feed document into its title and EPUB entries.
 *
 * @param xml      Raw feed XML.
 * @param feedUrl  URL the feed was fetched from; used to resolve relative hrefs.
 * @throws if the XML cannot be parsed as a document.
 */
export function parseOpdsFeed(xml: string, feedUrl: string): OpdsFeed {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');

  // A parse failure yields a document containing a <parsererror> element.
  if (doc.querySelector('parsererror')) {
    throw new Error('Could not parse the catalog feed (invalid XML).');
  }

  const books: OpdsBook[] = [];

  for (const entry of Array.from(doc.querySelectorAll('entry'))) {
    const href = acquisitionHref(entry, feedUrl);
    if (!href) continue; // navigation entries / non-EPUB acquisitions are skipped

    const title = text(entry.querySelector('title')) || 'Untitled';
    const author = text(entry.querySelector('author > name')) || undefined;
    const updated = text(entry.querySelector('updated')) || undefined;

    books.push({ title, author, updated, href });
  }

  return { title: feedTitle(doc), books };
}

/** The feed's own title: the first direct-child <title> of the root element. */
function feedTitle(doc: Document): string | undefined {
  for (const child of Array.from(doc.documentElement.children)) {
    if (child.localName === 'title') {
      return child.textContent?.trim() || undefined;
    }
  }
  return undefined;
}

/**
 * Find an entry's EPUB acquisition link and resolve it to an absolute URL.
 * Prefers a link whose rel mentions "acquisition"; falls back to any EPUB link.
 */
function acquisitionHref(entry: Element, feedUrl: string): string | null {
  const epubLinks = Array.from(entry.querySelectorAll(`link[type="${EPUB_TYPE}"]`));
  const link =
    epubLinks.find(l => (l.getAttribute('rel') ?? '').includes('acquisition')) ?? epubLinks[0];

  const href = link?.getAttribute('href');
  if (!href) return null;

  try {
    return new URL(href, feedUrl).href;
  } catch {
    return null;
  }
}

function text(el: Element | null): string {
  return el?.textContent?.trim() ?? '';
}
