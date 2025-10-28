import express from "express";
import {
  enhancedSearch,
  getSearchStats,
  clearSearchCache,
} from "../controllers/enhancedSearchController.js";

const router = express.Router();

/**
 * @swagger
 * /enhanced-search:
 *   get:
 *     summary: Enhanced music search
 *     description: Advanced search with multiple strategies and better ranking
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
 *         description: Number of results per type
 *       - in: query
 *         name: strategy
 *         schema:
 *           type: string
 *           enum: [fast, comprehensive, accurate]
 *           default: comprehensive
 *         description: Search strategy to use
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           default: all
 *         description: Comma-separated types (songs,videos,albums,artists,playlists) or 'all'
 *       - in: query
 *         name: filter_explicit
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Filter out explicit content
 *     responses:
 *       200:
 *         description: Search completed successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Search failed
 */
router.get("/", enhancedSearch);

/**
 * @swagger
 * /enhanced-search/stats:
 *   get:
 *     summary: Get search statistics
 *     description: Get cache statistics and search performance data
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get("/stats", getSearchStats);

/**
 * @swagger
 * /enhanced-search/cache:
 *   delete:
 *     summary: Clear search cache
 *     description: Clear all cached search results
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */
router.delete("/cache", clearSearchCache);

export default router;
