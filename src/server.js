import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

// Routes
import searchRoutes from "./routes/searchRoutes.js";
import audioRoutes from "./routes/audioRoutes.js";
import lyricsRoutes from "./routes/lyricsRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";

// Services
import ytmusicService from "./services/ytmusicService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize YTMusicAdvanced on startup
(async () => {
  try {
    await ytmusicService.initialize();
    console.log("✅ YTMusicAdvanced service ready");
  } catch (error) {
    console.error("❌ YTMusicAdvanced initialization failed:", error.message);
  }
})();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Routes
app.get(
  "/api/search",
  asyncHandler(async (req, res) => {
    const {
      q: query,
      limit = 10,
      preferOfficial = true,
      minRelevanceScore = 0.5,
    } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
    }

    console.log(`🔍 Search request: "${query}"`);

    const results = await ytmusicService.searchMusic(query, {
      limit: parseInt(limit),
      preferOfficial: preferOfficial === "true",
      minRelevanceScore: parseFloat(minRelevanceScore),
    });

    res.json({
      success: true,
      query,
      results: results.items.map((item) => ({
        id: item.videoId,
        title: item.title,
        artist: item.artists?.[0]?.name || "Unknown",
        album: item.album?.name || null,
        duration: item.duration,
        thumbnail: item.thumbnails?.[0]?.url || null,
        scores: {
          quality: item.scores?.quality?.toFixed(2),
          relevance: item.scores?.relevance?.toFixed(2),
          total: item.totalScore?.toFixed(2),
        },
      })),
      total: results.total,
    });
  })
);
app.use("/api/audio", audioRoutes);
app.use("/api/lyrics", lyricsRoutes);
app.use("/api/health", healthRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Music API Server",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: {
      search: "/api/search",
      audio: "/api/audio",
      lyrics: "/api/lyrics",
      health: "/api/health",
    },
  });
});

app.get(
  "/api/stream/:videoId",
  asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { quality = "best" } = req.query;

    console.log(`🎵 Stream request: ${videoId} (quality: ${quality})`);

    const audioData = await ytmusicService.getAudioURLs(videoId);

    if (!audioData.success) {
      return res.status(404).json({
        success: false,
        error: audioData.error || "Failed to extract audio URL",
      });
    }

    // Select quality
    let selectedFormat;
    switch (quality) {
      case "high":
        selectedFormat = audioData.audioByQuality.high || audioData.bestAudio;
        break;
      case "medium":
        selectedFormat = audioData.audioByQuality.medium || audioData.bestAudio;
        break;
      case "low":
        selectedFormat = audioData.audioByQuality.low || audioData.bestAudio;
        break;
      default:
        selectedFormat = audioData.bestAudio;
    }

    res.json({
      success: true,
      videoId,
      stream_url: selectedFormat.url,
      expires_at: audioData.expiresAt,
      metadata: {
        title: audioData.title,
        author: audioData.author,
        duration: audioData.duration,
        thumbnail: audioData.thumbnail?.url || null,
      },
      quality: {
        selected: selectedFormat.quality,
        bitrate: selectedFormat.bitrate,
        codec: selectedFormat.codec,
        sampleRate: selectedFormat.sampleRate,
      },
      available_qualities: {
        high: audioData.audioByQuality.high
          ? {
              bitrate: audioData.audioByQuality.high.bitrate,
              quality: audioData.audioByQuality.high.quality,
            }
          : null,
        medium: audioData.audioByQuality.medium
          ? {
              bitrate: audioData.audioByQuality.medium.bitrate,
              quality: audioData.audioByQuality.medium.quality,
            }
          : null,
        low: audioData.audioByQuality.low
          ? {
              bitrate: audioData.audioByQuality.low.bitrate,
              quality: audioData.audioByQuality.low.quality,
            }
          : null,
      },
    });
  })
);

// Proxy stream endpoint (to hide direct URL)
app.get(
  "/api/proxy/:videoId",
  asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { quality = "best" } = req.query;

    console.log(`🔄 Proxy stream request: ${videoId}`);

    const audioData = await ytmusicService.getAudioURLs(videoId);

    if (!audioData.success) {
      return res.status(404).json({
        success: false,
        error: "Failed to get audio URL",
      });
    }

    // Select quality
    let selectedFormat;
    switch (quality) {
      case "high":
        selectedFormat = audioData.audioByQuality.high || audioData.bestAudio;
        break;
      case "medium":
        selectedFormat = audioData.audioByQuality.medium || audioData.bestAudio;
        break;
      case "low":
        selectedFormat = audioData.audioByQuality.low || audioData.bestAudio;
        break;
      default:
        selectedFormat = audioData.bestAudio;
    }

    // Stream the audio through our server
    const https = await import("https");
    const { URL } = await import("url");

    const audioUrl = new URL(selectedFormat.url);

    const options = {
      hostname: audioUrl.hostname,
      port: 443,
      path: audioUrl.pathname + audioUrl.search,
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Range: req.headers.range || "bytes=0-",
      },
    };

    const proxyReq = https.request(options, (proxyRes) => {
      // Set appropriate headers
      res.setHeader("Content-Type", selectedFormat.mimeType || "audio/mp4");
      res.setHeader("Content-Length", proxyRes.headers["content-length"]);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Cache-Control", "public, max-age=3600");

      if (proxyRes.headers["content-range"]) {
        res.setHeader("Content-Range", proxyRes.headers["content-range"]);
        res.status(206);
      }

      proxyRes.pipe(res);
    });

    proxyReq.on("error", (error) => {
      console.error("Proxy error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to proxy audio stream",
      });
    });

    req.on("close", () => {
      proxyReq.destroy();
    });

    proxyReq.end();
  })
);

// Search with audio URLs
app.get(
  "/api/search-with-audio",
  asyncHandler(async (req, res) => {
    const { q: query, limit = 5, maxAudioFetches = 3 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
    }

    console.log(`🔍🎵 Search with audio: "${query}"`);

    const results = await ytmusicService.searchWithAudio(query, {
      limit: parseInt(limit),
      maxAudioFetches: parseInt(maxAudioFetches),
    });

    res.json({
      success: true,
      query,
      results: results.items.map((item) => ({
        id: item.videoId,
        title: item.title,
        artist: item.artists?.[0]?.name || "Unknown",
        duration: item.duration,
        thumbnail: item.thumbnails?.[0]?.url || null,
        score: item.totalScore?.toFixed(2),
        audioData: item.audioData
          ? {
              url: item.audioData.directURL,
              quality: item.audioData.quality,
              bitrate: item.audioData.bitrate,
              expiresAt: item.audioData.expiresAt,
            }
          : null,
      })),
    });
  })
);

// Advanced search endpoint
app.get(
  "/api/search/advanced",
  asyncHandler(async (req, res) => {
    const {
      q: query,
      contentType = "all",
      minDuration = 0,
      maxDuration = 999999,
      quality = "all",
      sortBy = "relevance",
    } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
    }

    console.log(`🔍✨ Advanced search: "${query}"`);

    const results = await ytmusicService.advancedSearch(query, {
      contentType,
      minDuration: parseInt(minDuration),
      maxDuration: parseInt(maxDuration),
      quality,
      sortBy,
    });

    res.json({
      success: true,
      query,
      filters: results.filters,
      results: results.items.map((item) => ({
        id: item.videoId,
        title: item.title,
        artist: item.artists?.[0]?.name || "Unknown",
        duration: item.duration,
        thumbnail: item.thumbnails?.[0]?.url || null,
        scores: item.scores,
      })),
    });
  })
);

// Quick search endpoint
app.get(
  "/api/search/quick",
  asyncHandler(async (req, res) => {
    const { q: query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
    }

    console.log(`⚡ Quick search: "${query}"`);

    const results = await ytmusicService.quickSearch(query);

    res.json({
      success: true,
      query,
      results: results.items.map((item) => ({
        id: item.videoId,
        title: item.title,
        artist: item.artists?.[0]?.name || "Unknown",
        duration: item.duration,
        thumbnail: item.thumbnails?.[0]?.url || null,
      })),
    });
  })
);

// Refresh audio URL endpoint (for expired URLs)
app.get(
  "/api/refresh/:videoId",
  asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    console.log(`🔄 Refresh audio URL: ${videoId}`);

    // Clear cache for this video
    await ytmusicService.clearCache();

    // Get fresh URL
    const audioData = await ytmusicService.getAudioURLs(videoId);

    if (!audioData.success) {
      return res.status(404).json({
        success: false,
        error: "Failed to refresh audio URL",
      });
    }

    res.json({
      success: true,
      videoId,
      stream_url: audioData.bestAudio.url,
      expires_at: audioData.expiresAt,
      refreshed_at: new Date().toISOString(),
    });
  })
);

// Clear cache endpoint
app.post(
  "/api/cache/clear",
  asyncHandler(async (req, res) => {
    await ytmusicService.clearCache();

    res.json({
      success: true,
      message: "Cache cleared successfully",
    });
  })
);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Error:", error);

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
    }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(
    `🔍 Search API: http://localhost:${PORT}/api/search?query=shape+of+you`
  );
  console.log(`🎵 Audio API: http://localhost:${PORT}/api/audio/JGwWNGJdvx8`);
});

/**
 * Enhanced audio streaming proxy with better YouTube compatibility
 */
app.get("/api/youtube/stream", async (req, res) => {
  try {
    const audioUrl = req.query.url;

    if (!audioUrl) {
      return res.status(400).json({
        success: false,
        error: "URL parameter is required",
      });
    }

    console.log(
      `🎧 Streaming audio via proxy: ${audioUrl.substring(0, 100)}...`
    );

    // Enhanced headers to mimic different clients
    const headers = {
      "User-Agent": getRandomUserAgent(),
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "identity", // Important: don't use gzip for audio
      Range: req.headers.range || "bytes=0-",
      Referer: "https://www.youtube.com/",
      Origin: "https://www.youtube.com",
    };

    const response = await fetch(audioUrl, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Set appropriate headers for audio streaming
    res.set({
      "Content-Type": response.headers.get("content-type") || "audio/webm",
      "Content-Length": response.headers.get("content-length"),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    });

    // Handle range requests for seeking
    if (response.status === 206) {
      res.status(206);
      res.set("Content-Range", response.headers.get("content-range"));
    }

    // Stream the audio data
    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      res.write(value);
    }

    res.end();
  } catch (error) {
    console.error("❌ Stream proxy error:", error.message);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Stream failed",
        message: error.message,
        suggestion: "Try refreshing the audio URL",
      });
    }
  }
});

// Helper function to get random user agents
function getRandomUserAgent() {
  const userAgents = [
    // Android devices
    "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 12; SM-S908E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36",

    // iOS devices
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1",

    // Desktop browsers
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
  ];

  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
