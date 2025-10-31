import YTMusicAdvanced from "ytmusic-advanced";

// Initialize client (you might want to move this to a config file)
let musicClient;

async function initializeMusicClient() {
  if (!musicClient) {
    musicClient = await YTMusicAdvanced.initialize({
      cacheEnabled: true,
      language: "en",
      country: "US",
    });
    console.log("✅ YTMusicAdvanced client initialized");
  }
  return musicClient;
}

/**
 * Get enhanced audio information using YTMusicAdvanced
 */
export const getAudioUrl = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({ error: "Video ID is required" });
    }

    console.log(`🎵 Fetching audio for video: ${videoId}`);

    const client = await initializeMusicClient();

    // Search for the video to get enhanced metadata
    const searchResults = await client.searchAll(videoId, {
      filter: "videos",
      limit: 1,
    });

    if (!searchResults.success || searchResults.items.length === 0) {
      return res.status(404).json({
        error: "Video not found or unavailable",
        details: searchResults.error,
      });
    }

    const video = searchResults.items[0];

    // Enhanced response with YTMusicAdvanced metadata
    res.json({
      success: true,
      videoId: videoId,
      title: video.title,
      author: video.author,
      duration: video.duration,
      durationFormatted: video.durationFormatted,
      thumbnail: video.thumbnails?.[0]?.url,

      // Audio information (fallback URL - you can enhance this later)
      audioUrl: `https://www.youtube.com/watch?v=${videoId}`,
      quality: "Best available",

      // Enhanced metadata
      enhanced: video.enhanced || {},

      // URLs for different use cases
      urls: {
        watch: `https://www.youtube.com/watch?v=${videoId}`,
        embed: `https://www.youtube.com/embed/${videoId}`,
        thumbnail: video.thumbnails?.[0]?.url,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching audio URL:", error.message);
    res.status(500).json({
      error: "Failed to fetch audio URL",
      details: error.message,
    });
  }
};

/**
 * Enhanced search endpoint using YTMusicAdvanced
 */
export const searchSongs = async (req, res) => {
  try {
    const { query, type = "music", limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    console.log(`🔍 Searching for: "${query}" (type: ${type})`);

    const client = await initializeMusicClient();
    let searchResults;

    switch (type) {
      case "quick":
        searchResults = await client.quickSearch(query, {
          limit: parseInt(limit),
        });
        break;
      case "all":
        searchResults = await client.searchAll(query, {
          limit: parseInt(limit),
        });
        break;
      case "music":
      default:
        searchResults = await client.searchMusic(query, {
          limit: parseInt(limit),
        });
        break;
    }

    if (!searchResults.success) {
      return res.status(404).json({
        error: searchResults.error || "No results found",
        suggestions: searchResults.suggestions || [],
      });
    }

    // Format response for frontend
    const formattedResults = searchResults.items.map((video) => ({
      videoId: video.videoId,
      title: video.title,
      author: video.author,
      duration: video.duration,
      durationFormatted: video.durationFormatted,
      thumbnails: video.thumbnails,
      viewCount: video.viewCount,

      // Audio information
      audioUrl: `https://www.youtube.com/watch?v=${video.videoId}`,

      // Enhanced metadata
      enhanced: video.enhanced || {},

      // URLs
      urls: {
        watch: `https://www.youtube.com/watch?v=${video.videoId}`,
        embed: `https://www.youtube.com/embed/${video.videoId}`,
        thumbnail: video.thumbnails?.[0]?.url,
      },
    }));

    res.json({
      success: true,
      query: query,
      type: type,
      totalResults: searchResults.totalResults,
      items: formattedResults,
      metadata: {
        relevanceScore: searchResults.relevanceScore,
        searchType: searchResults.searchType,
        timestamp: searchResults.timestamp,
      },
      suggestions: searchResults.suggestions || [],
    });
  } catch (error) {
    console.error("❌ Search error:", error.message);
    res.status(500).json({
      error: "Search failed",
      details: error.message,
    });
  }
};

/**
 * Get song suggestions
 */
export const getSuggestions = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const client = await initializeMusicClient();
    const suggestions = await client.getSuggestions(query, 10);

    res.json({
      success: true,
      query: query,
      suggestions: suggestions,
    });
  } catch (error) {
    console.error("❌ Suggestions error:", error.message);
    res.status(500).json({
      error: "Failed to get suggestions",
      details: error.message,
    });
  }
};
