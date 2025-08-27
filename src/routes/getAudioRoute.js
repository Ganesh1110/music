import express from "express";
import { getAudioUrl } from "../controllers/youtubeController.js";

const router = express.Router();

// GET /youtube/play/:videoId
router.get("/url/:videoId", getAudioUrl);

export default router;
