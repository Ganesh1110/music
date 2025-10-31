import Genius from "genius-lyrics";
import {
  getPlaylist,
  getLyrics,
  getVideoDetails,
  getSearchSuggestions,
} from "../models/ytmusicModel.js";

const geniusClient = new Genius.Client(process.env.GENIUS_CLIENT_ACCESS_TOKEN);

// Fetch playlist by ID with enhanced YTMusicAdvanced
export const fetchPlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const playlist = await getPlaylist(id);

    res.json({
      success: true,
      data: playlist,
      metadata: {
        source: "YTMusicAdvanced",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("YTMusicAdvanced playlist error:", error);
    res.status(500).json({
      error: "Failed to fetch playlist",
      message: error.message,
    });
  }
};

// Enhanced lyrics fetching with multiple fallback strategies
export const fetchLyrics = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({
        error: "Video ID is required",
        message: "Please provide a valid video ID",
      });
    }

    console.log(`🎵 Fetching lyrics for video: ${videoId}`);

    // Step 1: Get video details first for better search
    const videoDetails = await getVideoDetails(videoId);
    const { title, author } = videoDetails;

    console.log(`📝 Searching lyrics for: "${title}" by ${author}`);

    let lyrics = null;
    let source = null;
    let attempts = [];

    // Strategy 1: Try YTMusicAdvanced lyrics first
    try {
      console.log("🔍 Trying YTMusicAdvanced for lyrics...");
      const ytmusicLyrics = await getLyrics(videoId);
      attempts.push({
        method: "YTMusicAdvanced",
        success: !!ytmusicLyrics?.lyrics,
      });

      if (ytmusicLyrics?.lyrics) {
        lyrics = ytmusicLyrics.lyrics;
        source = "YTMusicAdvanced";
        console.log("✅ Lyrics found via YTMusicAdvanced");
      }
    } catch (ytmusicError) {
      attempts.push({
        method: "YTMusicAdvanced",
        success: false,
        error: ytmusicError.message,
      });
      console.warn("⚠️ YTMusicAdvanced lyrics failed:", ytmusicError.message);
    }

    // Strategy 2: Fallback to Genius with cleaned search query
    if (!lyrics && title && author) {
      try {
        console.log("🔍 Trying Genius for lyrics...");

        // Clean title for better Genius search
        const cleanTitle = cleanSongTitle(title);
        const searchQuery = `${cleanTitle} ${author}`;

        console.log(`🔍 Genius search: "${searchQuery}"`);

        const searches = await geniusClient.songs.search(searchQuery);
        attempts.push({ method: "Genius", success: searches.length > 0 });

        if (searches.length > 0) {
          const song = searches[0];
          const geniusLyrics = await song.lyrics();

          if (geniusLyrics && !geniusLyrics.includes("Embed")) {
            lyrics = geniusLyrics;
            source = "Genius";
            console.log("✅ Lyrics found via Genius");
          }
        }
      } catch (geniusError) {
        attempts.push({
          method: "Genius",
          success: false,
          error: geniusError.message,
        });
        console.warn("⚠️ Genius lyrics failed:", geniusError.message);
      }
    }

    // Strategy 3: Try alternative search queries if previous attempts failed
    if (!lyrics && title && author) {
      try {
        console.log("🔍 Trying alternative Genius search...");

        // Try with just the main artist (first artist if multiple)
        const mainArtist = author.split(/[,&]/)[0].trim();
        const alternativeQuery = `${cleanSongTitle(title)} ${mainArtist}`;

        const searches = await geniusClient.songs.search(alternativeQuery);
        attempts.push({
          method: "Genius_Alternative",
          success: searches.length > 0,
        });

        if (searches.length > 0) {
          const song = searches[0];
          const geniusLyrics = await song.lyrics();

          if (geniusLyrics && !geniusLyrics.includes("Embed")) {
            lyrics = geniusLyrics;
            source = "Genius_Alternative";
            console.log("✅ Lyrics found via alternative Genius search");
          }
        }
      } catch (altError) {
        attempts.push({
          method: "Genius_Alternative",
          success: false,
          error: altError.message,
        });
        console.warn("⚠️ Alternative Genius search failed:", altError.message);
      }
    }

    // Prepare response
    if (lyrics) {
      res.json({
        success: true,
        lyrics: lyrics,
        source: source,
        videoDetails: {
          videoId,
          title,
          artist: author,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          attempts: attempts,
        },
      });
    } else {
      res.json({
        success: false,
        lyrics: null,
        source: null,
        message: "Lyrics not available for this track",
        videoDetails: {
          videoId,
          title,
          artist: author,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          attempts: attempts,
        },
      });
    }
  } catch (error) {
    console.error("❌ Lyrics fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch lyrics",
      message: error.message,
      videoId: req.params.videoId,
    });
  }
};

// Helper function to clean song titles for better search
const cleanSongTitle = (title) => {
  if (!title) return "";

  return title
    .replace(/\(.*?\)/g, "") // Remove content in parentheses
    .replace(/\[.*?\]/g, "") // Remove content in brackets
    .replace(
      /official|video|lyrics?|audio|hd|4k|1080p|720p|live|version|mp3|mp4|download/gi,
      ""
    )
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();
};

// New endpoint: Search lyrics directly by song title and artist
export const searchLyricsDirect = async (req, res) => {
  try {
    const { title, artist } = req.query;

    if (!title) {
      return res.status(400).json({
        error: "Title is required",
        message: "Please provide a song title",
      });
    }

    const searchQuery = artist ? `${title} ${artist}` : title;
    console.log(`🔍 Direct lyrics search: "${searchQuery}"`);

    let lyrics = null;
    let source = null;

    try {
      const searches = await geniusClient.songs.search(searchQuery);

      if (searches.length > 0) {
        const song = searches[0];
        lyrics = await song.lyrics();
        source = "Genius";

        if (lyrics && lyrics.includes("Embed")) {
          lyrics = null; // Invalid lyrics
        }
      }
    } catch (geniusError) {
      console.warn("⚠️ Direct Genius search failed:", geniusError.message);
    }

    if (lyrics) {
      res.json({
        success: true,
        lyrics: lyrics,
        source: source,
        query: {
          title,
          artist,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      res.json({
        success: false,
        lyrics: null,
        source: null,
        message: "Lyrics not found for this query",
        query: {
          title,
          artist,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error("❌ Direct lyrics search error:", error);
    res.status(500).json({
      error: "Failed to search lyrics",
      message: error.message,
    });
  }
};

// New endpoint: Get lyrics suggestions based on video ID
export const getLyricsSuggestions = async (req, res) => {
  try {
    const { videoId } = req.params;

    const videoDetails = await getVideoDetails(videoId);
    const { title, author } = videoDetails;

    if (!title) {
      return res.json({
        success: false,
        suggestions: [],
        message: "No video details available for suggestions",
      });
    }

    const cleanTitle = cleanSongTitle(title);
    const searchQueries = [
      `${cleanTitle} ${author}`,
      cleanTitle,
      `${cleanTitle} ${author.split(/[,&]/)[0].trim()}`,
    ];

    const suggestions = [];

    for (const query of searchQueries) {
      try {
        const searches = await geniusClient.songs.search(query, { limit: 3 });

        for (const song of searches.slice(0, 2)) {
          suggestions.push({
            title: song.title,
            artist: song.artist.name,
            thumbnail: song.thumbnail,
            url: song.url,
            query: query,
          });
        }
      } catch (error) {
        console.warn(
          `⚠️ Suggestion search failed for "${query}":`,
          error.message
        );
      }
    }

    // Remove duplicates
    const uniqueSuggestions = suggestions.filter(
      (suggestion, index, self) =>
        index ===
        self.findIndex(
          (s) => s.title === suggestion.title && s.artist === suggestion.artist
        )
    );

    res.json({
      success: true,
      suggestions: uniqueSuggestions.slice(0, 5),
      originalQuery: {
        title,
        artist: author,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        totalSuggestions: uniqueSuggestions.length,
      },
    });
  } catch (error) {
    console.error("❌ Lyrics suggestions error:", error);
    res.status(500).json({
      error: "Failed to get lyrics suggestions",
      message: error.message,
    });
  }
};
