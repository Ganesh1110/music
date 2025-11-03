import YTMusicAdvanced from "ytmusic-advanced";

class YTMusicService {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return this.client;

    try {
      this.client = await YTMusicAdvanced.initialize({
        cacheEnabled: true,
        language: "en",
        country: "US",
        timeout: 30000,
        maxRetries: 3,
      });

      this.initialized = true;
      console.log("✅ YTMusicAdvanced enhanced client initialized");
      return this.client;
    } catch (error) {
      console.error("❌ YTMusicAdvanced initialization failed:", error);
      throw error;
    }
  }

  // Enhanced search methods
  async searchMusic(query, options = {}) {
    const client = await this.initialize();
    return await client.searchMusic(query, options);
  }

  async searchWithAudio(query, options = {}) {
    const client = await this.initialize();
    return await client.searchWithAudio(query, options);
  }

  async quickSearch(query, options = {}) {
    const client = await this.initialize();
    return await client.quickSearch(query, options);
  }

  async advancedSearch(query, filters = {}) {
    const client = await this.initialize();
    return await client.advancedSearch(query, filters);
  }

  // Audio extraction methods
  async getAudioURLs(videoId, options = {}) {
    const client = await this.initialize();
    return await client.getAudioURLs(videoId, options);
  }

  async getAudioStream(videoId, quality = "high") {
    const client = await this.initialize();
    return await client.getAudioStream(videoId, quality);
  }

  async getMultipleAudioURLs(videoIds, options = {}) {
    const client = await this.initialize();
    return await client.getMultipleAudioURLs(videoIds, options);
  }

  // Utility methods
  async getSuggestions(query, limit = 5) {
    const client = await this.initialize();
    return await client.getSuggestions(query, limit);
  }

  async getStatus() {
    const client = await this.initialize();
    return client.getStatus();
  }

  async clearCache() {
    const client = await this.initialize();
    await client.clearCache();
    console.log("✅ YTMusicAdvanced cache cleared");
  }

  // Mode switching
  async switchMode(mode) {
    const client = await this.initialize();
    client.switchMode(mode);
    return this;
  }

  // Health check
  async healthCheck() {
    try {
      const client = await this.initialize();
      const status = client.getStatus();

      // Test search
      const testSearch = await client.quickSearch("test", { limit: 1 });

      return {
        healthy: true,
        clientStatus: status,
        testSearch: testSearch.success,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Singleton instance
export default new YTMusicService();
