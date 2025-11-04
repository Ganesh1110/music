import express from "express";
import {
  getAudioURLs,
  getAudioStream,
  getBatchAudioURLs,
  getProxyStats,
  refreshProxies,
  testAudioExtraction,
  audioHealthCheck,
  streamAudio,
} from "../controllers/audioController.js";

const router = express.Router();

/**
 * @swagger
 * /audio/{videoId}:
 *   get:
 *     summary: Get audio URLs for a video (Enhanced with Proxy Support)
 *     description: Extract direct audio URLs using multiple strategies and proxy rotation
 *     tags: [Audio]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: YouTube video ID (11 characters)
 *     responses:
 *       200:
 *         description: Audio URLs extracted successfully
 *       404:
 *         description: Audio extraction failed
 *       500:
 *         description: Server error
 */
router.get("/:videoId", getAudioURLs);

/**
 * @swagger
 * /audio/{videoId}/stream:
 *   get:
 *     summary: Get audio stream URL with quality selection
 *     description: Get optimized audio stream for specific quality
 *     tags: [Audio]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: quality
 *         schema:
 *           type: string
 *           enum: [high, medium, low]
 *           default: high
 *     responses:
 *       200:
 *         description: Stream URL retrieved
 */
router.get("/:videoId/stream", getAudioStream);

/**
 * @swagger
 * /audio/{videoId}/play:
 *   get:
 *     summary: Direct audio streaming (proxied)
 *     description: Stream audio directly through the server (hides YouTube URL)
 *     tags: [Audio]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: quality
 *         schema:
 *           type: string
 *           enum: [high, medium, low]
 *           default: high
 *     responses:
 *       200:
 *         description: Audio stream
 *         content:
 *           audio/webm:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/:videoId/play", streamAudio);

/**
 * @swagger
 * /audio/batch:
 *   post:
 *     summary: Batch audio URL extraction
 *     description: Extract audio URLs for multiple videos (max 20)
 *     tags: [Audio]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - videoIds
 *             properties:
 *               videoIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 20
 *     responses:
 *       200:
 *         description: Batch extraction completed
 */
router.post("/batch", getBatchAudioURLs);

/**
 * @swagger
 * /audio/proxy/stats:
 *   get:
 *     summary: Get proxy statistics
 *     description: Get detailed statistics about proxy performance
 *     tags: [Audio, Proxy]
 *     responses:
 *       200:
 *         description: Proxy statistics
 */
router.get("/proxy/stats", getProxyStats);

/**
 * @swagger
 * /audio/proxy/refresh:
 *   post:
 *     summary: Refresh proxy list
 *     description: Manually trigger proxy list refresh
 *     tags: [Audio, Proxy]
 *     responses:
 *       200:
 *         description: Proxy list refreshed
 */
router.post("/proxy/refresh", refreshProxies);

/**
 * @swagger
 * /audio/test:
 *   get:
 *     summary: Test audio extraction
 *     description: Test audio extraction with detailed logging
 *     tags: [Audio, Testing]
 *     parameters:
 *       - in: query
 *         name: videoId
 *         schema:
 *           type: string
 *           default: dQw4w9WgXcQ
 *     responses:
 *       200:
 *         description: Test results
 */
router.get("/test", testAudioExtraction);

/**
 * @swagger
 * /audio/health:
 *   get:
 *     summary: Audio service health check
 *     description: Check health of audio extraction service including proxy status
 *     tags: [Audio, Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is unhealthy
 */
router.get("/health", audioHealthCheck);

export default router;
