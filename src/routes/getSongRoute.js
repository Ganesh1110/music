import express from "express";
import { getAudioUrl } from "../controllers/songController.js";

const router = express.Router();

/**
 * @swagger
 * /song/play/{videoId}:
 *   get:
 *     summary: Get audio stream URL
 *     description: Get direct audio URL from YouTube (highest quality)
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
 *         description: Audio URL retrieved successfully
 *       400:
 *         description: Invalid video ID
 *       404:
 *         description: No audio formats available
 *       500:
 *         description: Failed to fetch audio URL
 */
router.get("/play/:videoId", getAudioUrl);

export default router;
