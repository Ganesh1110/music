import YTMusicAdvanced from "ytmusic-advanced";

// Initialize YTMusicAdvanced client
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
 * Enhanced search controller with YTMusicAdvanced integration
 */
export const searchMusic = async (req, res) => {
  const startTime = Date.now();

  try {
    const { query, type = "music", limit = 20 } = req.query;

    // Enhanced validation
    if (!query) {
      return res.status(400).json({
        error: "Missing required parameter",
        message: "`query` parameter is required",
        example: "/search?query=your+search+term",
      });
    }

    if (typeof query !== "string") {
      return res.status(400).json({
        error: "Invalid parameter type",
        message: "`query` must be a string",
      });
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      return res.status(400).json({
        error: "Empty query",
        message: "`query` parameter cannot be empty or only whitespace",
      });
    }

    if (trimmedQuery.length > 200) {
      return res.status(400).json({
        error: "Query too long",
        message: "Query must be 200 characters or less",
      });
    }

    // Log search request (for monitoring)
    console.log(
      `🔍 Search request: "${trimmedQuery}" (type: ${type}) from ${
        req.ip || "unknown IP"
      }`
    );

    const client = await initializeMusicClient();
    let searchResults;

    // Use YTMusicAdvanced for search
    switch (type) {
      case "quick":
        searchResults = await client.quickSearch(trimmedQuery, {
          limit: parseInt(limit),
        });
        break;
      case "all":
        searchResults = await client.searchAll(trimmedQuery, {
          limit: parseInt(limit),
        });
        break;
      case "music":
      default:
        searchResults = await client.searchMusic(trimmedQuery, {
          limit: parseInt(limit),
        });
        break;
    }

    const responseTime = Date.now() - startTime;

    // Check if search returned an error
    if (!searchResults.success) {
      return res.status(503).json({
        error: "Search service unavailable",
        message:
          searchResults.error || "Search failed due to external service issues",
        query: trimmedQuery,
        responseTime: `${responseTime}ms`,
        retryAfter: "30 seconds",
        suggestions: searchResults.suggestions || [],
      });
    }

    // Format results for consistent response structure
    const formattedResults = {
      songs: searchResults.items.filter(
        (item) => item.category === "song" || item.type === "song"
      ),
      videos: searchResults.items.filter(
        (item) => item.category === "video" || item.type === "video"
      ),
      albums: searchResults.items.filter(
        (item) => item.category === "album" || item.type === "album"
      ),
      artists: searchResults.items.filter(
        (item) => item.category === "artist" || item.type === "artist"
      ),
      playlists: searchResults.items.filter(
        (item) => item.category === "playlist" || item.type === "playlist"
      ),
    };

    // Enhanced response with metadata
    const response = {
      success: true,
      query: trimmedQuery,
      type: type,
      data: {
        items: searchResults.items,
        ...formattedResults,
      },
      metadata: {
        totalResults: searchResults.totalResults || searchResults.items.length,
        responseTime: `${responseTime}ms`,
        timestamp: searchResults.timestamp || new Date().toISOString(),
        searchType: searchResults.searchType,
        relevanceScore: searchResults.relevanceScore,
        categories: {
          songs: formattedResults.songs.length,
          albums: formattedResults.albums.length,
          videos: formattedResults.videos.length,
          playlists: formattedResults.playlists.length,
          artists: formattedResults.artists.length,
          total: searchResults.items.length,
        },
      },
      suggestions: searchResults.suggestions || [],
    };

    // Log successful search
    console.log(
      `✅ Search completed: "${trimmedQuery}" - ${searchResults.items.length} results in ${responseTime}ms`
    );

    res.json(response);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("❌ Search controller error:", error.message, error.stack);

    // Determine appropriate status code
    let statusCode = 500;
    let errorMessage = "Internal server error occurred during search";

    if (error.message.includes("Invalid query")) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (
      error.message.includes("timeout") ||
      error.message.includes("ETIMEDOUT")
    ) {
      statusCode = 504;
      errorMessage = "Search request timed out";
    } else if (
      error.message.includes("network") ||
      error.message.includes("ECONNRESET") ||
      error.message.includes("YTMusicAdvanced")
    ) {
      statusCode = 503;
      errorMessage = "Search service temporarily unavailable";
    }

    res.status(statusCode).json({
      error: "Search failed",
      message: errorMessage,
      query: req.query.query || null,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === "development" && {
        details: error.message,
        stack: error.stack,
      }),
    });
  }
};

/**
 * Get search cache statistics from YTMusicAdvanced
 */
export const getCacheStatistics = async (req, res) => {
  try {
    const client = await initializeMusicClient();
    const clientStatus = client.getStatus();

    const stats = {
      cacheEnabled: clientStatus.cacheEnabled,
      cacheSize: clientStatus.cacheSize,
      searchCache: clientStatus.searchCache,
      initialized: clientStatus.initialized,
      endpoints: clientStatus.endpoints,
    };

    res.json({
      success: true,
      cache: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Cache stats error:", error.message);
    res.status(500).json({
      error: "Failed to retrieve cache statistics",
      message: error.message,
    });
  }
};

/**
 * Clear search cache using YTMusicAdvanced
 */
export const clearCache = async (req, res) => {
  try {
    const client = await initializeMusicClient();
    await client.clearCache();

    res.json({
      success: true,
      message: "Search cache cleared successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Cache clear error:", error.message);
    res.status(500).json({
      error: "Failed to clear cache",
      message: error.message,
    });
  }
};

/**
 * Health check endpoint for search service with YTMusicAdvanced
 */
export const healthCheck = async (req, res) => {
  try {
    const client = await initializeMusicClient();
    const clientStatus = client.getStatus();

    // Test with a simple query
    const testResult = await client.quickSearch("test", { limit: 1 });

    res.json({
      status: "healthy",
      service: "search",
      ytmusicAdvanced: {
        initialized: clientStatus.initialized,
        cacheEnabled: clientStatus.cacheEnabled,
        endpoints: clientStatus.endpoints,
      },
      lastCheck: new Date().toISOString(),
      cacheStats: {
        cacheEnabled: clientStatus.cacheEnabled,
        cacheSize: clientStatus.cacheSize,
        searchCache: clientStatus.searchCache,
      },
      testSearch: testResult.success ? "working" : "failed",
    });
  } catch (error) {
    console.error("❌ Health check failed:", error.message);
    res.status(503).json({
      status: "unhealthy",
      service: "search",
      error: error.message,
      lastCheck: new Date().toISOString(),
      ytmusicAdvanced: "failed to initialize",
    });
  }
};

/**
 * Get search suggestions using YTMusicAdvanced
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Suggestions error:", error.message);
    res.status(500).json({
      error: "Failed to get suggestions",
      message: error.message,
    });
  }
};

/**
 * Advanced search with filters using YTMusicAdvanced
 */
export const advancedSearch = async (req, res) => {
  const startTime = Date.now();

  try {
    const { query, filters = {} } = req.body;

    if (!query) {
      return res.status(400).json({
        error: "Missing required parameter",
        message: "`query` parameter is required in request body",
      });
    }

    const client = await initializeMusicClient();
    const searchResults = await client.advancedSearch(query, filters);

    const responseTime = Date.now() - startTime;

    if (!searchResults.success) {
      return res.status(503).json({
        error: "Advanced search failed",
        message: searchResults.error || "Search service unavailable",
        query: query,
        responseTime: `${responseTime}ms`,
      });
    }

    res.json({
      success: true,
      query: query,
      filters: filters,
      data: searchResults,
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: searchResults.timestamp || new Date().toISOString(),
        totalResults: searchResults.totalResults || searchResults.items.length,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("❌ Advanced search error:", error.message);

    res.status(500).json({
      error: "Advanced search failed",
      message: error.message,
      query: req.body.query || null,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    });
  }
};
