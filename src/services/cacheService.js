import NodeCache from "node-cache";

class CacheService {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes
      checkperiod: 60,
      useClones: false,
      maxKeys: 1000,
    });
  }

  async getOrSet(key, fetchData, ttl = 300) {
    const cached = this.cache.get(key);
    if (cached) {
      console.log(`📋 Cache hit for: ${key}`);
      return cached;
    }

    console.log(`🔄 Cache miss for: ${key}`);
    const data = await fetchData();
    this.cache.set(key, data, ttl);
    return data;
  }

  del(pattern) {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter((key) => key.includes(pattern));
    matchingKeys.forEach((key) => this.cache.del(key));
  }

  getStats() {
    return this.cache.getStats();
  }
}

export const cacheService = new CacheService();
