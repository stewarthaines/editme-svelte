import { describe, it, expect } from 'vitest';
import { spineSignature, manifestSignature, previewKeyFor } from './signatures.js';

const manifest = [
  { id: 'chapter-1', href: 'text/chapter-1.xhtml', mediaType: 'application/xhtml+xml' },
  {
    id: 'cover-img',
    href: 'images/cover.jpg',
    mediaType: 'image/jpeg',
    properties: ['cover-image'],
  },
];

const spine = [{ idref: 'chapter-1' }, { idref: 'chapter-2', linear: false }];

describe('manifestSignature', () => {
  it('is stable for equal content in fresh arrays', () => {
    expect(manifestSignature(manifest)).toBe(manifestSignature(manifest.map(m => ({ ...m }))));
  });

  it('changes when an item id changes', () => {
    const renamed = [{ ...manifest[0], id: 'intro' }, manifest[1]];
    expect(manifestSignature(renamed)).not.toBe(manifestSignature(manifest));
  });

  it('changes when an item href changes', () => {
    const moved = [manifest[0], { ...manifest[1], href: 'images/front.jpg' }];
    expect(manifestSignature(moved)).not.toBe(manifestSignature(manifest));
  });

  it('changes when properties change', () => {
    const stripped = [manifest[0], { ...manifest[1], properties: [] }];
    expect(manifestSignature(stripped)).not.toBe(manifestSignature(manifest));
  });
});

describe('spineSignature', () => {
  it('is stable for equal content in fresh arrays', () => {
    expect(spineSignature(spine)).toBe(spineSignature(spine.map(s => ({ ...s }))));
  });

  it('treats omitted linear as linear=true', () => {
    expect(spineSignature([{ idref: 'a' }])).toBe(spineSignature([{ idref: 'a', linear: true }]));
  });

  it('changes on reorder', () => {
    expect(spineSignature([spine[1], spine[0]])).not.toBe(spineSignature(spine));
  });

  it('changes when linear toggles', () => {
    const toggled = [spine[0], { ...spine[1], linear: true }];
    expect(spineSignature(toggled)).not.toBe(spineSignature(spine));
  });

  it('is unaffected by a manifest id edit of a non-spine item', () => {
    // The service maps the spine to a new array on every updateManifestItem
    // call; only idref content matters to the gate.
    expect(spineSignature(spine.map(s => ({ ...s })))).toBe(spineSignature(spine));
  });
});

describe('previewKeyFor', () => {
  it('is equal for the same workspace, type, path, and media type', () => {
    expect(previewKeyFor('ws1', 'manifest', 'images/cover.jpg', 'image/jpeg')).toBe(
      previewKeyFor('ws1', 'manifest', 'images/cover.jpg', 'image/jpeg')
    );
  });

  it('changes when the href changes', () => {
    expect(previewKeyFor('ws1', 'manifest', 'images/cover.jpg', 'image/jpeg')).not.toBe(
      previewKeyFor('ws1', 'manifest', 'images/front.jpg', 'image/jpeg')
    );
  });

  it('distinguishes workspaces and item types', () => {
    expect(previewKeyFor('ws1', 'manifest', 'a.css')).not.toBe(
      previewKeyFor('ws2', 'manifest', 'a.css')
    );
    expect(previewKeyFor('ws1', 'source', 'a.css')).not.toBe(
      previewKeyFor('ws1', 'manifest', 'a.css')
    );
  });
});
