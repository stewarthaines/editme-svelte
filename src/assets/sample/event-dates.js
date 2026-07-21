/**
 * Sample DOM transform: speakable event dates.
 *
 * The Polyphony bulletin's event lists date their entries like "25-27.07" or
 * "11.10-30.11". An earlier project transform rendered these as "25 – 27 July",
 * but the screen reader preview showed the dash reads poorly aloud (skipped, or
 * spoken as "dash"), and ranges that span months were missed entirely. This
 * version speaks naturally:
 *
 *   28.09        →  28 September
 *   12-14.10     →  12 to 14 October
 *   11.10-30.11  →  11 October to 30 November
 *
 * Month names follow the book's language (ctx.language) via Intl; the range
 * word "to" is tuned for English-language books.
 *
 * Use: copy into SOURCE/scripts/ and list it in settings.json "domTransforms".
 * Expects list items of a `.events` list to open with the date, an en/em dash,
 * then the entry text; the date is wrapped in <span class="event-date"> for
 * the book's hanging-date styles.
 */
function transformDOM(document, idref, ctx) {
  const language = (ctx && ctx.language) || 'en';
  const monthName = month =>
    new Intl.DateTimeFormat(language, { month: 'long' }).format(new Date(2000, month - 1, 1));
  const validMonth = month => month >= 1 && month <= 12;

  // "11.10-30.11" (month span) | "12-14.10" (day range) | "28.09" (single),
  // followed by the dash that separates the date from the entry text.
  const DATE =
    /^\s*(?:(\d{1,2})\.(\d{1,2})-(\d{1,2})\.(\d{1,2})|(\d{1,2})-(\d{1,2})\.(\d{1,2})|(\d{1,2})\.(\d{1,2}))\s*[–—-]\s*/;

  const spokenDate = match => {
    if (match[1]) {
      const [d1, m1, d2, m2] = match.slice(1, 5).map(Number);
      if (!validMonth(m1) || !validMonth(m2)) return null;
      return `${d1} ${monthName(m1)} to ${d2} ${monthName(m2)}`;
    }
    if (match[5]) {
      const [d1, d2, m] = match.slice(5, 8).map(Number);
      if (!validMonth(m)) return null;
      return `${d1} to ${d2} ${monthName(m)}`;
    }
    const [d, m] = match.slice(8, 10).map(Number);
    if (!validMonth(m)) return null;
    return `${d} ${monthName(m)}`;
  };

  for (const item of document.querySelectorAll('.events li')) {
    // djot renders tight list items as bare text, loose ones wrapped in <p>
    let node = item.firstChild;
    if (node && node.nodeType === Node.ELEMENT_NODE && node.tagName === 'P') {
      node = node.firstChild;
    }
    if (!node || node.nodeType !== Node.TEXT_NODE) continue;
    const match = (node.textContent || '').match(DATE);
    if (!match) continue;
    const text = spokenDate(match);
    if (text === null) continue;
    const date = document.createElement('span');
    date.className = 'event-date';
    date.textContent = text;
    node.textContent = (node.textContent || '').slice(match[0].length);
    node.parentNode.insertBefore(date, node);
    node.parentNode.insertBefore(document.createTextNode(' '), node);
  }
  return document;
}
