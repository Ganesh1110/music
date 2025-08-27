import express from "express";
import { getAudioUrl } from "../controllers/songController.js";

const router = express.Router();

router.get("/play/:videoId", getAudioUrl);

export default router;
