import { describe, it, expect, beforeEach } from 'vitest';
import { loadSavedFeeds, upsertSavedFeed, removeSavedFeed } from './saved-feeds.js';

const KEY = 'seedhtml_opds_feeds';

beforeEach(() => {
  localStorage.clear();
});

describe('saved-feeds', () => {
  it('returns an empty list when nothing is stored', () => {
    expect(loadSavedFeeds()).toEqual([]);
  });

  it('upserts a new feed to the front with its title', () => {
    upsertSavedFeed('https://a.example/catalog.xml', 'Catalog A');
    const feeds = upsertSavedFeed('https://b.example/catalog.xml', 'Catalog B');

    expect(feeds).toEqual([
      { url: 'https://b.example/catalog.xml', title: 'Catalog B' },
      { url: 'https://a.example/catalog.xml', title: 'Catalog A' },
    ]);
  });

  it('re-fetching an existing feed moves it to the front and keeps its title when none is given', () => {
    upsertSavedFeed('https://a.example/catalog.xml', 'Catalog A');
    upsertSavedFeed('https://b.example/catalog.xml', 'Catalog B');
    const feeds = upsertSavedFeed('https://a.example/catalog.xml');

    expect(feeds.map(f => f.url)).toEqual([
      'https://a.example/catalog.xml',
      'https://b.example/catalog.xml',
    ]);
    expect(feeds[0].title).toBe('Catalog A');
  });

  it('trims the URL and ignores an empty one', () => {
    upsertSavedFeed('  https://a.example/catalog.xml  ', 'Catalog A');
    expect(loadSavedFeeds()).toEqual([
      { url: 'https://a.example/catalog.xml', title: 'Catalog A' },
    ]);
    expect(upsertSavedFeed('   ')).toEqual([
      { url: 'https://a.example/catalog.xml', title: 'Catalog A' },
    ]);
  });

  it('removes a feed by URL', () => {
    upsertSavedFeed('https://a.example/catalog.xml', 'Catalog A');
    upsertSavedFeed('https://b.example/catalog.xml', 'Catalog B');
    const feeds = removeSavedFeed('https://a.example/catalog.xml');
    expect(feeds).toEqual([{ url: 'https://b.example/catalog.xml', title: 'Catalog B' }]);
  });

  it('ignores malformed stored data', () => {
    localStorage.setItem(KEY, 'not json');
    expect(loadSavedFeeds()).toEqual([]);
    localStorage.setItem(KEY, JSON.stringify([{ nope: 1 }, { url: 'https://ok.example' }]));
    expect(loadSavedFeeds()).toEqual([{ url: 'https://ok.example', title: undefined }]);
  });
});
