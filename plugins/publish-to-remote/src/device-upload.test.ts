import { describe, it, expect } from 'vitest';
import { parseKoboVersion, sniffVolume, isBookFile } from './device-upload.js';

// Minimal fake directory-handle tree for sniffing.
function fakeDir(
  dirs: Record<string, unknown> = {},
  files: Record<string, string> = {},
) {
  return {
    async getDirectoryHandle(name: string) {
      if (name in dirs) return dirs[name];
      throw new DOMException('not found', 'NotFoundError');
    },
    async getFileHandle(name: string) {
      if (name in files) {
        return { getFile: async () => ({ text: async () => files[name] }) };
      }
      throw new DOMException('not found', 'NotFoundError');
    },
  } as unknown as FileSystemDirectoryHandle;
}

describe('parseKoboVersion', () => {
  it('extracts serial and firmware from the real field layout', () => {
    expect(
      parseKoboVersion(
        'N50633C253348,4.1.15,4.38.23697,4.1.15,4.1.15,00000000-0000-0000-0000-000000000386',
      ),
    ).toEqual({ serial: 'N50633C253348', firmware: '4.38.23697' });
  });

  it('tolerates short and empty lines', () => {
    expect(parseKoboVersion('SERIALONLY')).toEqual({
      serial: 'SERIALONLY',
      firmware: undefined,
    });
    expect(parseKoboVersion('')).toEqual({
      serial: undefined,
      firmware: undefined,
    });
  });
});

describe('sniffVolume', () => {
  it('identifies a Kobo with firmware detail', async () => {
    const vol = fakeDir({
      '.kobo': fakeDir({}, { version: 'S1,4.1.15,4.38.23697' }),
    });
    expect(await sniffVolume(vol)).toEqual({
      kind: 'kobo',
      detail: 'Kobo · firmware 4.38.23697',
    });
  });

  it('identifies a Kobo without a version file', async () => {
    const vol = fakeDir({ '.kobo': fakeDir() });
    expect(await sniffVolume(vol)).toEqual({ kind: 'kobo', detail: 'Kobo' });
  });

  it('falls back to generic for unmarked volumes', async () => {
    expect(await sniffVolume(fakeDir())).toEqual({ kind: 'generic' });
  });
});

describe('isBookFile', () => {
  it('accepts epub and kepub.epub, case-insensitively', () => {
    expect(isBookFile('book.epub')).toBe(true);
    expect(isBookFile('Book.EPUB')).toBe(true);
    expect(isBookFile('book.kepub.epub')).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isBookFile('book.pdf')).toBe(false);
    expect(isBookFile('catalog.xml')).toBe(false);
    expect(isBookFile('notes.epub.bak')).toBe(false);
  });
});
