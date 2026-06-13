const PREFIX = 'kb:';

export function get(key) {
  try { return JSON.parse(localStorage.getItem(PREFIX + key)); } catch (_) { return null; }
}

export function set(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (_) {}
}

export function del(key) {
  try { localStorage.removeItem(PREFIX + key); } catch (_) {}
}
