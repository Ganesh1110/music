import express from "express";
import {
  fetchLyrics,
  searchLyricsDirect,
  getLyricsSuggestions,
  batchLyricsSearch,
  lyricsHealthCheck,
} from "../controllers/lyricsController.js";

const router = express.Router();

/**
 * @swagger
 * /lyrics/{videoId}:
 *   get:
 *     summary: Get lyrics for a YouTube video
 *     description: Fetch lyrics for a specific YouTube video using multiple search strategies with Genius fallback
 *     tags: [Lyrics]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: YouTube video ID (11 characters)
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
 *                     duration:
 *                       type: number
 *                     thumbnails:
 *                       type: array
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     responseTime:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                     attempts:
 *                       type: array
 *                     lyricsLength:
 *                       type: number
 *       400:
 *         description: Invalid video ID
 *       404:
 *         description: Lyrics not found
 *       500:
 *         description: Failed to fetch lyrics
 */
router.get("/:videoId", fetchLyrics);

/**
 * @swagger
 * /lyrics/search/direct:
 *   get:
 *     summary: Search lyrics directly by song title and artist
 *     description: Direct lyrics search without requiring a video ID
 *     tags: [Lyrics]
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
router.get("/search/direct", searchLyricsDirect);

/**
 * @swagger
 * /lyrics/suggestions/{videoId}:
 *   get:
 *     summary: Get lyrics suggestions for a video
 *     description: Get potential lyric matches and suggestions for manual selection
 *     tags: [Lyrics]
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
 *                       id:
 *                         type: number
 *                 originalQuery:
 *                   type: object
 *                 metadata:
 *                   type: object
 *       404:
 *         description: Video not found
 *       500:
 *         description: Failed to get suggestions
 */
router.get("/suggestions/:videoId", getLyricsSuggestions);

/**
 * @swagger
 * /lyrics/batch:
 *   post:
 *     summary: Batch lyrics search for multiple videos
 *     description: Search lyrics for multiple videos in a single request (max 10 videos)
 *     tags: [Lyrics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - videos
 *             properties:
 *               videos:
 *                 type: array
 *                 description: Array of video objects
 *                 items:
 *                   type: object
 *                   required:
 *                     - videoId
 *                     - title
 *                   properties:
 *                     videoId:
 *                       type: string
 *                     title:
 *                       type: string
 *                     artist:
 *                       type: string
 *     responses:
 *       200:
 *         description: Batch search completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 results:
 *                   type: array
 *                 metadata:
 *                   type: object
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Batch search failed
 */
router.post("/batch", batchLyricsSearch);

/**
 * @swagger
 * /lyrics/health:
 *   get:
 *     summary: Health check for lyrics service
 *     description: Check if Genius API and YTMusicAdvanced services are healthy
 *     tags: [Lyrics]
 *     responses:
 *       200:
 *         description: Service status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 service:
 *                   type: string
 *                 components:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *       503:
 *         description: Service unhealthy
 */
router.get("/health", lyricsHealthCheck);

export default router;
