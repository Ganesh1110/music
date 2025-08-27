import express from "express";
import {
  fetchPlaylist,
  fetchLyrics,
} from "../controllers/ytmusicController.js";

const router = express.Router();

router.get("/playlist/:id", fetchPlaylist); // /ytmusic/playlist/PL12345
router.get("/lyrics/:videoId", fetchLyrics); // /ytmusic/lyrics/abcd123

export default router;
