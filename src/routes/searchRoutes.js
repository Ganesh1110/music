import express from "express";
import {
  searchMusic,
  getCacheStatistics,
  clearCache,
  healthCheck,
} from "../controllers/searchController.js";

const router = express.Router();

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search for music
 *     description: Search for songs, albums, videos, playlists, and artists
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query term
 *     responses:
 *       200:
 *         description: Successful search
 *       400:
 *         description: Bad request - missing or invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get("/", searchMusic);

/**
 * @swagger
 * /search/health:
 *   get:
 *     summary: Health check
 *     description: Check the health status of search service
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get("/health", healthCheck);

/**
 * @swagger
 * /search/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     description: Retrieve search cache statistics
 *     tags: [Cache]
 *     responses:
 *       200:
 *         description: Cache statistics retrieved successfully
 */
router.get("/cache/stats", getCacheStatistics);

/**
 * @swagger
 * /search/cache:
 *   delete:
 *     summary: Clear search cache
 *     description: Clear all cached search results
 *     tags: [Cache]
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */
router.delete("/cache", clearCache);

// Alternative search endpoint
router.get("/music", searchMusic);

export default router;
