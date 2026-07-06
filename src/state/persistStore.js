/**
 * Thin wrapper around @tauri-apps/plugin-store so the rest of the app
 * doesn't care whether it's running inside Tauri or just `vite dev` in
 * a browser tab (handy for fast UI iteration without a Rust rebuild).
 *
 * In Tauri: persists to budgetron-data.json in the app's data dir.
 * In a plain browser: falls back to localStorage under the same keys.
 */

const IS_TAURI =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const STORE_FILE = "budgetron-data.json";

let _storePromise = null;

async function _getStore() {
  if (!IS_TAURI) return null;
  if (!_storePromise) {
    const { Store } = await import("@tauri-apps/plugin-store");
    _storePromise = Store.load(STORE_FILE);
  }
  return _storePromise;
}

export async function loadValue(key, fallback) {
  try {
    if (IS_TAURI) {
      const store = await _getStore();
      const val = await store.get(key);
      return val ?? fallback;
    }
    const raw = localStorage.getItem(`budgetron:${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`[persistStore] failed to load "${key}":`, err);
    return fallback;
  }
}

export async function saveValue(key, value) {
  try {
    if (IS_TAURI) {
      const store = await _getStore();
      await store.set(key, value);
      await store.save();
      return true;
    }
    localStorage.setItem(`budgetron:${key}`, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[persistStore] failed to save "${key}":`, err);
    return false;
  }
}
