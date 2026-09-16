const PREFIX = 'llmenc:';
const DB_NAME = 'hoverchart-secrets';
const STORE = 'keys';
const KEY_ID = 'llm-wrapping-key';

function canUseWebCrypto() {
  return (
    typeof window !== 'undefined' &&
    typeof window.crypto?.subtle === 'object' &&
    typeof window.indexedDB === 'object'
  );
}

function toBase64(bytes) {
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function fromBase64(str) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

let keyPromise = null;

function openSecretDb() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadWrappingKey() {
  if (keyPromise) return keyPromise;
  keyPromise = (async () => {
    const db = await openSecretDb();
    let existing = null;
    try {
      existing = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(KEY_ID);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
      });
    } catch { existing = null; }
    if (existing) return existing;
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(key, KEY_ID);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return key;
  })().catch((err) => {
    keyPromise = null;
    throw err;
  });
  return keyPromise;
}

export function isEncryptedSecret(value) {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

export async function encryptSecret(plaintext) {
  const text = String(plaintext);
  if (!canUseWebCrypto()) return text;
  const key = await loadWrappingKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(text)
  );
  return PREFIX + toBase64(iv) + '.' + toBase64(new Uint8Array(ciphertext));
}

export async function decryptSecret(encoded) {
  if (!isEncryptedSecret(encoded)) return encoded;
  if (!canUseWebCrypto()) return encoded;
  const key = await loadWrappingKey();
  const payload = encoded.slice(PREFIX.length);
  const dot = payload.indexOf('.');
  const iv = fromBase64(payload.slice(0, dot));
  const ciphertext = fromBase64(payload.slice(dot + 1));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plain);
}

export async function readStoredSecret(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (value === null || value === undefined) return null;
    if (isEncryptedSecret(value)) return await decryptSecret(value);
    return value;
  } catch {
    return null;
  }
}

export async function persistStoredSecret(storageKey, value) {
  try {
    if (value === null || value === undefined || value === '') {
      localStorage.removeItem(storageKey);
      return;
    }
    const blob = await encryptSecret(value);
    localStorage.setItem(storageKey, JSON.stringify(blob));
  } catch (err) {
    console.warn('[encryptedStorage] Encryption unavailable, storing key in plaintext', err);
    try { localStorage.setItem(storageKey, JSON.stringify(String(value))); } catch { /* ignore */ }
  }
}

export async function migrateLegacySecrets() {
  if (!canUseWebCrypto()) return;
  try {
    const keys = [];
    if (localStorage.getItem('llm:apiKey')) keys.push('llm:apiKey');
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (k.startsWith('llm:window:') && k.endsWith(':apiKey')) keys.push(k);
    }
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      let value;
      try { value = JSON.parse(raw); } catch { continue; }
      if (value != null && !isEncryptedSecret(value)) {
        try {
          localStorage.setItem(k, JSON.stringify(await encryptSecret(String(value))));
        } catch { /* leave plaintext */ }
      }
    }
  } catch { /* ignore */ }
}