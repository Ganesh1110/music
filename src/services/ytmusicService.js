import YTMusicAdvanced from "ytmusic-advanced";
import EnhancedAudioExtractor from "./EnhancedAudioExtractor.js";

class YTMusicService {
  constructor() {
    this.client = null;
    this.audioExtractor = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return this.client;

    try {
      // Initialize YTMusicAdvanced client
      this.client = await YTMusicAdvanced.initialize({
        cacheEnabled: true,
        timeout: 20000,
        maxRetries: 3,
        retryDelay: 1000,
        cacheTTL: 300000,
      });

      // Initialize Enhanced Audio Extractor with proxy support
      this.audioExtractor = new EnhancedAudioExtractor({
        cacheTTL: 300000,
        maxRetries: 5,
        retryDelay: 1000,
      });

      await this.audioExtractor.initialize();

      this.initialized = true;
      console.log("✅ YTMusicService fully initialized with proxy support");
      return this.client;
    } catch (error) {
      console.error("❌ YTMusicService initialization failed:", error);
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

  /**
   * ENHANCED: Get audio URLs with proxy rotation and multiple client strategies
   */
  async getAudioURLs(videoId, options = {}) {
    await this.initialize();

    console.log(`🎵 Getting audio URLs for: ${videoId} (Enhanced method)`);

    try {
      // Use enhanced audio extractor with proxy support
      const result = await this.audioExtractor.getAudioURLs(videoId, options);

      if (result.success) {
        console.log(`✅ Audio URLs extracted successfully for ${videoId}`);
        console.log(`📊 Found ${result.formats.length} audio formats`);
        console.log(
          `🎧 Best quality: ${result.bestAudio.audioQuality} (${Math.round(
            result.bestAudio.bitrate / 1000
          )}kbps)`
        );
      } else {
        console.error(
          `❌ Audio extraction failed for ${videoId}:`,
          result.error
        );
      }

      return result;
    } catch (error) {
      console.error(`❌ Audio extraction error for ${videoId}:`, error.message);

      return {
        success: false,
        videoId,
        error: error.message,
        extractedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Get audio stream with quality selection
   */
  async getAudioStream(videoId, quality = "high") {
    const audioData = await this.getAudioURLs(videoId);

    if (!audioData.success || !audioData.bestAudio) {
      throw new Error(`Failed to get audio stream: ${audioData.error}`);
    }

    // Select quality
    let selectedFormat;
    switch (quality) {
      case "high":
        selectedFormat =
          audioData.audioByQuality.high[0] || audioData.bestAudio;
        break;
      case "medium":
        selectedFormat =
          audioData.audioByQuality.medium[0] || audioData.bestAudio;
        break;
      case "low":
        selectedFormat = audioData.audioByQuality.low[0] || audioData.bestAudio;
        break;
      default:
        selectedFormat = audioData.bestAudio;
    }

    return {
      success: true,
      videoId,
      url: selectedFormat.url,
      quality: selectedFormat.quality,
      bitrate: selectedFormat.bitrate,
      mimeType: selectedFormat.mimeType,
      codec: selectedFormat.codec,
      container: selectedFormat.container,
      expiresAt: audioData.expiresAt,
      metadata: {
        title: audioData.title,
        author: audioData.author,
        duration: audioData.duration,
        thumbnail: audioData.thumbnail,
      },
    };
  }

  /**
   * Get multiple audio URLs (batch processing)
   */
  async getMultipleAudioURLs(videoIds, options = {}) {
    await this.initialize();

    const { delay = 1000, maxConcurrent = 3 } = options;
    const results = [];

    // Process in chunks
    for (let i = 0; i < videoIds.length; i += maxConcurrent) {
      const chunk = videoIds.slice(i, i + maxConcurrent);

      const chunkResults = await Promise.all(
        chunk.map(async (videoId) => {
          try {
            return await this.getAudioURLs(videoId);
          } catch (error) {
            return {
              success: false,
              videoId,
              error: error.message,
            };
          }
        })
      );

      results.push(...chunkResults);

      // Rate limiting delay
      if (i + maxConcurrent < videoIds.length) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return {
      success: true,
      total: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  // Utility methods
  async getSuggestions(query, limit = 5) {
    const client = await this.initialize();
    return await client.getSuggestions(query, limit);
  }

  async getStatus() {
    const client = await this.initialize();
    const clientStatus = client.getStatus();
    const audioStats = this.audioExtractor
      ? this.audioExtractor.getStats()
      : null;

    return {
      ...clientStatus,
      enhancedAudio: {
        enabled: !!this.audioExtractor,
        stats: audioStats,
      },
    };
  }

  async clearCache() {
    const client = await this.initialize();
    await client.clearCache();

    if (this.audioExtractor) {
      this.audioExtractor.clearCache();
    }

    console.log("✅ All caches cleared");
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

      // Test audio extraction
      let audioTest = { working: false };
      try {
        // Use a known working video ID for testing
        const testAudio = await this.getAudioURLs("dQw4w9WgXcQ");
        audioTest = {
          working: testAudio.success,
          formats: testAudio.formats?.length || 0,
        };
      } catch (error) {
        audioTest.error = error.message;
      }

      return {
        healthy: true,
        clientStatus: status,
        testSearch: testSearch.success,
        audioExtraction: audioTest,
        proxyStats: this.audioExtractor?.getStats()?.proxy,
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

  /**
   * Refresh proxy list
   */
  async refreshProxies() {
    if (this.audioExtractor && this.audioExtractor.proxyManager) {
      await this.audioExtractor.proxyManager.refresh();
      console.log("✅ Proxy list refreshed");
    }
  }

  /**
   * Get proxy statistics
   */
  getProxyStats() {
    if (this.audioExtractor && this.audioExtractor.proxyManager) {
      return this.audioExtractor.proxyManager.getStats();
    }
    return null;
  }
}

// Singleton instance
export default new YTMusicService();
