import { createBackupData, restoreBackupData, LOCAL_CHANGE_TIMESTAMP_KEY, touchLocalChange } from './storage';

const DBX_TOKEN_KEY = 'soalgenius_dbx_token';
const DBX_APP_KEY_KEY = 'soalgenius_dbx_app_key';
const DBX_APP_SECRET_KEY = 'soalgenius_dbx_app_secret'; // New storage key
const BACKUP_FILE_NAME = '/soalgenius_backup.json';
const CLOUD_SYNC_TIMESTAMP_KEY = 'soalgenius_last_cloud_sync';

// --- Configuration Getters/Setters ---

export const saveDropboxConfig = (key: string, secret: string) => {
    localStorage.setItem(DBX_APP_KEY_KEY, key);
    localStorage.setItem(DBX_APP_SECRET_KEY, secret);
};

export const getDropboxConfig = () => {
    return {
        appKey: localStorage.getItem(DBX_APP_KEY_KEY) || '',
        appSecret: localStorage.getItem(DBX_APP_SECRET_KEY) || ''
    };
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
    // Kita tidak menghapus App Key/Secret agar user mudah login kembali
};

// --- Auth Flow ---

/**
 * Menghasilkan URL untuk mendapatkan Authorization Code.
 * Menggunakan response_type=code agar kita bisa menukarnya dengan token permanen/long-lived
 * menggunakan App Secret.
 */
export const getDropboxAuthCodeUrl = (appKey: string): string => {
    // Kita tidak mengirim redirect_uri spesifik agar user bisa meng-copy code
    // atau user harus mengatur redirect_uri di console Dropbox ke sembarang tempat (misal: http://localhost)
    // dan mengambil code dari URL bar.
    return `https://www.dropbox.com/oauth2/authorize?client_id=${appKey}&response_type=code`;
};

/**
 * Menukar Authorization Code dengan Access Token.
 * Ini adalah langkah 'Back-end' yang kita lakukan di client-side
 * karena ini adalah aplikasi Native/Desktop.
 */
export const exchangeAuthCodeForToken = async (code: string, appKey: string, appSecret: string): Promise<void> => {
    const details = {
        code: code,
        grant_type: 'authorization_code',
        client_id: appKey,
        client_secret: appSecret
    };

    const formBody = Object.keys(details).map(key => 
        encodeURIComponent(key) + '=' + encodeURIComponent((details as any)[key])
    ).join('&');

    const response = await fetch('https://api.dropbox.com/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: formBody
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gagal verifikasi kode: ${errorText}`);
    }

    const data = await response.json();
    if (data.access_token) {
        saveDropboxToken(data.access_token);
        saveDropboxConfig(appKey, appSecret); // Simpan config jika berhasil
    } else {
        throw new Error("Respons Dropbox tidak mengandung access token.");
    }
};

// --- User Info ---

export interface DropboxSpaceUsage {
    used: number;
    allocation: {
        allocated: number;
    };
}

export const getDropboxSpaceUsage = async (): Promise<DropboxSpaceUsage | null> => {
    const token = getDropboxToken();
    if (!token) return null;

    try {
        const response = await fetch('https://api.dropboxapi.com/2/users/get_space_usage', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
             if (response.status === 401) {
                clearDropboxToken();
            }
            return null;
        }

        const data = await response.json();
        return data as DropboxSpaceUsage;
    } catch (error) {
        console.warn("Could not fetch space usage", error);
        return null;
    }
};

// --- Sync Logic ---

export const setLastCloudSync = (isoDate: string) => {
    localStorage.setItem(CLOUD_SYNC_TIMESTAMP_KEY, isoDate);
};

export const getLastCloudSync = (): string | null => {
    return localStorage.getItem(CLOUD_SYNC_TIMESTAMP_KEY);
};

export const hasUnsavedLocalChanges = (): boolean => {
    const lastLocalChange = localStorage.getItem(LOCAL_CHANGE_TIMESTAMP_KEY);
    const lastCloudSync = localStorage.getItem(CLOUD_SYNC_TIMESTAMP_KEY);

    if (!lastLocalChange) return false; 
    if (!lastCloudSync) return true; 

    return new Date(lastLocalChange) > new Date(lastCloudSync);
};

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

        if (response.status === 409) return null; // File not found

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

    const lastLocalChangeStr = localStorage.getItem(LOCAL_CHANGE_TIMESTAMP_KEY);
    
    if (!lastLocalChangeStr) return true;

    const cloudModifiedTime = new Date(metadata.server_modified).getTime();
    const localModifiedTime = new Date(lastLocalChangeStr).getTime();

    return cloudModifiedTime > (localModifiedTime + 1000);
};

export const uploadToDropbox = async (): Promise<void> => {
    const token = getDropboxToken();
    if (!token) throw new Error('Token Dropbox tidak ditemukan. Harap hubungkan ulang.');

    const backupData = await createBackupData();
    
    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Dropbox-API-Arg': JSON.stringify({
                path: BACKUP_FILE_NAME,
                mode: 'overwrite',
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

    const meta = await response.json();
    if (meta.server_modified) {
        setLastCloudSync(meta.server_modified);
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

    if (metadata && metadata.server_modified) {
        const modTime = new Date(metadata.server_modified).toISOString();
        setLastCloudSync(modTime);
        localStorage.setItem(LOCAL_CHANGE_TIMESTAMP_KEY, modTime);
    } else {
        const now = new Date().toISOString();
        setLastCloudSync(now);
        localStorage.setItem(LOCAL_CHANGE_TIMESTAMP_KEY, now);
    }
};