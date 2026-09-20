// IndexedDB Storage Layer for NIRIKSHAK
// Dedicated to binary images, camera captures, and large evidence files.
// Protects localStorage from quota crashes.

const DB_NAME = 'nirikshak_db';
const DB_VERSION = 1;
const STORE_NAME = 'package_images';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

export async function storeImageBinary(key: string, blob: Blob | ArrayBuffer | string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put({ key, data: blob, updatedAt: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error('IndexedDB put failed'));
    });
  } catch (error) {
    console.warn('[IndexedDB] Falling back or failed storeImageBinary:', error);
  }
}

export async function getImageBinary(key: string): Promise<Blob | ArrayBuffer | string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result && request.result.data) {
          resolve(request.result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error || new Error('IndexedDB get failed'));
    });
  } catch (error) {
    console.warn('[IndexedDB] Falling back or failed getImageBinary:', error);
    return null;
  }
}

export async function removeImageBinary(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('[IndexedDB] Delete error:', e);
  }
}

// LocalStorage safe wrapper strictly for lightweight metadata
export function safeLocalStorageSet(key: string, value: unknown): boolean {
  try {
    const str = JSON.stringify(value);
    // Guard: Prevent saving base64 or large blobs in localStorage
    if (str.length > 500000) {
      console.error(`[Guardrail 0.1] Attempted to write large payload (${str.length} bytes) to localStorage. Aborted to avoid quota crash.`);
      return false;
    }
    localStorage.setItem(key, str);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('[Storage] Local storage full. Pruning cached non-critical keys...');
      try {
        localStorage.removeItem('nirikshak_temp_cache');
      } catch {
        // ignore
      }
    }
    return false;
  }
}

export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}
