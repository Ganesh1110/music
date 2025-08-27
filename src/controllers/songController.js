import ytdl from "@distube/ytdl-core";
import { YT_WATCH_URL } from "../constant/constant.js";

/**
 * Get direct audio URL from YouTube (ad-free, highest quality)
 */
export const getAudioUrl = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({ error: "Video ID is required" });
    }

    const url = `${YT_WATCH_URL}/watch?v=${videoId}`;

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: "Invalid YouTube video ID" });
    }

    // Get video info
    const info = await ytdl.getInfo(url);

    // Filter audio formats only
    const audioFormats = ytdl.filterFormats(info.formats, "audioonly");

    if (!audioFormats.length) {
      return res.status(404).json({ error: "No audio formats available" });
    }

    // Pick the highest quality audio
    const bestAudio = audioFormats.reduce((prev, current) =>
      parseInt(current.audioBitrate || 0) > parseInt(prev.audioBitrate || 0)
        ? current
        : prev
    );

    res.json({
      success: true,
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      thumbnail: info.videoDetails.thumbnails?.pop()?.url,
      audioUrl: bestAudio.url, // ✅ Highest quality stream URL
      quality: bestAudio.audioBitrate + " kbps",
      container: bestAudio.container,
    });
  } catch (error) {
    console.error("❌ Error fetching audio URL:", error.message);
    res.status(500).json({ error: "Failed to fetch audio URL" });
  }
};
