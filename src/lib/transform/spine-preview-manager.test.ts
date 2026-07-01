import { describe, it, expect } from 'vitest';
import { deriveContentProperties } from './spine-preview-manager.js';

/**
 * Unit coverage for the content-derived manifest-property reconciliation
 * (`svg`, `mathml`) extracted from the render pipeline. Parsing uses text/html,
 * which the unit env (happy-dom) handles for <svg>/<math> foreign content.
 */
describe('deriveContentProperties', () => {
  const wrap = (body: string) =>
    `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>t</title></head><body>${body}</body></html>`;

  it('adds svg when the chapter embeds an <svg>', () => {
    const xhtml = wrap('<div class="fleuron"><svg viewBox="0 0 1 1"><use href="#g"/></svg></div>');
    expect(deriveContentProperties(xhtml, [])).toEqual(['svg']);
  });

  it('adds mathml when the chapter embeds a <math>', () => {
    const xhtml = wrap('<p><math><mi>x</mi></math></p>');
    expect(deriveContentProperties(xhtml, [])).toEqual(['mathml']);
  });

  it('adds both svg and mathml when both are present', () => {
    const xhtml = wrap('<svg><rect/></svg><math><mn>1</mn></math>');
    expect(deriveContentProperties(xhtml, [])).toEqual(['svg', 'mathml']);
  });

  it('returns null (no change) when svg is already flagged and still present', () => {
    const xhtml = wrap('<svg><rect/></svg>');
    expect(deriveContentProperties(xhtml, ['svg'])).toBeNull();
  });

  it('removes svg when the element is gone', () => {
    const xhtml = wrap('<p>no vectors here</p>');
    expect(deriveContentProperties(xhtml, ['svg'])).toEqual([]);
  });

  it('removes mathml but keeps svg when only the math is gone', () => {
    const xhtml = wrap('<svg><rect/></svg>');
    // order preserved: svg stays in place, mathml dropped
    expect(deriveContentProperties(xhtml, ['svg', 'mathml'])).toEqual(['svg']);
  });

  it('preserves non-owned tokens (scripted, cover-image) untouched', () => {
    const xhtml = wrap('<svg><rect/></svg>');
    // scripted (blanket toggle) and cover-image must survive; svg is added.
    expect(deriveContentProperties(xhtml, ['scripted', 'cover-image'])).toEqual([
      'scripted',
      'cover-image',
      'svg',
    ]);
  });

  it('returns null when nothing changes and no owned tokens apply', () => {
    const xhtml = wrap('<p>plain text</p>');
    expect(deriveContentProperties(xhtml, ['scripted'])).toBeNull();
  });

  it('keeps scripted while removing a now-absent svg', () => {
    const xhtml = wrap('<p>plain</p>');
    expect(deriveContentProperties(xhtml, ['scripted', 'svg'])).toEqual(['scripted']);
  });
});
