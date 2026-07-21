/**
 * Tests for the speakable-event-dates sample DOM transform
 * (src/assets/sample/event-dates.js). Loaded and eval'd the way the transform
 * sandbox does (wrap → return the function), then driven with a parsed DOM —
 * the same harness pattern as the list-of-figures sample tests.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

const src = readFileSync('src/assets/sample/event-dates.js', 'utf8');
const transformDOM = new Function(`${src}\nreturn transformDOM;`)() as (
  doc: Document,
  idref: string,
  ctx: unknown
) => Document;

function parse(body: string): Document {
  return new DOMParser().parseFromString(
    `<!DOCTYPE html><html><body>${body}</body></html>`,
    'text/html'
  );
}

const eventsList = (items: string[]) =>
  `<ul class="events">${items.map(item => `<li>${item}</li>`).join('')}</ul>`;

const dates = (doc: Document) =>
  [...doc.querySelectorAll('.event-date')].map(span => span.textContent);

describe('event-dates sample transform', () => {
  it('speaks single dates, day ranges, and month-spanning ranges', () => {
    const doc = transformDOM(
      parse(
        eventsList([
          '28.09 – Festival of Kartlian Traditional Song and Chant in Kaspi.',
          '12-14.10 – Second round of the 9th National Competition.',
          '11.10-30.11 – Masterclasses in Leuven, Liège, Antwerp, and Paris.',
        ])
      ),
      'the-news',
      { language: 'en' }
    );
    expect(dates(doc)).toEqual(['28 September', '12 to 14 October', '11 October to 30 November']);
    const first = doc.querySelector('.events li')!;
    expect(first.textContent).toBe(
      '28 September Festival of Kartlian Traditional Song and Chant in Kaspi.'
    );
  });

  it('names months in the book language', () => {
    const doc = transformDOM(parse(eventsList(['12-14.10 – Wettbewerb in Tbilisi.'])), 'x', {
      language: 'de',
    });
    expect(dates(doc)).toEqual(['12 to 14 Oktober']);
  });

  it('handles loose list items wrapped in <p>', () => {
    const doc = transformDOM(
      parse('<ul class="events"><li><p>8.11 – Gala concert.</p></li></ul>'),
      'x',
      { language: 'en' }
    );
    expect(dates(doc)).toEqual(['8 November']);
    expect(doc.querySelector('li p')?.textContent).toBe('8 November Gala concert.');
  });

  it('leaves non-date items, invalid months, and lists outside .events alone', () => {
    const doc = transformDOM(
      parse(
        eventsList(['No date here – just a dash.', '10.13 – month out of range.']) +
          '<ul><li>25-27.07 – not an events list.</li></ul>'
      ),
      'x',
      { language: 'en' }
    );
    expect(dates(doc)).toEqual([]);
  });

  it('works without ctx (defaults to English months)', () => {
    const doc = transformDOM(
      parse(eventsList(['1.07 – Evening of Megrelian folklore.'])),
      'x',
      undefined
    );
    expect(dates(doc)).toEqual(['1 July']);
  });
});
