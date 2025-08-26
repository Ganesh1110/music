import Genius from "genius-lyrics";
import {
  searchSongs,
  getPlaylist,
  getLyrics,
  searchAlbums,
  getVideoDetails,
} from "../models/ytmusicModel.js";

const geniusClient = new Genius.Client(process.env.GENIUS_CLIENT_ACCESS_TOKEN);

export const searchMusic = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query)
      return res.status(400).json({ error: "Parameter `query` is required" });

    const results = await searchSongs(query);
    res.json(results);
  } catch (error) {
    console.error("YTMusic search error:", error);
    res.status(500).json({ error: "Failed to fetch music" });
  }
};

export const fetchPlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const playlist = await getPlaylist(id);
    res.json(playlist);
  } catch (error) {
    console.error("YTMusic playlist error:", error);
    res.status(500).json({ error: "Failed to fetch playlist" });
  }
};

//only if lyrics has data else null old setup
// export const fetchLyrics = async (req, res) => {
//   try {
//     const { videoId } = req.params;
//     const lyrics = await getLyrics(videoId);
//     res.json(lyrics);
//   } catch (error) {
//     console.error("YTMusic lyrics error:", error);
//     res.status(500).json({ error: "Failed to fetch lyrics" });
//   }
// };

export const fetchLyrics = async (req, res) => {
  try {
    const { videoId } = req.params;

    // Step 1: Try YTMusic lyrics
    let lyrics = await getLyrics(videoId);

    if (!lyrics) {
      console.log("❌ YTMusic lyrics not found, falling back to Genius…");

      const { title, author } = await getVideoDetails(videoId);

      // Make sure they are strings before using .replace
      const safeTitle = title || "";
      const safeAuthor = author || "";

      // Clean title for better Genius search
      const cleanTitle = safeTitle
        .replace(/\(.*?\)/g, "")
        .replace(/\[.*?\]/g, "")
        .replace(/official|video|lyrics?|audio/gi, "")
        .trim();

      const searches = await geniusClient.songs.search(
        `${cleanTitle} ${safeAuthor}`
      );
      if (searches.length > 0) {
        try {
          const song = searches[0];
          lyrics = await song.lyrics();
        } catch (err) {
          console.warn("⚠️ Genius lyrics fetch failed:", err.message);
        }
      }
    }

    if (!lyrics) {
      return res.json({
        lyrics: "Lyrics not available",
        source: null,
      });
    }

    res.json({
      lyrics,
      source: lyrics.includes("Embed") ? "Genius" : "YTMusic",
    });
  } catch (error) {
    console.error("Lyrics fetch error:", error);
    res.status(500).json({ error: "Failed to fetch lyrics" });
  }
};
