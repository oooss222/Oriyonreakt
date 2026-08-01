const store = new Map();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= now) {
      store.delete(key);
    }
  }
}

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value, ttlSec = 300) {
  if (store.size > 5000) cleanup();
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSec * 1000,
  });
}

module.exports = { get, set };
