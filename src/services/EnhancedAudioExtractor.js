import axios from "axios";
import ProxyManager from "./ProxyManager.js";

class EnhancedAudioExtractor {
  constructor(options = {}) {
    // Initialize proxy manager with auto-refresh
    this.proxyManager = new ProxyManager({
      autoRefresh: true,
      autoRefreshInterval: 3600000, // 1 hour
      maxFailures: 3,
      testTimeout: 5000,
    });

    this.initialized = false;
    this.cache = new Map();
    this.cacheTTL = options.cacheTTL || 300000; // 5 minutes
    this.maxRetries = options.maxRetries || 5;
    this.retryDelay = options.retryDelay || 1000;

    // Multiple client configurations for different strategies
    this.clients = {
      android: {
        name: "ANDROID",
        version: "19.09.37",
        userAgent:
          "com.google.android.youtube/19.09.37 (Linux; U; Android 13) gzip",
        apiKey: "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
      },
      androidMusic: {
        name: "ANDROID_MUSIC",
        version: "6.42.52",
        userAgent:
          "com.google.android.apps.youtube.music/6.42.52 (Linux; U; Android 13) gzip",
        apiKey: "AIzaSyC9XL3ZjWddXyaSX8Ynf-ipym86BxOc7fI",
      },
      ios: {
        name: "IOS",
        version: "19.09.3",
        userAgent:
          "com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)",
        apiKey: "AIzaSyB-63vPrdThhKuerbB2N_l7Kwwcxj6yUAc",
      },
      web: {
        name: "WEB",
        version: "2.20241220.01.00",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        apiKey: "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
      },
      tv: {
        name: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
        version: "2.0",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        apiKey: "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
      },
    };
  }

  /**
   * Initialize proxy manager
   */
  async initialize() {
    if (this.initialized) return;

    console.log("🚀 Initializing Enhanced Audio Extractor...");
    await this.proxyManager.initialize(true); // Validate all proxies
    this.initialized = true;
    console.log("✅ Enhanced Audio Extractor ready");
  }

  /**
   * Get audio URLs with automatic proxy rotation and retry
   */
  async getAudioURLs(videoId, options = {}) {
    await this.initialize();

    const cacheKey = `audio:${videoId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit for ${videoId}`);
      return cached;
    }

    console.log(`🎵 Extracting audio for: ${videoId}`);

    // Try different clients in order of reliability
    const clientOrder = ["androidMusic", "android", "ios", "tv", "web"];
    let lastError;

    for (const clientType of clientOrder) {
      try {
        const result = await this.extractWithClient(videoId, clientType);

        if (result.success && result.formats && result.formats.length > 0) {
          console.log(`✅ Success with ${clientType} client`);
          this.setCache(cacheKey, result);
          return result;
        }
      } catch (error) {
        console.warn(`⚠️ ${clientType} client failed:`, error.message);
        lastError = error;
      }
    }

    // All clients failed
    return {
      success: false,
      error: lastError?.message || "All extraction methods failed",
      videoId,
    };
  }

  /**
   * Extract audio using specific client with proxy rotation
   */
  async extractWithClient(videoId, clientType, retryCount = 0) {
    const client = this.clients[clientType];
    const url = this.getPlayerUrl(client.apiKey);

    const payload = this.buildPayload(videoId, client);

    // Try with proxy
    let proxy = this.proxyManager.getNextProxy();
    let response;

    try {
      if (proxy) {
        console.log(`🔄 Trying with proxy: ${proxy.host}:${proxy.port}`);
        const proxyAgent = this.proxyManager.getProxyAgent(proxy);

        response = await axios.post(url, payload, {
          httpsAgent: proxyAgent,
          timeout: 15000,
          headers: this.getHeaders(client),
          validateStatus: () => true,
        });

        if (response.status === 200) {
          this.proxyManager.markProxySuccess(proxy);
        } else {
          this.proxyManager.markProxyFailed(proxy);
          throw new Error(`HTTP ${response.status}`);
        }
      } else {
        // Try without proxy as last resort
        console.log(`🔄 Trying without proxy (direct connection)`);
        response = await axios.post(url, payload, {
          timeout: 15000,
          headers: this.getHeaders(client),
          validateStatus: () => true,
        });
      }

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return this.processPlayerResponse(response.data, videoId, clientType);
    } catch (error) {
      if (proxy) {
        this.proxyManager.markProxyFailed(proxy);
      }

      // Retry with different proxy
      if (retryCount < this.maxRetries) {
        console.log(`🔄 Retry ${retryCount + 1}/${this.maxRetries}`);
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.extractWithClient(videoId, clientType, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Build request payload for YouTube API
   */
  buildPayload(videoId, client) {
    const payload = {
      videoId,
      context: {
        client: {
          clientName: client.name,
          clientVersion: client.version,
          hl: "en",
          gl: "US",
        },
      },
      contentCheckOk: true,
      racyCheckOk: true,
    };

    // Add client-specific fields
    if (client.name.includes("ANDROID")) {
      payload.context.client.androidSdkVersion = 33;
    } else if (client.name.includes("IOS")) {
      payload.context.client.deviceMake = "Apple";
      payload.context.client.deviceModel = "iPhone14,3";
    } else if (client.name === "WEB") {
      payload.playbackContext = {
        contentPlaybackContext: {
          html5Preference: "HTML5_PREF_WANTS",
          signatureTimestamp: Math.floor(Date.now() / 1000),
        },
      };
    }

    return payload;
  }

  /**
   * Get request headers
   */
  getHeaders(client) {
    return {
      "Content-Type": "application/json",
      "User-Agent": client.userAgent,
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Origin: "https://www.youtube.com",
      Referer: "https://www.youtube.com/",
    };
  }

  /**
   * Get player URL
   */
  getPlayerUrl(apiKey) {
    return `https://www.youtube.com/youtubei/v1/player?key=${apiKey}&prettyPrint=false`;
  }

  /**
   * Process player response and extract audio formats
   */
  processPlayerResponse(data, videoId, clientType) {
    if (!data.streamingData) {
      return {
        success: false,
        error: "No streaming data available",
        videoId,
      };
    }

    const formats = [
      ...(data.streamingData.formats || []),
      ...(data.streamingData.adaptiveFormats || []),
    ];

    const audioFormats = formats
      .filter((f) => f.mimeType && f.mimeType.includes("audio/"))
      .map((f) => ({
        itag: f.itag,
        url: f.url,
        mimeType: f.mimeType,
        bitrate: f.bitrate || f.averageBitrate,
        audioQuality: f.audioQuality,
        audioSampleRate: f.audioSampleRate,
        audioChannels: f.audioChannels,
        contentLength: f.contentLength,
        quality: this.determineQuality(f),
        codec: this.extractCodec(f.mimeType),
        container: this.extractContainer(f.mimeType),
      }))
      .filter((f) => f.url); // Only keep formats with URLs

    if (audioFormats.length === 0) {
      return {
        success: false,
        error: "No audio formats with URLs found",
        videoId,
      };
    }

    // Sort by bitrate (highest first)
    audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    return {
      success: true,
      videoId,
      clientType,
      title: data.videoDetails?.title,
      author: data.videoDetails?.author,
      duration: parseInt(data.videoDetails?.lengthSeconds) || 0,
      thumbnail: this.getBestThumbnail(
        data.videoDetails?.thumbnail?.thumbnails
      ),
      formats: audioFormats,
      bestAudio: audioFormats[0],
      audioByQuality: {
        high: audioFormats.filter((f) => (f.bitrate || 0) > 160000),
        medium: audioFormats.filter(
          (f) => (f.bitrate || 0) >= 96000 && (f.bitrate || 0) <= 160000
        ),
        low: audioFormats.filter((f) => (f.bitrate || 0) < 96000),
      },
      expiresAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      extractedAt: new Date().toISOString(),
    };
  }

  /**
   * Helper: Determine quality level based on bitrate
   */
  determineQuality(format) {
    const bitrate = format.bitrate || format.averageBitrate || 0;
    if (bitrate > 192000) return "high";
    if (bitrate > 96000) return "medium";
    return "low";
  }

  /**
   * Helper: Extract codec from MIME type
   */
  extractCodec(mimeType) {
    const match = mimeType?.match(/codecs="([^"]+)"/);
    return match ? match[1] : "unknown";
  }

  /**
   * Helper: Extract container from MIME type
   */
  extractContainer(mimeType) {
    const match = mimeType?.match(/^audio\/([^;]+)/);
    return match ? match[1] : "unknown";
  }

  /**
   * Helper: Get best thumbnail
   */
  getBestThumbnail(thumbnails) {
    if (!thumbnails || thumbnails.length === 0) return null;
    return thumbnails.reduce((best, current) => {
      const bestSize = (best.width || 0) * (best.height || 0);
      const currentSize = (current.width || 0) * (current.height || 0);
      return currentSize > bestSize ? current : best;
    });
  }

  /**
   * Cache management: Get from cache
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    this.cache.delete(key);
    return null;
  }

  /**
   * Cache management: Set cache
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Auto-cleanup if cache gets too large
    if (this.cache.size > 100) {
      const oldestKeys = Array.from(this.cache.keys()).slice(0, 20);
      oldestKeys.forEach((k) => this.cache.delete(k));
    }
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
    console.log("🧹 Audio cache cleared");
  }

  /**
   * Delay helper for retry logic
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      cache: {
        size: this.cache.size,
        ttl: this.cacheTTL,
      },
      proxy: this.proxyManager.getStats(),
    };
  }
}

export default EnhancedAudioExtractor;
