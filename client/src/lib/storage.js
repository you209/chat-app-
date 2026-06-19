// Thin key-value storage wrapper. Backed by localStorage on web today;
// swap the implementation for @capacitor/preferences when wrapping with
// Capacitor — callers never touch localStorage directly.
export const storage = {
  async get(key) {
    return localStorage.getItem(key);
  },
  async set(key, value) {
    localStorage.setItem(key, value);
  },
  async remove(key) {
    localStorage.removeItem(key);
  }
};
