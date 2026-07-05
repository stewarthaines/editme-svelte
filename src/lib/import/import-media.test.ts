import { describe, it, expect } from 'vitest';
import {
  reliableMediaType,
  filenameStem,
  formatImageSnippet,
  formatVideoSnippet,
} from './import-media.js';

describe('reliableMediaType', () => {
  const file = (name: string, type: string) => new File([''], name, { type });

  it('trusts a specific browser type', () => {
    expect(reliableMediaType(file('photo.jpg', 'image/jpeg'))).toBe('image/jpeg');
  });

  it('falls back to filename detection for generic types', () => {
    expect(reliableMediaType(file('track.mp3', 'application/octet-stream'))).toBe('audio/mpeg');
  });

  it('prefers filename detection for fonts and JavaScript', () => {
    expect(reliableMediaType(file('font.woff2', 'application/font-woff2'))).toBe('font/woff2');
    expect(reliableMediaType(file('app.js', 'text/plain'))).toBe('application/javascript');
  });
});

describe('filenameStem', () => {
  it('drops the extension', () => {
    expect(filenameStem('cover-photo.png')).toBe('cover-photo');
  });

  it('keeps extensionless and dot-leading names whole', () => {
    expect(filenameStem('README')).toBe('README');
    expect(filenameStem('.hidden')).toBe('.hidden');
  });
});

describe('snippet formatting', () => {
  it('substitutes the image template placeholders (all occurrences)', () => {
    const template = '![<alt>](<href> "<alt>")';
    expect(formatImageSnippet(template, { href: 'Images/a.png', alt: 'A photo' })).toBe(
      '![A photo](Images/a.png "A photo")'
    );
  });

  it('substitutes the video template placeholder', () => {
    expect(
      formatVideoSnippet('<video src="<href>" controls="controls"></video>', {
        href: 'Video/clip.mp4',
      })
    ).toBe('<video src="Video/clip.mp4" controls="controls"></video>');
  });
});
