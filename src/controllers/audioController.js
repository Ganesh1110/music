import ytmusicService from "../services/ytmusicService.js";

/**
 * Get audio URLs with enhanced proxy support
 */
export const getAudioURLs = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({
        success: false,
        error: "Valid Video ID is required (11 characters)",
      });
    }

    console.log(`🎵 Audio request for: ${videoId}`);
    const audioData = await ytmusicService.getAudioURLs(videoId);

    if (!audioData.success) {
      return res.status(404).json({
        success: false,
        error: "Audio extraction failed",
        message: audioData.error,
        videoId: videoId,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      videoId: videoId,
      title: audioData.title,
      author: audioData.author,
      duration: audioData.duration,
      thumbnail: audioData.thumbnail,
      formats: audioData.formats.map((f) => ({
        itag: f.itag,
        url: f.url,
        mimeType: f.mimeType,
        bitrate: f.bitrate,
        audioQuality: f.audioQuality,
        quality: f.quality,
        codec: f.codec,
        container: f.container,
        sampleRate: f.audioSampleRate,
        channels: f.audioChannels,
        contentLength: f.contentLength,
      })),
      bestAudio: audioData.bestAudio,
      audioByQuality: audioData.audioByQuality,
      expiresAt: audioData.expiresAt,
      extractedAt: audioData.extractedAt,
      clientType: audioData.clientType,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Audio URL error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get audio URLs",
      message: error.message,
      videoId: req.params.videoId,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get audio stream with quality selection
 */
export const getAudioStream = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { quality = "high" } = req.query;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: "Video ID is required",
      });
    }

    console.log(`🎧 Stream request: ${videoId} [${quality}]`);
    const stream = await ytmusicService.getAudioStream(videoId, quality);

    res.json({
      success: true,
      videoId: videoId,
      url: stream.url,
      quality: stream.quality,
      bitrate: stream.bitrate,
      mimeType: stream.mimeType,
      codec: stream.codec,
      container: stream.container,
      metadata: stream.metadata,
      expiresAt: stream.expiresAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Audio stream error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get audio stream",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Batch audio URL extraction
 */
export const getBatchAudioURLs = async (req, res) => {
  try {
    const { videoIds } = req.body;

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "videoIds array is required",
      });
    }

    if (videoIds.length > 20) {
      return res.status(400).json({
        success: false,
        error: "Maximum 20 video IDs per batch request",
      });
    }

    console.log(`📦 Batch audio request for ${videoIds.length} videos`);

    const results = await ytmusicService.getMultipleAudioURLs(videoIds, {
      delay: 1000,
      maxConcurrent: 3,
    });

    res.json({
      success: true,
      total: results.total,
      successful: results.successful,
      failed: results.failed,
      results: results.results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Batch audio error:", error.message);
    res.status(500).json({
      success: false,
      error: "Batch audio extraction failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Proxy statistics endpoint
 */
export const getProxyStats = async (req, res) => {
  try {
    const stats = ytmusicService.getProxyStats();

    if (!stats) {
      return res.json({
        success: true,
        message: "Proxy system not initialized or disabled",
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      stats: {
        total: stats.total,
        working: stats.working,
        failed: stats.failed,
        proxies: stats.proxies.map((p) => ({
          proxy: p.proxy,
          successes: p.successes,
          failures: p.failures,
          status: p.status,
          successRate: p.successes / (p.successes + p.failures) || 0,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Proxy stats error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get proxy statistics",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Refresh proxy list manually
 */
export const refreshProxies = async (req, res) => {
  try {
    console.log("🔄 Manual proxy refresh requested");
    await ytmusicService.refreshProxies();

    const stats = ytmusicService.getProxyStats();

    res.json({
      success: true,
      message: "Proxy list refreshed successfully",
      stats: {
        total: stats.total,
        working: stats.working,
        failed: stats.failed,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Proxy refresh error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to refresh proxy list",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Test audio extraction with detailed logging
 */
export const testAudioExtraction = async (req, res) => {
  try {
    const { videoId = "dQw4w9WgXcQ" } = req.query;

    console.log(`🧪 Testing audio extraction for: ${videoId}`);

    const startTime = Date.now();
    const result = await ytmusicService.getAudioURLs(videoId);
    const duration = Date.now() - startTime;

    res.json({
      success: true,
      test: {
        videoId,
        duration: `${duration}ms`,
        result: result.success ? "PASSED" : "FAILED",
        formats: result.formats?.length || 0,
        hasPlayableUrl: !!result.bestAudio?.url,
        clientType: result.clientType,
        error: result.error || null,
      },
      audioData: result,
      proxyStats: ytmusicService.getProxyStats(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    res.status(500).json({
      success: false,
      error: "Test failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Health check for audio service
 */
export const audioHealthCheck = async (req, res) => {
  try {
    const health = await ytmusicService.healthCheck();

    res.json({
      success: true,
      healthy: health.healthy,
      audioExtraction: health.audioExtraction,
      proxyStats: health.proxyStats,
      timestamp: health.timestamp,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Direct streaming endpoint (proxies the audio)
 */
export const streamAudio = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { quality = "high" } = req.query;

    if (!videoId) {
      return res.status(400).json({
        error: "Video ID is required",
      });
    }

    console.log(`🎵 Direct streaming: ${videoId}`);

    // Get fresh audio URL
    const audioData = await ytmusicService.getAudioStream(videoId, quality);

    if (!audioData.success) {
      return res.status(404).json({
        error: "Audio not available",
      });
    }

    // Fetch and stream the audio
    const fetch = (await import("node-fetch")).default;
    const audioResponse = await fetch(audioData.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Range: req.headers.range || "bytes=0-",
        Referer: "https://www.youtube.com/",
      },
    });

    // Set appropriate headers
    res.setHeader("Content-Type", audioData.mimeType);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=3600");

    if (audioResponse.headers.get("content-length")) {
      res.setHeader(
        "Content-Length",
        audioResponse.headers.get("content-length")
      );
    }

    if (audioResponse.status === 206) {
      res.status(206);
      res.setHeader(
        "Content-Range",
        audioResponse.headers.get("content-range")
      );
    }

    // Stream the audio
    audioResponse.body.pipe(res);
  } catch (error) {
    console.error("❌ Streaming error:", error.message);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Streaming failed",
        message: error.message,
      });
    }
  }
};
