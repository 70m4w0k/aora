/**
 * Simple in-memory cache utility
 * Provides caching for API responses with TTL support
 */

class Cache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Generate cache key from arguments
   */
  generateKey(key, ...args) {
    if (args.length === 0) return key;
    const argsKey = JSON.stringify(args);
    return `${key}:${argsKey}`;
  }

  /**
   * Get cached value
   */
  get(key, ...args) {
    const cacheKey = this.generateKey(key, ...args);
    const item = this.cache.get(cacheKey);

    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(cacheKey);
      return null;
    }

    return item.value;
  }

  /**
   * Set cached value
   */
  set(key, value, ttl = null, ...args) {
    const cacheKey = this.generateKey(key, ...args);
    const expiresAt = Date.now() + (ttl || this.defaultTTL);

    this.cache.set(cacheKey, {
      value,
      expiresAt,
      createdAt: Date.now(),
    });
  }

  /**
   * Delete cached value
   */
  delete(key, ...args) {
    const cacheKey = this.generateKey(key, ...args);
    return this.cache.delete(cacheKey);
  }

  /**
   * Clear all cache or cache matching pattern
   */
  clear(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Clear cache entries matching pattern
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Check if key exists and is valid
   */
  has(key, ...args) {
    const cacheKey = this.generateKey(key, ...args);
    const item = this.cache.get(cacheKey);
    
    if (!item) {
      return false;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(cacheKey);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const item of this.cache.values()) {
      if (now > item.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
    };
  }

  /**
   * Clean expired entries
   */
  clean() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Singleton instance
const cache = new Cache();

// Auto-clean expired entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.clean();
  }, 10 * 60 * 1000);
}

export default cache;

