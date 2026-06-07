/**
 * Saved OPDS feeds — an auto-maintained history of catalog URLs the user has
 * fetched, persisted in localStorage. Each entry is keyed by URL and labelled
 * with the feed's <title> (captured on fetch), most-recently-used first.
 */

export interface SavedFeed {
  url: string;
  /** The feed's atom:title, when known; used as the display label. */
  title?: string;
}

const STORAGE_KEY = 'editme_opds_feeds';

/** Load the saved feeds (most-recent first). Returns [] on any error. */
export function loadSavedFeeds(): SavedFeed[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((f): f is SavedFeed => !!f && typeof f.url === 'string')
      .map(f => ({ url: f.url, title: typeof f.title === 'string' ? f.title : undefined }));
  } catch {
    return [];
  }
}

/**
 * Insert or update a feed, moving it to the front (most-recent). A provided
 * title replaces the stored one; otherwise the existing title is kept.
 */
export function upsertSavedFeed(url: string, title?: string): SavedFeed[] {
  const trimmed = url.trim();
  if (!trimmed) return loadSavedFeeds();

  const current = loadSavedFeeds();
  const existing = current.find(f => f.url === trimmed);
  const rest = current.filter(f => f.url !== trimmed);
  const entry: SavedFeed = { url: trimmed, title: title ?? existing?.title };
  return persist([entry, ...rest]);
}

/** Remove the feed with the given URL. */
export function removeSavedFeed(url: string): SavedFeed[] {
  return persist(loadSavedFeeds().filter(f => f.url !== url));
}

function persist(feeds: SavedFeed[]): SavedFeed[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feeds));
  } catch {
    // Persistence is best-effort.
  }
  return feeds;
}
