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

// Routes
app.use("/api/search", searchRoutes);
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
