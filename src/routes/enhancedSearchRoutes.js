import express from "express";
import {
  enhancedSearch,
  getSearchStats,
  clearSearchCache,
  getSearchSuggestions,
  advancedFilteredSearch,
} from "../controllers/enhancedSearchController.js";

const router = express.Router();

/**
 * @swagger
 * /enhanced-search:
 *   get:
 *     summary: Enhanced music search using YTMusicAdvanced
 *     description: Advanced search with multiple strategies, better ranking, and YTMusicAdvanced integration
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Number of results (max 50)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [music, all, quick]
 *           default: music
 *         description: Search type - music (songs only), all (all content), quick (fast results)
 *       - in: query
 *         name: strategy
 *         schema:
 *           type: string
 *           enum: [fast, comprehensive, accurate]
 *           default: comprehensive
 *         description: Search strategy to use
 *       - in: query
 *         name: filter_explicit
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Filter out explicit content
 *       - in: query
 *         name: include_suggestions
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include search suggestions in response
 *     responses:
 *       200:
 *         description: Search completed successfully
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
 *                       description: All search results
 *                     songs:
 *                       type: array
 *                       description: Filtered songs
 *                     videos:
 *                       type: array
 *                       description: Filtered videos
 *                     albums:
 *                       type: array
 *                       description: Filtered albums
 *                     artists:
 *                       type: array
 *                       description: Filtered artists
 *                     playlists:
 *                       type: array
 *                       description: Filtered playlists
 *                     metadata:
 *                       type: object
 *                     suggestions:
 *                       type: array
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     responseTime:
 *                       type: string
 *                     serverTime:
 *                       type: string
 *                     searchEngine:
 *                       type: string
 *                     strategy:
 *                       type: string
 *                     cacheStatus:
 *                       type: string
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Search failed
 */
router.get("/", enhancedSearch);

/**
 * @swagger
 * /enhanced-search/advanced:
 *   post:
 *     summary: Advanced filtered search
 *     description: Perform advanced search with custom filters using YTMusicAdvanced
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
 *                 description: Number of results (max 50)
 *     responses:
 *       200:
 *         description: Advanced search completed successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Search failed
 */
router.post("/advanced", advancedFilteredSearch);

/**
 * @swagger
 * /enhanced-search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     description: Get autocomplete suggestions for search queries using YTMusicAdvanced
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
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Failed to get suggestions
 */
router.get("/suggestions", getSearchSuggestions);

/**
 * @swagger
 * /enhanced-search/quick:
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
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of results (max 10)
 *     responses:
 *       200:
 *         description: Quick search completed successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Search failed
 */
router.get("/quick", enhancedSearch); // Uses same controller with type=quick

/**
 * @swagger
 * /enhanced-search/music:
 *   get:
 *     summary: Music-only search
 *     description: Search specifically for music content (songs)
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results (max 50)
 *     responses:
 *       200:
 *         description: Music search completed successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Search failed
 */
router.get("/music", enhancedSearch); // Uses same controller with type=music

/**
 * @swagger
 * /enhanced-search/stats:
 *   get:
 *     summary: Get YTMusicAdvanced statistics
 *     description: Get cache statistics, client status, and search performance data
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                 engine:
 *                   type: string
 *                 timestamp:
 *                   type: string
 */
router.get("/stats", getSearchStats);

/**
 * @swagger
 * /enhanced-search/status:
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
 *                   properties:
 *                     initialized:
 *                       type: boolean
 *                     cacheEnabled:
 *                       type: boolean
 *                     cacheSize:
 *                       type: number
 *                     language:
 *                       type: string
 *                     searchCache:
 *                       type: object
 *                     endpoints:
 *                       type: object
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
 * /enhanced-search/cache:
 *   delete:
 *     summary: Clear YTMusicAdvanced search cache
 *     description: Clear all cached search results and reset cache statistics
 *     tags: [Search]
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
router.delete("/cache", clearSearchCache);

/**
 * @swagger
 * /enhanced-search/health:
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
router.get("/health", async (req, res) => {
  try {
    const { getClientStatus, quickSearch } = await import(
      "../models/ytmusicModel.js"
    );
    const status = await getClientStatus();

    // Test with a simple query
    let testSearch = "failed";
    try {
      await quickSearch("test", 1);
      testSearch = "working";
    } catch (testError) {
      console.warn("⚠️ Health check test search failed:", testError.message);
    }

    res.json({
      status: "healthy",
      service: "enhanced-search",
      ytmusicAdvanced: {
        initialized: status.initialized,
        cacheEnabled: status.cacheEnabled,
        endpoints: status.endpoints,
      },
      lastCheck: new Date().toISOString(),
      cacheStats: {
        cacheEnabled: status.cacheEnabled,
        cacheSize: status.cacheSize,
        searchCache: status.searchCache,
      },
      testSearch: testSearch,
    });
  } catch (error) {
    console.error("❌ Health check failed:", error.message);
    res.status(503).json({
      status: "unhealthy",
      service: "enhanced-search",
      error: error.message,
      lastCheck: new Date().toISOString(),
      ytmusicAdvanced: "failed to initialize",
    });
  }
});

export default router;
