import express from "express";
import {
  getAudioURLs,
  getAudioStream,
  getAudioWithProxy,
} from "../controllers/audioController.js";

const router = express.Router();

router.get("/:videoId", getAudioURLs);
router.get("/:videoId/stream", getAudioStream);
router.get("/:videoId/proxy", getAudioWithProxy);

/**
 * Audio download endpoint
 */
router.get("/api/audio/:videoId/download", async (req, res) => {
  try {
    const { videoId } = req.params;

    // Get fresh audio URL using YTMusicAdvanced
    const ytmusicService = await import("./services/ytmusicService.js");
    const audioData = await ytmusicService.default.getAudioURLs(videoId);

    if (!audioData.success || !audioData.bestAudio) {
      return res.status(404).json({
        error: "Audio not found",
      });
    }

    const bestAudio = audioData.bestAudio;

    // Set download headers
    const filename = `${audioData.title || "audio"}.${getFileExtension(
      bestAudio.mimeType
    )}`;

    res.set({
      "Content-Type": bestAudio.mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": bestAudio.contentLength || "",
      "Cache-Control": "no-cache",
    });

    // Stream the audio directly with proper headers
    const response = await fetch(bestAudio.url, {
      headers: {
        "User-Agent": getRandomUserAgent(),
        Accept: "*/*",
        Range: "bytes=0-",
        Referer: "https://www.youtube.com/",
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    response.body.pipe(res);
  } catch (error) {
    console.error("❌ Download error:", error.message);
    res.status(500).json({
      error: "Download failed",
      message: error.message,
    });
  }
});

function getFileExtension(mimeType) {
  const extensions = {
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
  };
  return extensions[mimeType] || "audio";
}

export default router;
