import type { GoogleDriveRemoteConfig, S3Object } from './types.js';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface ListResult {
  objects: S3Object[];
  error?: string;
}

interface DeleteResult {
  success: boolean;
  error?: string;
}

async function getValidToken(config: GoogleDriveRemoteConfig): Promise<string> {
  if (config.accessToken) {
    return config.accessToken;
  }
  throw new Error('GOOGLE_AUTH_REQUIRED');
}

export async function uploadToGoogleDrive(
  config: GoogleDriveRemoteConfig,
  objectKey: string,
  blob: Blob,
  _contentType = 'application/epub+zip',
  _onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  try {
    const token = await getValidToken(config);

    const metadata = {
      name: objectKey,
      parents: [config.folderId],
    };

    const formData = new FormData();
    formData.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
    );
    formData.append('file', blob, objectKey);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    if (response.status === 401) {
      return { success: false, error: 'GOOGLE_AUTH_REQUIRED' };
    }

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Upload failed: ${response.status} ${response.statusText}\n${error}`,
      };
    }

    const result = await response.json();
    const url = getGoogleDrivePublicUrl(config, result.id);

    return { success: true, url };
  } catch (error) {
    if (error instanceof Error && error.message === 'GOOGLE_AUTH_REQUIRED') {
      return { success: false, error: 'GOOGLE_AUTH_REQUIRED' };
    }
    return { success: false, error: String(error) };
  }
}

export async function listGoogleDriveFiles(
  config: GoogleDriveRemoteConfig,
): Promise<ListResult> {
  try {
    const token = await getValidToken(config);

    const query = `'${config.folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.append('q', query);
    url.searchParams.append('fields', 'files(id,name,size,modifiedTime)');
    url.searchParams.append('pageSize', '1000');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      return { objects: [], error: 'GOOGLE_AUTH_REQUIRED' };
    }

    if (!response.ok) {
      const error = await response.text();
      return {
        objects: [],
        error: `List failed: ${response.status} ${response.statusText}\n${error}`,
      };
    }

    const data = await response.json();
    const objects: S3Object[] = (data.files || []).map((file: any) => ({
      key: file.name,
      size: parseInt(file.size || '0', 10),
      lastModified: file.modifiedTime,
      fileId: file.id,
    }));

    return { objects };
  } catch (error) {
    if (error instanceof Error && error.message === 'GOOGLE_AUTH_REQUIRED') {
      return { objects: [], error: 'GOOGLE_AUTH_REQUIRED' };
    }
    return { objects: [], error: String(error) };
  }
}

export async function deleteGoogleDriveFile(
  config: GoogleDriveRemoteConfig,
  objectKey: string,
  fileId?: string,
): Promise<DeleteResult> {
  try {
    const token = await getValidToken(config);

    if (!fileId) {
      const listResult = await listGoogleDriveFiles(config);
      if (listResult.error) return { success: false, error: listResult.error };
      const file = listResult.objects.find((obj) => obj.key === objectKey);
      if (!file?.fileId) {
        return { success: false, error: 'File not found' };
      }
      fileId = file.fileId;
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.status === 401) {
      return { success: false, error: 'GOOGLE_AUTH_REQUIRED' };
    }

    if (response.status === 204 || response.status === 404) {
      return { success: true };
    }

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Delete failed: ${response.status} ${response.statusText}\n${error}`,
      };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === 'GOOGLE_AUTH_REQUIRED') {
      return { success: false, error: 'GOOGLE_AUTH_REQUIRED' };
    }
    return { success: false, error: String(error) };
  }
}

export function getGoogleDrivePublicUrl(
  _config: GoogleDriveRemoteConfig,
  fileId: string,
): string {
  return `https://drive.google.com/uc?id=${fileId}&export=download`;
}

export async function uploadTextToGoogleDrive(
  config: GoogleDriveRemoteConfig,
  objectKey: string,
  text: string,
  contentType = 'text/xml; charset=utf-8',
): Promise<UploadResult> {
  const blob = new Blob([text], { type: contentType });
  return uploadToGoogleDrive(config, objectKey, blob, contentType);
}
