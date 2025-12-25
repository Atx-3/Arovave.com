// IndexedDB utility for storing large files like videos
const DB_NAME = 'arovaveDB';
const DB_VERSION = 1;
const STORE_NAME = 'settings';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            }
        };
    });
}

export async function saveVideoToDB(videoData: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ key: 'backgroundVideo', data: videoData });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

export async function getVideoFromDB(): Promise<string | null> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get('backgroundVideo');

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                resolve(request.result?.data || null);
            };
        });
    } catch {
        return null;
    }
}
