// ============================================================================
// Tuck App — Google Drive Sync
// Stores all data as a single JSON file in user's Google Drive
// ============================================================================

import { exportAllData, importAllData, markAllSynced } from './db';

const TUCK_FOLDER_NAME = 'Tuck App Data';
const TUCK_DATA_FILE = 'tuck-data.json';

/**
 * Get or create the Tuck folder in Google Drive
 */
async function getOrCreateFolder(accessToken: string): Promise<string> {
  // Search for existing folder
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${TUCK_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: TUCK_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  const folder = await createRes.json();
  return folder.id;
}

/**
 * Find the tuck-data.json file in the folder
 */
async function findDataFile(accessToken: string, folderId: string): Promise<string | null> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${TUCK_DATA_FILE}' and '${folderId}' in parents and trashed=false&fields=files(id)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
}

/**
 * Upload / update data file to Google Drive
 */
async function uploadDataFile(accessToken: string, folderId: string, fileId: string | null, content: string): Promise<string> {
  const metadata = {
    name: TUCK_DATA_FILE,
    mimeType: 'application/json',
    ...(fileId ? {} : { parents: [folderId] }),
  };

  const boundary = '-------tuck_boundary';
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n');

  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

  const res = await fetch(url, {
    method: fileId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  const result = await res.json();
  return result.id;
}

/**
 * Download data file from Google Drive
 */
async function downloadDataFile(accessToken: string, fileId: string): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return res.text();
}

// ============================================================================
// Public API
// ============================================================================

export type SyncResult = {
  success: boolean;
  message: string;
  timestamp: string;
};

/**
 * Sync local data with Google Drive.
 * Strategy: Export local → merge with remote → upload merged → import merged locally
 */
export async function syncWithDrive(accessToken: string): Promise<SyncResult> {
  try {
    const folderId = await getOrCreateFolder(accessToken);
    const fileId = await findDataFile(accessToken, folderId);
    const localData = await exportAllData();

    if (fileId) {
      // Download remote data and merge
      const remoteContent = await downloadDataFile(accessToken, fileId);
      const remoteData = JSON.parse(remoteContent);

      // Import remote data (merge: newer wins)
      await importAllData(remoteData);

      // Re-export merged data and upload
      const mergedData = await exportAllData();
      await uploadDataFile(accessToken, folderId, fileId, JSON.stringify(mergedData));
    } else {
      // First sync: just upload local data
      await uploadDataFile(accessToken, folderId, null, JSON.stringify(localData));
    }

    await markAllSynced();

    return {
      success: true,
      message: 'All changes synced',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Sync failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Sync failed',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Force download from Drive and overwrite local
 */
export async function pullFromDrive(accessToken: string): Promise<SyncResult> {
  try {
    const folderId = await getOrCreateFolder(accessToken);
    const fileId = await findDataFile(accessToken, folderId);

    if (!fileId) {
      return { success: true, message: 'No remote data found', timestamp: new Date().toISOString() };
    }

    const remoteContent = await downloadDataFile(accessToken, fileId);
    const remoteData = JSON.parse(remoteContent);
    await importAllData(remoteData);
    await markAllSynced();

    return { success: true, message: 'Downloaded from cloud', timestamp: new Date().toISOString() };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Pull failed',
      timestamp: new Date().toISOString(),
    };
  }
}
