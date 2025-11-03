import express from "express";
import {
  getAudioUrl,
  searchSongs,
  getSuggestions,
  getVideoDetails,
  searchWithAudio,
  testEndpoint,
} from "../controllers/songController.js";

const router = express.Router();

/**
 * @swagger
 * /song/play/{videoId}:
 *   get:
 *     summary: Get audio stream URLs for a video
 *     description: Extract direct audio stream URLs from YouTube video
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
 *         description: Audio URLs retrieved successfully
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
 *                 audioFormats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       itag:
 *                         type: string
 *                       mimeType:
 *                         type: string
 *                       bitrate:
 *                         type: number
 *                       audioQuality:
 *                         type: string
 *                 bestAudioUrl:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     audioQuality:
 *                       type: string
 *                     bitrate:
 *                       type: number
 *       400:
 *         description: Invalid video ID
 *       404:
 *         description: No audio formats available
 *       500:
 *         description: Failed to fetch audio information
 */
router.get("/play/:videoId", getAudioUrl);

/**
 * @swagger
 * /song/video/{videoId}:
 *   get:
 *     summary: Get detailed video information with audio formats
 *     description: Get comprehensive video details including all available audio formats
 *     tags: [Video]
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
 *                     videoId:
 *                       type: string
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
 *                     audioFormats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           itag:
 *                             type: string
 *                           mimeType:
 *                             type: string
 *                           bitrate:
 *                             type: number
 *                           audioQuality:
 *                             type: string
 *                     bestAudioFormat:
 *                       type: object
 *       404:
 *         description: Video not found
 *       500:
 *         description: Failed to fetch video details
 */
router.get("/video/:videoId", getVideoDetails);

/**
 * @swagger
 * /song/search:
 *   get:
 *     summary: Search for songs and videos
 *     description: Search YouTube with music-specific filtering and metadata
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (song name, artist, video ID, etc.)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [music, quick, all]
 *         description: Search type (music=music only, quick=fast results, all=all videos)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results to return
 *     responses:
 *       200:
 *         description: Search results with enhanced metadata
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
 *                 isVideoIdSearch:
 *                   type: boolean
 *                 totalResults:
 *                   type: number
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       videoId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       author:
 *                         type: string
 *                       duration:
 *                         type: number
 *                       durationFormatted:
 *                         type: string
 *                       thumbnails:
 *                         type: array
 *                       audioInfo:
 *                         type: object
 *                         properties:
 *                           formatsAvailable:
 *                             type: number
 *                           bestQuality:
 *                             type: string
 *                           bestBitrate:
 *                             type: number
 *       400:
 *         description: Invalid search parameters
 *       404:
 *         description: No results found
 *       500:
 *         description: Search failed
 */
router.get("/search", searchSongs);

/**
 * @swagger
 * /song/search-with-audio:
 *   get:
 *     summary: Search and get audio URLs in one call
 *     description: Search for videos and include audio URL information in results
 *     tags: [Search, Audio]
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
 *         description: Number of results to return (limited for performance)
 *     responses:
 *       200:
 *         description: Search results with audio information
 *       400:
 *         description: Query is required
 *       404:
 *         description: No results found
 *       500:
 *         description: Search failed
 */
router.get("/search-with-audio", searchWithAudio);

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
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       videoId:
 *                         type: string
 *                       author:
 *                         type: string
 *       400:
 *         description: Query is required
 *       500:
 *         description: Failed to get suggestions
 */
router.get("/suggestions", getSuggestions);

/**
 * @swagger
 * /song/test:
 *   get:
 *     summary: Test YTMusicAdvanced functionality
 *     description: Verify that the YouTube audio extraction is working correctly
 *     tags: [Testing]
 *     responses:
 *       200:
 *         description: Test results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 tests:
 *                   type: object
 *                   properties:
 *                     search:
 *                       type: object
 *                       properties:
 *                         working:
 *                           type: boolean
 *                         results:
 *                           type: number
 *                     audioExtraction:
 *                       type: object
 *                       properties:
 *                         working:
 *                           type: boolean
 *                         formats:
 *                           type: number
 *       500:
 *         description: Test failed
 */
router.get("/test", testEndpoint);

export default router;
