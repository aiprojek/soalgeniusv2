import { createBackupData, restoreBackupData, LOCAL_CHANGE_TIMESTAMP_KEY, touchLocalChange } from './storage';

const DBX_TOKEN_KEY = 'soalgenius_dbx_token';
const DBX_APP_KEY_KEY = 'soalgenius_dbx_app_key';
const BACKUP_FILE_NAME = '/soalgenius_backup.json';
const CLOUD_SYNC_TIMESTAMP_KEY = 'soalgenius_last_cloud_sync';

export const getDropboxAuthUrl = (appKey: string): string => {
    const redirectUri = window.location.href.split('#')[0]; // URL saat ini tanpa hash
    return `https://www.dropbox.com/oauth2/authorize?client_id=${appKey}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}`;
};

export const saveDropboxToken = (token: string) => {
    localStorage.setItem(DBX_TOKEN_KEY, token);
};

export const getDropboxToken = (): string | null => {
    return localStorage.getItem(DBX_TOKEN_KEY);
};

export const isDropboxConnected = (): boolean => {
    return !!localStorage.getItem(DBX_TOKEN_KEY);
};

export const clearDropboxToken = () => {
    localStorage.removeItem(DBX_TOKEN_KEY);
};

export const saveDropboxAppKey = (key: string) => {
    localStorage.setItem(DBX_APP_KEY_KEY, key);
};

export const getDropboxAppKey = (): string | null => {
    return localStorage.getItem(DBX_APP_KEY_KEY);
};

// Sync State Helpers
export const setLastCloudSync = (isoDate: string) => {
    localStorage.setItem(CLOUD_SYNC_TIMESTAMP_KEY, isoDate);
};

export const getLastCloudSync = (): string | null => {
    return localStorage.getItem(CLOUD_SYNC_TIMESTAMP_KEY);
};

export const hasUnsavedLocalChanges = (): boolean => {
    const lastLocalChange = localStorage.getItem(LOCAL_CHANGE_TIMESTAMP_KEY);
    const lastCloudSync = localStorage.getItem(CLOUD_SYNC_TIMESTAMP_KEY);

    if (!lastLocalChange) return false; // No local changes recorded yet
    if (!lastCloudSync) return true; // Has local changes but never synced

    return new Date(lastLocalChange) > new Date(lastCloudSync);
};

// --- API Calls ---

export interface CloudMetadata {
    name: string;
    server_modified: string; // ISO 8601
}

export const getCloudMetadata = async (): Promise<CloudMetadata | null> => {
    const token = getDropboxToken();
    if (!token) return null;

    try {
        const response = await fetch('https://api.dropboxapi.com/2/files/get_metadata', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: BACKUP_FILE_NAME
            })
        });

        if (response.status === 409) {
            // File not found, that's okay
            return null;
        }

        if (!response.ok) {
            if (response.status === 401) {
                clearDropboxToken();
                throw new Error('Token Dropbox kadaluarsa.');
            }
            throw new Error('Gagal memeriksa metadata cloud.');
        }

        const data = await response.json();
        return data as CloudMetadata;
    } catch (error) {
        console.warn("Could not fetch metadata", error);
        return null;
    }
};

export const checkForCloudUpdates = async (): Promise<boolean> => {
    const metadata = await getCloudMetadata();
    if (!metadata) return false;

    // Use current time as a fallback if not set, to force sync if logic fails safely
    const lastLocalChangeStr = localStorage.getItem(LOCAL_CHANGE_TIMESTAMP_KEY);
    const lastCloudSyncStr = localStorage.getItem(CLOUD_SYNC_TIMESTAMP_KEY);

    // If we have no record of local data age, or no record of last sync, but cloud file exists -> likely newer
    if (!lastLocalChangeStr) return true;

    // The file on dropbox server modification time
    const cloudModifiedTime = new Date(metadata.server_modified).getTime();
    
    // The last time we successfully changed something locally
    const localModifiedTime = new Date(lastLocalChangeStr).getTime();

    // If cloud is newer than local changes by a significant margin (e.g. 1 second to account for clock skew)
    return cloudModifiedTime > (localModifiedTime + 1000);
};

export const uploadToDropbox = async (): Promise<void> => {
    const token = getDropboxToken();
    if (!token) throw new Error('Token Dropbox tidak ditemukan. Harap hubungkan ulang.');

    const backupData = await createBackupData();
    
    // Dropbox API: Upload
    // https://content.dropboxapi.com/2/files/upload
    
    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Dropbox-API-Arg': JSON.stringify({
                path: BACKUP_FILE_NAME,
                mode: 'overwrite', // Timpa jika ada
                autorename: false,
                mute: true,
                strict_conflict: false
            }),
            'Content-Type': 'application/octet-stream'
        },
        body: backupData
    });

    if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
             clearDropboxToken();
             throw new Error('Token Dropbox kadaluarsa. Silakan login ulang.');
        }
        throw new Error(`Gagal upload ke Dropbox: ${errorText}`);
    }

    // Success: Update Sync Timestamp
    // The response body contains metadata including server_modified
    const meta = await response.json();
    if (meta.server_modified) {
        setLastCloudSync(meta.server_modified);
        // Also update local timestamp to match so we don't trigger "unsaved changes" immediately
        // Actually, we keep local timestamp as is, just ensure sync timestamp >= local
        localStorage.setItem(LOCAL_CHANGE_TIMESTAMP_KEY, new Date().toISOString()); 
        setLastCloudSync(new Date().toISOString());
    } else {
        const now = new Date().toISOString();
        setLastCloudSync(now);
    }
};

export const downloadFromDropbox = async (): Promise<void> => {
    const token = getDropboxToken();
    if (!token) throw new Error('Token Dropbox tidak ditemukan. Harap hubungkan ulang.');

    // Dropbox API: Download
    // https://content.dropboxapi.com/2/files/download

    // 1. Get metadata first to get timestamp
    const metadata = await getCloudMetadata();

    const response = await fetch('https://content.dropboxapi.com/2/files/download', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Dropbox-API-Arg': JSON.stringify({
                path: BACKUP_FILE_NAME
            })
        }
    });

    if (!response.ok) {
        if (response.status === 409) {
             throw new Error('File backup tidak ditemukan di Dropbox. Silakan upload terlebih dahulu.');
        }
        if (response.status === 401) {
             clearDropboxToken();
             throw new Error('Token Dropbox kadaluarsa. Silakan login ulang.');
        }
        throw new Error('Gagal mengunduh dari Dropbox.');
    }

    const jsonString = await response.text();
    await restoreBackupData(jsonString);

    // Update Timestamps
    if (metadata && metadata.server_modified) {
        const modTime = new Date(metadata.server_modified).toISOString();
        setLastCloudSync(modTime);
        // After restore, local state matches cloud state
        localStorage.setItem(LOCAL_CHANGE_TIMESTAMP_KEY, modTime);
    } else {
        const now = new Date().toISOString();
        setLastCloudSync(now);
        localStorage.setItem(LOCAL_CHANGE_TIMESTAMP_KEY, now);
    }
};