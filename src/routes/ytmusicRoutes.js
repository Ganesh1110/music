import express from "express";
import {
  fetchPlaylist,
  fetchLyrics,
  searchLyricsDirect,
  getLyricsSuggestions,
} from "../controllers/ytmusicController.js";

const router = express.Router();

/**
 * @swagger
 * /ytmusic/playlist/{id}:
 *   get:
 *     summary: Get playlist by ID using YTMusicAdvanced
 *     description: Fetch YouTube Music playlist details with enhanced metadata
 *     tags: [YouTube Music]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: YouTube Music playlist ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of tracks to return
 *     responses:
 *       200:
 *         description: Playlist details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     playlistId:
 *                       type: string
 *                     title:
 *                       type: string
 *                     author:
 *                       type: string
 *                     thumbnails:
 *                       type: array
 *                     trackCount:
 *                       type: number
 *                     tracks:
 *                       type: array
 *                       items:
 *                         type: object
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     source:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *       404:
 *         description: Playlist not found
 *       500:
 *         description: Failed to fetch playlist
 */
router.get("/playlist/:id", fetchPlaylist);

/**
 * @swagger
 * /ytmusic/lyrics/{videoId}:
 *   get:
 *     summary: Get lyrics for a video with multiple fallback strategies
 *     description: Fetch lyrics using YTMusicAdvanced with Genius fallback and enhanced search
 *     tags: [YouTube Music]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: YouTube video ID
 *     responses:
 *       200:
 *         description: Lyrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 lyrics:
 *                   type: string
 *                 source:
 *                   type: string
 *                 videoDetails:
 *                   type: object
 *                   properties:
 *                     videoId:
 *                       type: string
 *                     title:
 *                       type: string
 *                     artist:
 *                       type: string
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                     attempts:
 *                       type: array
 *       404:
 *         description: Lyrics not available
 *       500:
 *         description: Failed to fetch lyrics
 */
router.get("/lyrics/:videoId", fetchLyrics);

/**
 * @swagger
 * /ytmusic/lyrics/search:
 *   get:
 *     summary: Search lyrics directly by song title and artist
 *     description: Direct lyrics search without requiring video ID
 *     tags: [YouTube Music]
 *     parameters:
 *       - in: query
 *         name: title
 *         required: true
 *         schema:
 *           type: string
 *         description: Song title
 *       - in: query
 *         name: artist
 *         schema:
 *           type: string
 *         description: Song artist (optional)
 *     responses:
 *       200:
 *         description: Lyrics search completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 lyrics:
 *                   type: string
 *                 source:
 *                   type: string
 *                 query:
 *                   type: object
 *                 metadata:
 *                   type: object
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Lyrics search failed
 */
router.get("/lyrics/search", searchLyricsDirect);

/**
 * @swagger
 * /ytmusic/lyrics/suggestions/{videoId}:
 *   get:
 *     summary: Get lyrics suggestions for a video
 *     description: Get potential lyric matches and suggestions for manual selection
 *     tags: [YouTube Music]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: YouTube video ID
 *     responses:
 *       200:
 *         description: Suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       artist:
 *                         type: string
 *                       thumbnail:
 *                         type: string
 *                       url:
 *                         type: string
 *                       query:
 *                         type: string
 *                 originalQuery:
 *                   type: object
 *                 metadata:
 *                   type: object
 *       500:
 *         description: Failed to get suggestions
 */
router.get("/lyrics/suggestions/:videoId", getLyricsSuggestions);

/**
 * @swagger
 * /ytmusic/video/{videoId}:
 *   get:
 *     summary: Get enhanced video details
 *     description: Get comprehensive video metadata using YTMusicAdvanced
 *     tags: [YouTube Music]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: YouTube video ID
 *     responses:
 *       200:
 *         description: Video details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     author:
 *                       type: string
 *                     duration:
 *                       type: number
 *                     durationFormatted:
 *                       type: string
 *                     thumbnails:
 *                       type: array
 *                     viewCount:
 *                       type: string
 *                     category:
 *                       type: string
 *                     isExplicit:
 *                       type: boolean
 *                     album:
 *                       type: string
 *                     year:
 *                       type: string
 *                     source:
 *                       type: string
 *                 metadata:
 *                   type: object
 *       404:
 *         description: Video not found
 *       500:
 *         description: Failed to fetch video details
 */
router.get("/video/:videoId", async (req, res) => {
  try {
    const { getVideoDetails } = await import("../models/ytmusicModel.js");
    const videoDetails = await getVideoDetails(req.params.videoId);

    res.json({
      success: true,
      data: videoDetails,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Video details error:", error.message);
    res.status(500).json({
      error: "Failed to fetch video details",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /ytmusic/artist:
 *   get:
 *     summary: Get artist information
 *     description: Fetch artist details and discography using YTMusicAdvanced
 *     tags: [YouTube Music]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Artist name
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of songs to return
 *     responses:
 *       200:
 *         description: Artist information retrieved successfully
 *       404:
 *         description: Artist not found
 *       500:
 *         description: Failed to fetch artist information
 */
router.get("/artist", async (req, res) => {
  try {
    const { getArtist } = await import("../models/ytmusicModel.js");
    const { name, limit = 20 } = req.query;

    if (!name) {
      return res.status(400).json({
        error: "Artist name is required",
        message: "Please provide an artist name",
      });
    }

    const artist = await getArtist(name, { limit: parseInt(limit) });

    res.json({
      success: true,
      data: artist,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Artist fetch error:", error.message);
    res.status(404).json({
      error: "Artist not found",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /ytmusic/status:
 *   get:
 *     summary: Get YTMusicAdvanced client status
 *     description: Check the status and health of YTMusicAdvanced client
 *     tags: [YouTube Music]
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: object
 *                 timestamp:
 *                   type: string
 */
router.get("/status", async (req, res) => {
  try {
    const { getClientStatus } = await import("../models/ytmusicModel.js");
    const status = await getClientStatus();

    res.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ YTMusicAdvanced status error:", error.message);
    res.status(500).json({
      error: "Failed to get client status",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /ytmusic/health:
 *   get:
 *     summary: Health check for YTMusicAdvanced service
 *     description: Check if YTMusicAdvanced service is healthy and responsive
 *     tags: [YouTube Music]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 service:
 *                   type: string
 *                 ytmusicAdvanced:
 *                   type: object
 *                 lastCheck:
 *                   type: string
 *       503:
 *         description: Service is unhealthy
 */
router.get("/health", async (req, res) => {
  try {
    const { getClientStatus, quickSearch } = await import(
      "../models/ytmusicModel.js"
    );
    const status = await getClientStatus();

    // Test with a simple search
    let testSearch = "failed";
    try {
      await quickSearch("test", 1);
      testSearch = "working";
    } catch (testError) {
      console.warn("⚠️ Health check test search failed:", testError.message);
    }

    res.json({
      status: "healthy",
      service: "ytmusic-advanced",
      ytmusicAdvanced: {
        initialized: status.initialized,
        cacheEnabled: status.cacheEnabled,
        endpoints: status.endpoints,
      },
      lastCheck: new Date().toISOString(),
      testSearch: testSearch,
    });
  } catch (error) {
    console.error("❌ YTMusicAdvanced health check failed:", error.message);
    res.status(503).json({
      status: "unhealthy",
      service: "ytmusic-advanced",
      error: error.message,
      lastCheck: new Date().toISOString(),
    });
  }
});

/**
 * @swagger
 * /ytmusic/cache:
 *   delete:
 *     summary: Clear YTMusicAdvanced cache
 *     description: Clear all cached data from YTMusicAdvanced client
 *     tags: [YouTube Music]
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 */
router.delete("/cache", async (req, res) => {
  try {
    const { clearMusicCache } = await import("../models/ytmusicModel.js");
    await clearMusicCache();

    res.json({
      success: true,
      message: "YTMusicAdvanced cache cleared successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Cache clear error:", error.message);
    res.status(500).json({
      error: "Failed to clear cache",
      message: error.message,
    });
  }
});

export default router;
