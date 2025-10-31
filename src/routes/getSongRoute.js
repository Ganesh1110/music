import express from "express";
import {
  getAudioUrl,
  searchSongs,
  getSuggestions,
} from "../controllers/songController.js";

const router = express.Router();

/**
 * @swagger
 * /song/play/{videoId}:
 *   get:
 *     summary: Get audio stream URL (Enhanced with YTMusicAdvanced)
 *     description: Get enhanced audio information with music metadata
 *     tags: [Audio]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: YouTube video ID
 *     responses:
 *       200:
 *         description: Audio information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 title:
 *                   type: string
 *                 author:
 *                   type: string
 *                 duration:
 *                   type: number
 *                 durationFormatted:
 *                   type: string
 *                 audioUrl:
 *                   type: string
 *                 enhanced:
 *                   type: object
 *                   properties:
 *                     isOfficial:
 *                       type: boolean
 *                     qualityScore:
 *                       type: number
 *                     relevanceScore:
 *                       type: number
 *       400:
 *         description: Invalid video ID
 *       404:
 *         description: Video not found
 *       500:
 *         description: Failed to fetch audio information
 */
router.get("/play/:videoId", getAudioUrl);

/**
 * @swagger
 * /song/search:
 *   get:
 *     summary: Search for songs with enhanced filtering
 *     description: Search YouTube Music with relevance scoring and music-specific filtering
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (song name, artist, etc.)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [music, quick, all]
 *         description: Search type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results to return
 *     responses:
 *       200:
 *         description: Search results with enhanced metadata
 *       400:
 *         description: Invalid search parameters
 *       500:
 *         description: Search failed
 */
router.get("/search", searchSongs);

/**
 * @swagger
 * /song/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     description: Get related search suggestions for a query
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query to get suggestions for
 *     responses:
 *       200:
 *         description: Search suggestions
 *       400:
 *         description: Query is required
 *       500:
 *         description: Failed to get suggestions
 */
router.get("/suggestions", getSuggestions);

/**
 * @swagger
 * /ytmusic/video/{videoId}:
 *   get:
 *     summary: Get video details directly by ID
 *     description: Direct video lookup without search
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
 *       404:
 *         description: Video not found
 */
router.get("/video/:videoId", async (req, res) => {
  try {
    const { getVideoById } = await import("../models/ytmusicModel.js");
    const result = await getVideoById(req.params.videoId);

    if (result.success) {
      res.json({
        success: true,
        data: result.video,
        metadata: {
          source: result.source,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("❌ Video lookup error:", error.message);
    res.status(500).json({
      error: "Failed to lookup video",
      message: error.message,
    });
  }
});

export default router;
