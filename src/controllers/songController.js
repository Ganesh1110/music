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

    // Try cached results first
    const { getVideoFromCache, getVideoById } = await import(
      "../models/ytmusicModel.js"
    );
    const cachedVideo = await getVideoFromCache(videoId);

    let videoResult;
    if (cachedVideo) {
      videoResult = cachedVideo;
    } else {
      // Fall back to enhanced lookup
      videoResult = await getVideoById(videoId);
    }

    if (!videoResult.success) {
      // Final fallback: Return basic info with the video ID
      return res.json({
        success: true,
        videoId: videoId,
        title: "Video (Available for Playback)",
        author: "Unknown Artist",
        duration: null,
        durationFormatted: null,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        audioUrl: `https://www.youtube.com/watch?v=${videoId}`,
        quality: "Best available",
        enhanced: {
          availableForPlayback: true,
          source: "direct_youtube_url",
        },
        urls: {
          watch: `https://www.youtube.com/watch?v=${videoId}`,
          embed: `https://www.youtube.com/embed/${videoId}`,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        },
        note: "Video metadata unavailable, but should be playable",
      });
    }

    const video = videoResult.video;

    res.json({
      success: true,
      videoId: videoId,
      title: video.title,
      author: video.author,
      duration: video.duration,
      durationFormatted: video.durationFormatted,
      thumbnail: video.thumbnails?.[0]?.url,
      audioUrl: `https://www.youtube.com/watch?v=${videoId}`,
      quality: "Best available",
      enhanced: video.enhanced || {},
      urls: {
        watch: `https://www.youtube.com/watch?v=${videoId}`,
        embed: `https://www.youtube.com/embed/${videoId}`,
        thumbnail: video.thumbnails?.[0]?.url,
      },
      source: videoResult.source,
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
