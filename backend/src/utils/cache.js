class MemoryCache {
  constructor(defaultTTLSeconds = 60) {
    this.cache = new Map();
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlSeconds) {
    const ttl = (ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL);
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  del(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

const memoryCache = new MemoryCache(120); // Default 2 minutes TTL

module.exports = memoryCache;
