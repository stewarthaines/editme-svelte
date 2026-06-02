import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AwsClient } from 'aws4fetch';
import {
  getPublicUrl,
  uploadToS3,
  listObjects,
  deleteObject,
} from './s3-upload.js';
import type { S3RemoteConfig } from './types.js';

// vi.mock is hoisted; factory captures mockSign/mockAwsFetch by closure reference.
// Must use function() not arrow so it can be called with `new`.
let mockSign: ReturnType<typeof vi.fn>;
let mockAwsFetch: ReturnType<typeof vi.fn>;

vi.mock('aws4fetch', () => ({
  AwsClient: vi.fn().mockImplementation(function () {
    return { sign: mockSign, fetch: mockAwsFetch };
  }),
}));

const creds: S3RemoteConfig = {
  id: '1',
  name: 'Test S3',
  type: 's3-compatible',
  endpoint: 'https://s3.example.com',
  bucket: 'my-bucket',
  accessKeyId: 'KEY',
  secretAccessKey: 'SECRET',
};

beforeEach(() => {
  mockSign = vi.fn();
  mockAwsFetch = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getPublicUrl', () => {
  it('builds URL from endpoint and bucket', () => {
    expect(getPublicUrl(creds, 'book.epub')).toBe(
      'https://s3.example.com/my-bucket/book.epub',
    );
  });

  it('URL-encodes the object key', () => {
    expect(getPublicUrl(creds, 'my book.epub')).toBe(
      'https://s3.example.com/my-bucket/my%20book.epub',
    );
  });

  it('uses publicUrlBase when set', () => {
    const withBase = { ...creds, publicUrlBase: 'https://cdn.example.com' };
    expect(getPublicUrl(withBase, 'book.epub')).toBe(
      'https://cdn.example.com/book.epub',
    );
  });

  it('strips trailing slash from publicUrlBase', () => {
    const withBase = { ...creds, publicUrlBase: 'https://cdn.example.com/' };
    expect(getPublicUrl(withBase, 'book.epub')).toBe(
      'https://cdn.example.com/book.epub',
    );
  });

  it('strips trailing slash from endpoint', () => {
    const withSlash = { ...creds, endpoint: 'https://s3.example.com/' };
    expect(getPublicUrl(withSlash, 'book.epub')).toBe(
      'https://s3.example.com/my-bucket/book.epub',
    );
  });
});

describe('uploadToS3', () => {
  it('signs the request and returns success with URL', async () => {
    const signedReq = new Request(
      'https://s3.example.com/my-bucket/book.epub',
      { method: 'PUT' },
    );
    mockSign.mockResolvedValue(signedReq);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
      }),
    );

    const result = await uploadToS3(creds, 'book.epub', new Blob(['data']));
    expect(result.success).toBe(true);
    expect(result.url).toBe('https://s3.example.com/my-bucket/book.epub');
    expect(mockSign).toHaveBeenCalledWith(
      'https://s3.example.com/my-bucket/book.epub',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('strips trailing slash from endpoint when building URL to sign', async () => {
    const credsWithSlash = { ...creds, endpoint: 'https://s3.example.com/' };
    mockSign.mockResolvedValue(
      new Request('https://signed.example.com', { method: 'PUT' }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
      }),
    );

    await uploadToS3(credsWithSlash, 'book.epub', new Blob(['data']));
    expect(mockSign).toHaveBeenCalledWith(
      'https://s3.example.com/my-bucket/book.epub',
      expect.anything(),
    );
  });

  it('returns error on non-ok response', async () => {
    mockSign.mockResolvedValue(
      new Request('https://signed.example.com', { method: 'PUT' }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Access Denied',
      }),
    );

    const result = await uploadToS3(creds, 'book.epub', new Blob(['data']));
    expect(result.success).toBe(false);
    expect(result.error).toContain('403');
  });

  it('returns error when sign throws', async () => {
    mockSign.mockRejectedValue(new Error('signing failed'));

    const result = await uploadToS3(creds, 'book.epub', new Blob(['data']));
    expect(result.success).toBe(false);
    expect(result.error).toContain('signing failed');
  });
});

describe('listObjects', () => {
  const listXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<ListBucketResult>',
    '  <Contents>',
    '    <Key>book1.epub</Key>',
    '    <Size>1024</Size>',
    '    <LastModified>2024-01-01T00:00:00.000Z</LastModified>',
    '  </Contents>',
    '  <Contents>',
    '    <Key>book2.epub</Key>',
    '    <Size>2048</Size>',
    '    <LastModified>2024-02-01T00:00:00.000Z</LastModified>',
    '  </Contents>',
    '</ListBucketResult>',
  ].join('\n');

  it('parses XML response into objects', async () => {
    mockAwsFetch.mockResolvedValue({ ok: true, text: async () => listXml });

    const result = await listObjects(creds);
    expect(result.objects).toHaveLength(2);
    expect(result.objects[0]).toEqual({
      key: 'book1.epub',
      size: 1024,
      lastModified: '2024-01-01T00:00:00.000Z',
    });
    expect(result.objects[1].key).toBe('book2.epub');
  });

  it('appends prefix to request URL', async () => {
    mockAwsFetch.mockResolvedValue({
      ok: true,
      text: async () => '<ListBucketResult></ListBucketResult>',
    });

    await listObjects(creds, 'books/');
    expect(mockAwsFetch).toHaveBeenCalledWith(
      expect.stringContaining('prefix=books%2F'),
      expect.anything(),
    );
  });

  it('returns error on non-ok response', async () => {
    mockAwsFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: async () => '',
    });

    const result = await listObjects(creds);
    expect(result.objects).toHaveLength(0);
    expect(result.error).toContain('403');
  });

  it('returns empty array for invalid XML without error', async () => {
    mockAwsFetch.mockResolvedValue({
      ok: true,
      text: async () => 'not xml <<<',
    });

    const result = await listObjects(creds);
    expect(result.objects).toHaveLength(0);
    expect(result.error).toBeUndefined();
  });

  it('returns error when fetch throws', async () => {
    mockAwsFetch.mockRejectedValue(new Error('network error'));

    const result = await listObjects(creds);
    expect(result.objects).toHaveLength(0);
    expect(result.error).toContain('network error');
  });
});

describe('deleteObject', () => {
  it('returns success on 204', async () => {
    mockAwsFetch.mockResolvedValue({ status: 204, ok: true });

    const result = await deleteObject(creds, 'book.epub');
    expect(result.success).toBe(true);
  });

  it('returns success on 404 (already gone)', async () => {
    mockAwsFetch.mockResolvedValue({ status: 404, ok: false });

    const result = await deleteObject(creds, 'book.epub');
    expect(result.success).toBe(true);
  });

  it('returns error on 403', async () => {
    mockAwsFetch.mockResolvedValue({
      status: 403,
      ok: false,
      statusText: 'Forbidden',
      text: async () => '',
    });

    const result = await deleteObject(creds, 'book.epub');
    expect(result.success).toBe(false);
    expect(result.error).toContain('403');
  });

  it('returns error when fetch throws', async () => {
    mockAwsFetch.mockRejectedValue(new Error('network error'));

    const result = await deleteObject(creds, 'book.epub');
    expect(result.success).toBe(false);
    expect(result.error).toContain('network error');
  });
});
