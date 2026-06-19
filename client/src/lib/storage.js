import { Capacitor } from '@capacitor/core';

// Key-value storage wrapper. Uses Capacitor Preferences on native
// platforms (Android/iOS) and localStorage on web — callers never touch
// either directly, so this is the only file that needs to change if the
// backing store ever moves.
const isNative = Capacitor.isNativePlatform();

let preferencesPromise = null;
function getPreferences() {
  if (!preferencesPromise) {
    preferencesPromise = import('@capacitor/preferences').then((m) => m.Preferences);
  }
  return preferencesPromise;
}

export const storage = {
  async get(key) {
    if (isNative) {
      const Preferences = await getPreferences();
      const { value } = await Preferences.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  },
  async set(key, value) {
    if (isNative) {
      const Preferences = await getPreferences();
      await Preferences.set({ key, value });
      return;
    }
    localStorage.setItem(key, value);
  },
  async remove(key) {
    if (isNative) {
      const Preferences = await getPreferences();
      await Preferences.remove({ key });
      return;
    }
    localStorage.removeItem(key);
  }
};
