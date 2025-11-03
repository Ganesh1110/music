import Genius from "genius-lyrics";
import ytmusicService from "../services/ytmusicService.js";

const geniusClient = new Genius.Client(process.env.GENIUS_CLIENT_ACCESS_TOKEN);

/**
 * Enhanced lyrics fetching with multiple fallback strategies
 */
export const fetchLyrics = async (req, res) => {
  const startTime = Date.now();

  try {
    const { videoId } = req.params;

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({
        error: "Valid Video ID is required (11 characters)",
        message: "Please provide a valid YouTube video ID",
        example: "dQw4w9WgXcQ",
      });
    }

    console.log(`🎵 Fetching lyrics for video: ${videoId}`);

    // Step 1: Get video details first for better search
    let videoDetails;
    try {
      // Use YTMusicAdvanced to get video info
      const searchResults = await ytmusicService.searchMusic(videoId, {
        limit: 1,
      });
      if (searchResults.success && searchResults.items.length > 0) {
        const video = searchResults.items[0];
        videoDetails = {
          title: video.title || "Unknown Title",
          author: video.author || "Unknown Artist",
          duration: video.duration,
          thumbnails: video.thumbnails,
        };
      } else {
        videoDetails = {
          title: "Unknown Title",
          author: "Unknown Artist",
        };
      }
    } catch (videoError) {
      console.warn("⚠️ Failed to get video details:", videoError.message);
      videoDetails = {
        title: "Unknown Title",
        author: "Unknown Artist",
      };
    }

    const { title, author } = videoDetails;
    console.log(`📝 Searching lyrics for: "${title}" by ${author}`);

    let lyrics = null;
    let source = null;
    let attempts = [];

    // Strategy 1: Try Genius with cleaned search query
    if (title && author) {
      try {
        console.log("🔍 Trying Genius for lyrics...");

        // Clean title for better Genius search
        const cleanTitle = cleanSongTitle(title);
        const searchQuery = `${cleanTitle} ${author}`;

        console.log(`🔍 Genius search: "${searchQuery}"`);

        const searches = await geniusClient.songs.search(searchQuery);
        attempts.push({
          method: "Genius",
          success: searches.length > 0,
          query: searchQuery,
        });

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

    // Strategy 2: Try alternative search queries if previous attempts failed
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
          query: alternativeQuery,
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

    // Strategy 3: Try title-only search
    if (!lyrics && title) {
      try {
        console.log("🔍 Trying title-only Genius search...");

        const titleOnlyQuery = cleanSongTitle(title);
        const searches = await geniusClient.songs.search(titleOnlyQuery);
        attempts.push({
          method: "Genius_Title_Only",
          success: searches.length > 0,
          query: titleOnlyQuery,
        });

        if (searches.length > 0) {
          const song = searches[0];
          const geniusLyrics = await song.lyrics();

          if (geniusLyrics && !geniusLyrics.includes("Embed")) {
            lyrics = geniusLyrics;
            source = "Genius_Title_Only";
            console.log("✅ Lyrics found via title-only Genius search");
          }
        }
      } catch (titleError) {
        attempts.push({
          method: "Genius_Title_Only",
          success: false,
          error: titleError.message,
        });
        console.warn("⚠️ Title-only Genius search failed:", titleError.message);
      }
    }

    const responseTime = Date.now() - startTime;

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
          duration: videoDetails.duration,
          thumbnails: videoDetails.thumbnails,
        },
        metadata: {
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
          attempts: attempts,
          lyricsLength: lyrics.length,
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
          duration: videoDetails.duration,
          thumbnails: videoDetails.thumbnails,
        },
        metadata: {
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
          attempts: attempts,
        },
        suggestions: await generateLyricsSuggestions(title, author),
      });
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("❌ Lyrics fetch error:", error);

    res.status(500).json({
      error: "Failed to fetch lyrics",
      message: error.message,
      videoId: req.params.videoId,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Search lyrics directly by song title and artist
 */
export const searchLyricsDirect = async (req, res) => {
  const startTime = Date.now();

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
    let attempts = [];

    try {
      const searches = await geniusClient.songs.search(searchQuery);
      attempts.push({
        method: "Genius_Direct",
        success: searches.length > 0,
        query: searchQuery,
      });

      if (searches.length > 0) {
        const song = searches[0];
        lyrics = await song.lyrics();
        source = "Genius";

        if (lyrics && lyrics.includes("Embed")) {
          lyrics = null; // Invalid lyrics
          attempts[0].success = false;
          attempts[0].error = "Embedded lyrics detected";
        }
      }
    } catch (geniusError) {
      attempts.push({
        method: "Genius_Direct",
        success: false,
        error: geniusError.message,
      });
      console.warn("⚠️ Direct Genius search failed:", geniusError.message);
    }

    const responseTime = Date.now() - startTime;

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
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
          attempts: attempts,
          lyricsLength: lyrics.length,
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
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
          attempts: attempts,
        },
        suggestions: await generateLyricsSuggestions(title, artist),
      });
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("❌ Direct lyrics search error:", error);

    res.status(500).json({
      error: "Failed to search lyrics",
      message: error.message,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get lyrics suggestions based on video ID
 */
export const getLyricsSuggestions = async (req, res) => {
  const startTime = Date.now();

  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({
        error: "Video ID is required",
      });
    }

    // Get video details
    let videoDetails;
    try {
      const searchResults = await ytmusicService.searchMusic(videoId, {
        limit: 1,
      });
      if (searchResults.success && searchResults.items.length > 0) {
        const video = searchResults.items[0];
        videoDetails = {
          title: video.title || "Unknown Title",
          author: video.author || "Unknown Artist",
        };
      } else {
        return res.status(404).json({
          success: false,
          error: "Video not found",
          videoId: videoId,
        });
      }
    } catch (videoError) {
      return res.status(404).json({
        success: false,
        error: "Failed to get video details",
        message: videoError.message,
      });
    }

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
      `${cleanTitle} lyrics`,
      `${author} ${cleanTitle}`,
    ];

    const suggestions = [];
    const seenSuggestions = new Set();

    for (const query of searchQueries) {
      try {
        const searches = await geniusClient.songs.search(query, { limit: 3 });

        for (const song of searches.slice(0, 2)) {
          const suggestionKey = `${song.title}-${song.artist.name}`;

          if (!seenSuggestions.has(suggestionKey)) {
            seenSuggestions.add(suggestionKey);

            suggestions.push({
              title: song.title,
              artist: song.artist.name,
              thumbnail: song.thumbnail,
              url: song.url,
              query: query,
              id: song.id,
            });
          }
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.warn(
          `⚠️ Suggestion search failed for "${query}":`,
          error.message
        );
      }
    }

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      suggestions: suggestions.slice(0, 8),
      originalQuery: {
        title,
        artist: author,
        videoId: videoId,
      },
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        totalSuggestions: suggestions.length,
        queriesUsed: searchQueries,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("❌ Lyrics suggestions error:", error);

    res.status(500).json({
      error: "Failed to get lyrics suggestions",
      message: error.message,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Batch lyrics search for multiple videos
 */
export const batchLyricsSearch = async (req, res) => {
  const startTime = Date.now();

  try {
    const { videos } = req.body;

    if (!Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({
        error: "Videos array is required",
        message:
          "Please provide an array of video objects with videoId, title, and artist",
      });
    }

    if (videos.length > 10) {
      return res.status(400).json({
        error: "Too many videos",
        message: "Maximum 10 videos per batch request",
      });
    }

    console.log(`🔍 Batch lyrics search for ${videos.length} videos`);

    const results = [];
    const processed = new Set();

    for (const video of videos) {
      if (!video.videoId || processed.has(video.videoId)) {
        continue;
      }

      processed.add(video.videoId);

      try {
        const searchQuery = video.artist
          ? `${cleanSongTitle(video.title)} ${video.artist}`
          : cleanSongTitle(video.title);

        const searches = await geniusClient.songs.search(searchQuery, {
          limit: 1,
        });

        let lyrics = null;
        let source = null;

        if (searches.length > 0) {
          const song = searches[0];
          const geniusLyrics = await song.lyrics();

          if (geniusLyrics && !geniusLyrics.includes("Embed")) {
            lyrics = geniusLyrics;
            source = "Genius";
          }
        }

        results.push({
          videoId: video.videoId,
          title: video.title,
          artist: video.artist,
          success: !!lyrics,
          lyrics: lyrics,
          source: source,
          query: searchQuery,
        });

        // Rate limiting delay
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.warn(
          `⚠️ Batch search failed for ${video.videoId}:`,
          error.message
        );
        results.push({
          videoId: video.videoId,
          title: video.title,
          artist: video.artist,
          success: false,
          error: error.message,
          lyrics: null,
          source: null,
        });
      }
    }

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      results: results,
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        totalProcessed: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("❌ Batch lyrics search error:", error);

    res.status(500).json({
      error: "Batch lyrics search failed",
      message: error.message,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Health check for lyrics service
 */
export const lyricsHealthCheck = async (req, res) => {
  try {
    // Test Genius API
    let geniusStatus = "unknown";
    try {
      await geniusClient.songs.search("test", { limit: 1 });
      geniusStatus = "healthy";
    } catch (error) {
      geniusStatus = "unhealthy";
    }

    // Test YTMusicAdvanced service
    let ytmusicStatus = "unknown";
    try {
      const health = await ytmusicService.healthCheck();
      ytmusicStatus = health.healthy ? "healthy" : "unhealthy";
    } catch (error) {
      ytmusicStatus = "unhealthy";
    }

    res.json({
      status:
        geniusStatus === "healthy" && ytmusicStatus === "healthy"
          ? "healthy"
          : "degraded",
      service: "lyrics",
      components: {
        genius: geniusStatus,
        ytmusicAdvanced: ytmusicStatus,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      service: "lyrics",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Helper functions

/**
 * Clean song titles for better search
 */
const cleanSongTitle = (title) => {
  if (!title) return "";

  return title
    .replace(/\(.*?\)/g, "") // Remove content in parentheses
    .replace(/\[.*?\]/g, "") // Remove content in brackets
    .replace(
      /official|video|lyrics?|audio|hd|4k|1080p|720p|live|version|mp3|mp4|download|ft\.|feat\.|featuring/gi,
      ""
    )
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();
};

/**
 * Generate helpful suggestions when lyrics aren't found
 */
const generateLyricsSuggestions = async (title, artist) => {
  const suggestions = [];

  if (title && artist) {
    suggestions.push(
      `Try searching for "${title} ${artist}" on Genius.com`,
      `Check if "${title}" by ${artist} has an official lyrics video`,
      `Verify the song title and artist spelling`
    );
  }

  if (title) {
    suggestions.push(
      `Search for "${title} lyrics"`,
      `The song might be instrumental or not have published lyrics`
    );
  }

  return suggestions.slice(0, 5);
};
