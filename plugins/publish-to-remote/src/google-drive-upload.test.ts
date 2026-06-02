import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getGoogleDrivePublicUrl,
  listGoogleDriveFiles,
  uploadToGoogleDrive,
  deleteGoogleDriveFile,
} from './google-drive-upload.js';
import type { GoogleDriveRemoteConfig } from './types.js';

const config: GoogleDriveRemoteConfig = {
  id: '1',
  name: 'My Drive',
  type: 'google-drive',
  clientId: 'client-id',
  apiKey: 'api-key',
  folderId: 'folder-123',
  folderName: 'My Books',
  accessToken: 'valid-token',
};

const noTokenConfig: GoogleDriveRemoteConfig = {
  ...config,
  accessToken: undefined,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getGoogleDrivePublicUrl', () => {
  it('constructs download URL from fileId', () => {
    expect(getGoogleDrivePublicUrl(config, 'file-abc')).toBe(
      'https://drive.google.com/uc?id=file-abc&export=download',
    );
  });
});

describe('listGoogleDriveFiles', () => {
  it('returns parsed file list on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          files: [
            {
              id: 'file-1',
              name: 'book1.epub',
              size: '1024',
              modifiedTime: '2024-01-01T00:00:00.000Z',
            },
            {
              id: 'file-2',
              name: 'book2.epub',
              size: '2048',
              modifiedTime: '2024-02-01T00:00:00.000Z',
            },
          ],
        }),
      }),
    );

    const result = await listGoogleDriveFiles(config);
    expect(result.objects).toHaveLength(2);
    expect(result.objects[0]).toEqual({
      key: 'book1.epub',
      size: 1024,
      lastModified: '2024-01-01T00:00:00.000Z',
      fileId: 'file-1',
    });
  });

  it('handles missing files array gracefully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }),
    );

    const result = await listGoogleDriveFiles(config);
    expect(result.objects).toHaveLength(0);
    expect(result.error).toBeUndefined();
  });

  it('returns GOOGLE_AUTH_REQUIRED when no token', async () => {
    const result = await listGoogleDriveFiles(noTokenConfig);
    expect(result.objects).toHaveLength(0);
    expect(result.error).toBe('GOOGLE_AUTH_REQUIRED');
  });

  it('returns GOOGLE_AUTH_REQUIRED on 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    );

    const result = await listGoogleDriveFiles(config);
    expect(result.objects).toHaveLength(0);
    expect(result.error).toBe('GOOGLE_AUTH_REQUIRED');
  });

  it('returns error message on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'quota exceeded',
      }),
    );

    const result = await listGoogleDriveFiles(config);
    expect(result.objects).toHaveLength(0);
    expect(result.error).toContain('500');
  });
});

describe('uploadToGoogleDrive', () => {
  it('returns success with URL on 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 'new-file-id' }),
      }),
    );

    const result = await uploadToGoogleDrive(
      config,
      'book.epub',
      new Blob(['data']),
    );
    expect(result.success).toBe(true);
    expect(result.url).toBe(
      'https://drive.google.com/uc?id=new-file-id&export=download',
    );
  });

  it('returns GOOGLE_AUTH_REQUIRED when no token', async () => {
    const result = await uploadToGoogleDrive(
      noTokenConfig,
      'book.epub',
      new Blob(['data']),
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('GOOGLE_AUTH_REQUIRED');
  });

  it('returns GOOGLE_AUTH_REQUIRED on 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    );

    const result = await uploadToGoogleDrive(
      config,
      'book.epub',
      new Blob(['data']),
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('GOOGLE_AUTH_REQUIRED');
  });

  it('returns error on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'storage quota exceeded',
      }),
    );

    const result = await uploadToGoogleDrive(
      config,
      'book.epub',
      new Blob(['data']),
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('500');
  });
});

describe('deleteGoogleDriveFile', () => {
  it('returns success on 204 when fileId provided', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 204, ok: true }),
    );

    const result = await deleteGoogleDriveFile(config, 'book.epub', 'file-1');
    expect(result.success).toBe(true);
  });

  it('returns success on 404 (already gone)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 404, ok: false }),
    );

    const result = await deleteGoogleDriveFile(config, 'book.epub', 'file-1');
    expect(result.success).toBe(true);
  });

  it('resolves fileId via list when not provided', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          files: [
            {
              id: 'file-1',
              name: 'book.epub',
              size: '1024',
              modifiedTime: '2024-01-01T00:00:00.000Z',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({ status: 204, ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const result = await deleteGoogleDriveFile(config, 'book.epub');
    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns error when file not found in list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ files: [] }),
      }),
    );

    const result = await deleteGoogleDriveFile(config, 'missing.epub');
    expect(result.success).toBe(false);
    expect(result.error).toBe('File not found');
  });

  it('returns GOOGLE_AUTH_REQUIRED when no token', async () => {
    const result = await deleteGoogleDriveFile(
      noTokenConfig,
      'book.epub',
      'file-1',
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('GOOGLE_AUTH_REQUIRED');
  });

  it('returns GOOGLE_AUTH_REQUIRED on 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 401, ok: false }),
    );

    const result = await deleteGoogleDriveFile(config, 'book.epub', 'file-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('GOOGLE_AUTH_REQUIRED');
  });
});
