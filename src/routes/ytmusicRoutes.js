import express from "express";
import {
  fetchPlaylist,
  fetchLyrics,
} from "../controllers/ytmusicController.js";

const router = express.Router();

/**
 * @swagger
 * /ytmusic/playlist/{id}:
 *   get:
 *     summary: Get playlist by ID
 *     description: Fetch YouTube Music playlist details
 *     tags: [YouTube Music]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: YouTube Music playlist ID
 *     responses:
 *       200:
 *         description: Playlist details retrieved successfully
 *       500:
 *         description: Failed to fetch playlist
 */
router.get("/playlist/:id", fetchPlaylist);

/**
 * @swagger
 * /ytmusic/lyrics/{videoId}:
 *   get:
 *     summary: Get lyrics for a video
 *     description: Fetch lyrics from YouTube Music or Genius
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
 *       500:
 *         description: Failed to fetch lyrics
 */
router.get("/lyrics/:videoId", fetchLyrics);

export default router;
