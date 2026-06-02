declare global {
  interface Window {
    onGoogleLibraryLoad?: () => void;
    google?: any;
    gapi?: any;
  }
}

declare const google: any;

let scriptsLoaded = false;

export async function loadGoogleScripts(): Promise<void> {
  if (scriptsLoaded) return;

  return new Promise((resolve, reject) => {
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.onload = () => {
      const pickerScript = document.createElement('script');
      pickerScript.src = 'https://apis.google.com/js/api.js';
      pickerScript.onload = () => {
        window.gapi?.load?.('picker', () => {
          scriptsLoaded = true;
          resolve();
        });
      };
      pickerScript.onerror = () =>
        reject(new Error('Failed to load Picker API'));
      document.head.appendChild(pickerScript);
    };
    gisScript.onerror = () =>
      reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(gisScript);
  });
}

export function authorizeGoogleDrive(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response: any) => {
        if (response.access_token) {
          resolve(response.access_token);
        } else {
          reject(new Error('Authorization failed'));
        }
      },
    });

    client.requestAccessToken({ prompt: 'consent' });
  });
}

export async function pickGoogleDriveFolder(
  accessToken: string,
  apiKey: string,
): Promise<{ folderId: string; folderName: string }> {
  await loadGoogleScripts();

  return new Promise((resolve, reject) => {
    const folderView = new window.google.picker.DocsView();
    folderView.setIncludeFolders(true);
    folderView.setSelectFolderEnabled(true);
    folderView.setMimeTypes('application/vnd.google-apps.folder');

    const picker = new window.google.picker.PickerBuilder()
      .addView(folderView)
      .enableFeature(google.picker.Feature.NAV_HIDDEN)
      .setOAuthToken(accessToken)
      .setAppId(apiKey)
      .setCallback((data: any) => {
        if (
          data[google.picker.Response.ACTION] === google.picker.Action.PICKED
        ) {
          const doc = data[google.picker.Response.DOCUMENTS][0];
          resolve({
            folderId: doc.id,
            folderName: doc.name,
          });
        } else if (
          data[google.picker.Response.ACTION] === google.picker.Action.CANCEL
        ) {
          reject(new Error('Folder selection cancelled'));
        }
      })
      .build();

    picker.setVisible(true);
  });
}

function waitForGoogle(): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.accounts) {
      resolve();
      return;
    }
    // GSI calls this when ready
    window.onGoogleLibraryLoad = () => resolve();
  });
}

export async function refreshGoogleToken(clientId: string): Promise<string> {
  await waitForGoogle();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response: any) => {
        if (response.access_token) {
          resolve(response.access_token);
        } else {
          reject(new Error('Token refresh failed'));
        }
      },
    });

    client.requestAccessToken({ prompt: 'none' });
  });
}
