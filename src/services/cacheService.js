import NodeCache from "node-cache";

class CacheService {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes default
      checkperiod: 60, // Cleanup interval
      useClones: false, // Better performance
      maxKeys: 1000, // Prevent memory leaks
      deleteOnExpire: true,
      enableLegacyCallbacks: false,
    });

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };

    this.enabled = true;
    this.debug = process.env.NODE_ENV === "development";

    this._setupEventListeners();
  }

  /**
   * Setup cache event listeners for monitoring
   */
  _setupEventListeners() {
    this.cache.on("set", (key, value) => {
      if (this.debug) {
        console.log(`✅ Cache set: ${key}`, this._getValueSize(value));
      }
    });

    this.cache.on("del", (key, value) => {
      if (this.debug) {
        console.log(`🗑️ Cache deleted: ${key}`);
      }
      this.stats.deletes++;
    });

    this.cache.on("expired", (key, value) => {
      if (this.debug) {
        console.log(`⏰ Cache expired: ${key}`);
      }
    });

    this.cache.on("flush", () => {
      console.log("🔥 Cache flushed");
      this.stats.deletes++;
    });
  }

  /**
   * Get value size for logging
   */
  _getValueSize(value) {
    try {
      const str = typeof value === "string" ? value : JSON.stringify(value);
      return `(~${Buffer.byteLength(str, "utf8")} bytes)`;
    } catch {
      return "(size unknown)";
    }
  }

  /**
   * Main method: Get cached value or fetch and set
   */
  async getOrSet(key, fetchData, options = {}) {
    if (!this.enabled) {
      console.log(`🚫 Cache disabled, fetching: ${key}`);
      return await fetchData();
    }

    const {
      ttl = 300,
      forceRefresh = false,
      fallbackOnError = true,
      customLogger = null,
    } = options;

    const log = customLogger || console.log;

    // Force refresh - skip cache check
    if (forceRefresh) {
      log(`🔄 Force refresh for: ${key}`);
      return await this._fetchAndSet(key, fetchData, ttl, log);
    }

    try {
      const cached = this.cache.get(key);
      if (cached !== undefined) {
        this.stats.hits++;
        log(`📋 Cache hit: ${key}`);
        return cached;
      }

      this.stats.misses++;
      log(`🔄 Cache miss: ${key}`);
      return await this._fetchAndSet(key, fetchData, ttl, log);
    } catch (error) {
      this.stats.errors++;
      console.error(`❌ Cache error for ${key}:`, error.message);

      if (fallbackOnError) {
        log(`🔄 Cache fallback, fetching directly: ${key}`);
        return await fetchData();
      }
      throw error;
    }
  }

  /**
   * Internal method: Fetch data and cache it
   */
  async _fetchAndSet(key, fetchData, ttl, logger) {
    try {
      const data = await fetchData();

      if (data !== undefined && data !== null) {
        this.cache.set(key, data, ttl);
        this.stats.sets++;

        if (this.debug) {
          logger(`💾 Cached: ${key} (TTL: ${ttl}s)`);
        }
      } else {
        logger(`⚠️ Skipping cache for null/undefined data: ${key}`);
      }

      return data;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Get value without fetching
   */
  get(key) {
    if (!this.enabled) return undefined;

    const value = this.cache.get(key);
    if (value !== undefined) {
      this.stats.hits++;
    }
    return value;
  }

  /**
   * Set value explicitly
   */
  set(key, value, ttl = 300) {
    if (!this.enabled) return false;

    try {
      const success = this.cache.set(key, value, ttl);
      if (success) {
        this.stats.sets++;
        if (this.debug) {
          console.log(`💾 Cache set: ${key}`, this._getValueSize(value));
        }
      }
      return success;
    } catch (error) {
      this.stats.errors++;
      console.error(`❌ Cache set error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete keys by pattern or exact match
   */
  del(pattern, exactMatch = false) {
    if (!this.enabled) return 0;

    try {
      const keys = this.cache.keys();
      let keysToDelete = [];

      if (exactMatch) {
        keysToDelete = keys.filter((key) => key === pattern);
      } else {
        keysToDelete = keys.filter((key) => key.includes(pattern));
      }

      const deletedCount = keysToDelete.length;
      keysToDelete.forEach((key) => this.cache.del(key));

      if (this.debug && deletedCount > 0) {
        console.log(
          `🗑️ Deleted ${deletedCount} cache keys matching: ${pattern}`
        );
      }

      this.stats.deletes += deletedCount;
      return deletedCount;
    } catch (error) {
      this.stats.errors++;
      console.error(`❌ Cache delete error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Delete multiple patterns at once
   */
  delMultiple(patterns = []) {
    if (!this.enabled) return 0;

    let totalDeleted = 0;
    patterns.forEach((pattern) => {
      totalDeleted += this.del(pattern);
    });
    return totalDeleted;
  }

  /**
   * Clear entire cache
   */
  flush() {
    if (!this.enabled) return 0;

    const keyCount = this.cache.keys().length;
    this.cache.flushAll();
    this.stats.deletes += keyCount;

    console.log(`🔥 Flushed entire cache (${keyCount} keys)`);
    return keyCount;
  }

  /**
   * Get multiple keys at once
   */
  mget(keys) {
    if (!this.enabled) return {};

    const values = this.cache.mget(keys);

    // Update stats
    Object.values(values).forEach((value) => {
      if (value !== undefined) {
        this.stats.hits++;
      }
    });

    return values;
  }

  /**
   * Set multiple keys at once
   */
  mset(keyValuePairs, ttl = 300) {
    if (!this.enabled) return false;

    try {
      const success = this.cache.mset(
        keyValuePairs.map(([key, value]) => ({
          key,
          val: value,
          ttl,
        }))
      );

      if (success) {
        this.stats.sets += keyValuePairs.length;
        if (this.debug) {
          console.log(`💾 Bulk cached ${keyValuePairs.length} keys`);
        }
      }
      return success;
    } catch (error) {
      this.stats.errors++;
      console.error("❌ Bulk cache set error:", error);
      return false;
    }
  }

  /**
   * Get cache keys by pattern
   */
  keys(pattern = "") {
    if (!this.enabled) return [];

    const allKeys = this.cache.keys();
    if (!pattern) return allKeys;

    return allKeys.filter((key) => key.includes(pattern));
  }

  /**
   * Check if key exists
   */
  has(key) {
    if (!this.enabled) return false;
    return this.cache.has(key);
  }

  /**
   * Get TTL for a key
   */
  getTtl(key) {
    if (!this.enabled) return 0;
    return this.cache.getTtl(key);
  }

  /**
   * Get detailed cache statistics
   */
  getStats() {
    const nodeCacheStats = this.cache.getStats();

    return {
      // NodeCache stats
      keys: nodeCacheStats.keys,
      hits: nodeCacheStats.hits,
      misses: nodeCacheStats.misses,
      ksize: nodeCacheStats.ksize,
      vsize: nodeCacheStats.vsize,

      // Custom stats
      customStats: {
        ...this.stats,
        hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
        enabled: this.enabled,
        debug: this.debug,
      },

      // Performance metrics
      performance: {
        hitRatio:
          nodeCacheStats.hits / (nodeCacheStats.hits + nodeCacheStats.misses) ||
          0,
        avgRetrievalTime: null, // Could be enhanced with performance monitoring
      },

      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
    console.log("📊 Cache statistics reset");
  }

  /**
   * Enable/disable cache
   */
  setEnabled(status) {
    this.enabled = status;
    console.log(`🔧 Cache ${status ? "enabled" : "disabled"}`);
  }

  /**
   * Set debug mode
   */
  setDebug(status) {
    this.debug = status;
    console.log(`🔧 Cache debug ${status ? "enabled" : "disabled"}`);
  }

  /**
   * Get cache size in memory (approximate)
   */
  getMemoryUsage() {
    const stats = this.cache.getStats();
    return {
      keys: stats.keys,
      keySize: stats.ksize,
      valueSize: stats.vsize,
      totalSize: stats.ksize + stats.vsize,
      humanReadable: this._bytesToHumanReadable(stats.ksize + stats.vsize),
    };
  }

  /**
   * Convert bytes to human readable format
   */
  _bytesToHumanReadable(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }

  /**
   * Health check
   */
  health() {
    return {
      status: "healthy",
      enabled: this.enabled,
      keyCount: this.cache.keys().length,
      uptime: process.uptime(),
      memoryUsage: this.getMemoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}

// Create singleton instance
export const cacheService = new CacheService();

// Export class for testing/multiple instances
export { CacheService };
