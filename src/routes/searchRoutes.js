import express from "express";
import {
  searchMusic,
  getCacheStatistics,
  clearCache,
  healthCheck,
  getSuggestions,
  advancedSearch,
} from "../controllers/searchController.js";

const router = express.Router();

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search for music using YTMusicAdvanced
 *     description: Advanced search for songs, albums, videos, playlists, and artists with enhanced metadata
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query term
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [music, all, quick]
 *           default: music
 *         description: Search type - music (songs only), all (all content), quick (fast results)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results to return (max 50)
 *     responses:
 *       200:
 *         description: Successful search
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 query:
 *                   type: string
 *                 type:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                     songs:
 *                       type: array
 *                     albums:
 *                       type: array
 *                     videos:
 *                       type: array
 *                     playlists:
 *                       type: array
 *                     artists:
 *                       type: array
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     totalResults:
 *                       type: integer
 *                     responseTime:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                     searchType:
 *                       type: string
 *                     relevanceScore:
 *                       type: number
 *                 suggestions:
 *                   type: array
 *       400:
 *         description: Bad request - missing or invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get("/", searchMusic);

/**
 * @swagger
 * /search/music:
 *   get:
 *     summary: Search specifically for music
 *     description: Search optimized for music content (songs) with enhanced audio metadata
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query term
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of music results to return
 *     responses:
 *       200:
 *         description: Music search completed successfully
 */
router.get("/music", searchMusic);

/**
 * @swagger
 * /search/quick:
 *   get:
 *     summary: Quick search
 *     description: Fast search returning limited results for quick responses
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query term
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of quick results (max 10)
 *     responses:
 *       200:
 *         description: Quick search completed successfully
 */
router.get("/quick", (req, res) => {
  // Set type to quick for the search
  req.query.type = "quick";
  return searchMusic(req, res);
});

/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     description: Get autocomplete suggestions for search queries
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Partial search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of suggestions to return
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
 *                 query:
 *                   type: string
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 *                 timestamp:
 *                   type: string
 */
router.get("/suggestions", getSuggestions);

/**
 * @swagger
 * /search/advanced:
 *   post:
 *     summary: Advanced search with filters
 *     description: Perform advanced search with custom filters and parameters
 *     tags: [Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query
 *               filters:
 *                 type: object
 *                 description: Advanced search filters
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [song, video, album, artist, playlist]
 *                   duration:
 *                     type: string
 *                     enum: [short, medium, long]
 *                   year:
 *                     type: integer
 *                   sort:
 *                     type: string
 *                     enum: [relevance, rating, upload_date, view_count]
 *               limit:
 *                 type: integer
 *                 default: 25
 *                 description: Number of results
 *     responses:
 *       200:
 *         description: Advanced search completed successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Search failed
 */
router.post("/advanced", advancedSearch);

/**
 * @swagger
 * /search/health:
 *   get:
 *     summary: Health check for search service
 *     description: Check if YTMusicAdvanced search service is healthy and responsive
 *     tags: [Search]
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
 *                 cacheStats:
 *                   type: object
 *                 testSearch:
 *                   type: string
 *       503:
 *         description: Service is unhealthy
 */
router.get("/health", healthCheck);

/**
 * @swagger
 * /search/status:
 *   get:
 *     summary: Get YTMusicAdvanced client status
 *     description: Get detailed status of the YTMusicAdvanced client including endpoint health
 *     tags: [Search]
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
    console.error("❌ Status check error:", error.message);
    res.status(500).json({
      error: "Failed to get client status",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /search/cache/stats:
 *   get:
 *     summary: Get YTMusicAdvanced cache statistics
 *     description: Retrieve detailed cache statistics from YTMusicAdvanced client
 *     tags: [Cache]
 *     responses:
 *       200:
 *         description: Cache statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 cache:
 *                   type: object
 *                   properties:
 *                     cacheEnabled:
 *                       type: boolean
 *                     cacheSize:
 *                       type: number
 *                     searchCache:
 *                       type: object
 *                     initialized:
 *                       type: boolean
 *                     endpoints:
 *                       type: object
 *                 timestamp:
 *                   type: string
 */
router.get("/cache/stats", getCacheStatistics);

/**
 * @swagger
 * /search/cache:
 *   delete:
 *     summary: Clear YTMusicAdvanced search cache
 *     description: Clear all cached search results and reset cache statistics
 *     tags: [Cache]
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
router.delete("/cache", clearCache);

/**
 * @swagger
 * /search/audio/{videoId}:
 *   get:
 *     summary: Get audio information for a video
 *     description: Get enhanced audio information and metadata for a specific video
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
 *                 videoId:
 *                   type: string
 *                 title:
 *                   type: string
 *                 author:
 *                   type: string
 *                 duration:
 *                   type: number
 *                 durationFormatted:
 *                   type: string
 *                 thumbnail:
 *                   type: string
 *                 audioUrl:
 *                   type: string
 *                 quality:
 *                   type: string
 *                 enhanced:
 *                   type: object
 *                 urls:
 *                   type: object
 *       404:
 *         description: Video not found
 *       500:
 *         description: Failed to fetch audio information
 */
router.get("/audio/:videoId", async (req, res) => {
  try {
    const { getAudioUrl } = await import("../controllers/songController.js");
    return getAudioUrl(req, res);
  } catch (error) {
    console.error("❌ Audio endpoint error:", error.message);
    res.status(500).json({
      error: "Failed to process audio request",
      message: error.message,
    });
  }
});

export default router;
