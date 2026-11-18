import { INITIAL_DATA } from '../data/catalog';
import type { BrainSparkData } from '../types/brainspark';
import { parseAndValidateBackupJson } from '../utils/validation';

const DB_NAME = 'brainspark_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const RECORD_KEY = 'primary';
const LS_KEY = 'brainspark_state_v1';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

async function readFromIndexedDB(): Promise<BrainSparkData | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(RECORD_KEY);
    req.onsuccess = () => {
      resolve((req.result as BrainSparkData | undefined) ?? null);
    };
    req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'));
    tx.oncomplete = () => db.close();
  });
}

async function writeToIndexedDB(data: BrainSparkData): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(data, RECORD_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error('IndexedDB write failed'));
    tx.oncomplete = () => db.close();
  });
}

function readFromLocalStorage(): BrainSparkData | null {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const validated = parseAndValidateBackupJson(raw);
    return validated.ok ? validated.data : null;
  } catch {
    return null;
  }
}

function writeToLocalStorage(data: BrainSparkData): void {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors in restricted WebViews
  }
}

export async function loadBrainSparkData(): Promise<BrainSparkData> {
  try {
    const idbData = await readFromIndexedDB();
    if (idbData) {
      const validated = parseAndValidateBackupJson(JSON.stringify(idbData));
      if (validated.ok) {
        writeToLocalStorage(validated.data);
        return validated.data;
      }
    }
  } catch {
    // Fall back to localStorage below
  }

  const lsData = readFromLocalStorage();
  if (lsData) {
    try {
      await writeToIndexedDB(lsData);
    } catch {
      // Ignore IDB sync failure in restricted contexts
    }
    return lsData;
  }

  return structuredClone(INITIAL_DATA);
}

export async function saveBrainSparkData(data: BrainSparkData): Promise<void> {
  writeToLocalStorage(data);
  try {
    await writeToIndexedDB(data);
  } catch {
    // localStorage mirror keeps data safe even if IndexedDB fails
  }
}

export async function resetBrainSparkData(): Promise<BrainSparkData> {
  const fresh = structuredClone(INITIAL_DATA);
  await saveBrainSparkData(fresh);
  return fresh;
}
