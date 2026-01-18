
import { StickerSet } from '../types';

const DB_NAME = 'StickerAtelierDB';
const STORE_NAME = 'sticker_sets';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const saveStickerSet = async (set: StickerSet): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(set);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const saveStickerSets = async (sets: StickerSet[]): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    let completed = 0;
    let errors = false;

    if (sets.length === 0) {
      resolve();
      return;
    }

    sets.forEach(set => {
      const request = store.put(set);
      request.onsuccess = () => {
        completed++;
        if (completed === sets.length) resolve();
      };
      request.onerror = () => {
        errors = true;
      };
    });

    transaction.oncomplete = () => {
        if (!errors) resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getAllStickerSets = async (): Promise<StickerSet[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const sets = request.result as StickerSet[];
      // Sort by order (asc) if available, otherwise by createdAt (desc)
      resolve(sets.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return b.createdAt - a.createdAt;
      }));
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteStickerSet = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
