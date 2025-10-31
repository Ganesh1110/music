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
    console.log("✅ YTMusicAdvanced client initialized for enhanced search");
  }
  return musicClient;
}

export const enhancedSearch = async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      query,
      limit = 25,
      type = "music",
      strategy = "comprehensive",
      filter_explicit = "false",
      include_suggestions = "true",
    } = req.query;

    // Validation
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid query",
        message: "Query parameter is required and cannot be empty",
        example: "/search?query=artist+song+name",
      });
    }

    if (query.length > 200) {
      return res.status(400).json({
        error: "Query too long",
        message: "Query must be 200 characters or less",
      });
    }

    const cleanedQuery = query.trim();
    const client = await initializeMusicClient();

    // Map search types to YTMusicAdvanced methods
    let searchResults;
    const searchLimit = Math.min(parseInt(limit), 50); // Cap at 50

    console.log(`🔍 Enhanced search: "${cleanedQuery}" [${type}, ${strategy}]`);

    // Perform search based on type
    switch (type) {
      case "quick":
        searchResults = await client.quickSearch(cleanedQuery, {
          limit: searchLimit,
        });
        break;
      case "all":
        searchResults = await client.searchAll(cleanedQuery, {
          limit: searchLimit,
        });
        break;
      case "music":
      default:
        searchResults = await client.searchMusic(cleanedQuery, {
          limit: searchLimit,
        });
        break;
    }

    const responseTime = Date.now() - startTime;

    // Check if search was successful
    if (!searchResults.success) {
      return res.status(503).json({
        error: "Search service unavailable",
        message:
          searchResults.error || "Search failed due to external service issues",
        query: cleanedQuery,
        responseTime: `${responseTime}ms`,
        suggestions: searchResults.suggestions || [],
      });
    }

    // Get suggestions if requested
    let suggestions = [];
    if (include_suggestions === "true") {
      try {
        suggestions = await client.getSuggestions(cleanedQuery, 5);
      } catch (suggestionError) {
        console.warn("⚠️ Failed to get suggestions:", suggestionError.message);
      }
    }

    // Filter explicit content if requested
    let filteredItems = searchResults.items;
    if (filter_explicit === "true") {
      filteredItems = searchResults.items.filter(
        (item) =>
          !item.title?.toLowerCase().includes("explicit") &&
          !item.description?.toLowerCase().includes("explicit")
      );
    }

    // Categorize results
    const categorizedResults = {
      songs: filteredItems.filter(
        (item) =>
          item.category === "song" ||
          item.type === "song" ||
          (item.duration && !item.isAlbum && !item.isPlaylist)
      ),
      videos: filteredItems.filter(
        (item) =>
          item.category === "video" ||
          item.type === "video" ||
          item.videoType === "MUSIC_VIDEO_TYPE_ATV"
      ),
      albums: filteredItems.filter(
        (item) =>
          item.category === "album" || item.type === "album" || item.isAlbum
      ),
      artists: filteredItems.filter(
        (item) =>
          item.category === "artist" ||
          item.type === "artist" ||
          (item.author && item.isArtist)
      ),
      playlists: filteredItems.filter(
        (item) =>
          item.category === "playlist" ||
          item.type === "playlist" ||
          item.isPlaylist
      ),
    };

    // Build response
    const response = {
      success: true,
      query: cleanedQuery,
      data: {
        items: filteredItems,
        ...categorizedResults,
        metadata: {
          totalResults: searchResults.totalResults || filteredItems.length,
          returnedResults: filteredItems.length,
          searchType: searchResults.searchType || type,
          strategy: strategy,
          relevanceScore: searchResults.relevanceScore,
          hasExplicitContent:
            filter_explicit === "true"
              ? searchResults.items.length !== filteredItems.length
              : undefined,
        },
        suggestions: suggestions,
      },
      metadata: {
        responseTime: `${responseTime}ms`,
        serverTime: new Date().toISOString(),
        searchEngine: "YTMusicAdvanced",
        strategy: strategy,
        cacheStatus: searchResults.cacheStatus || "unknown",
      },
    };

    console.log(
      `✅ Enhanced search completed: "${cleanedQuery}" - ${filteredItems.length} results in ${responseTime}ms`
    );

    res.json(response);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("❌ Enhanced search error:", error.message);

    // Enhanced error handling
    let statusCode = 500;
    let errorMessage = "Search failed";

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
      error.message.includes("ECONNRESET")
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
      }),
    });
  }
};

export const getSearchStats = async (req, res) => {
  try {
    const client = await initializeMusicClient();
    const clientStatus = client.getStatus();

    const cacheStats = {
      cacheEnabled: clientStatus.cacheEnabled,
      cacheSize: clientStatus.cacheSize,
      searchCache: clientStatus.searchCache,
      initialized: clientStatus.initialized,
      endpoints: clientStatus.endpoints,
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      cache: cacheStats,
      engine: "YTMusicAdvanced",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Search stats error:", error.message);
    res.status(500).json({
      error: "Failed to get search stats",
      message: error.message,
    });
  }
};

export const clearSearchCache = async (req, res) => {
  try {
    const client = await initializeMusicClient();
    await client.clearCache();

    res.json({
      success: true,
      message: "YTMusicAdvanced search cache cleared successfully",
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
 * New endpoint: Get search suggestions only
 */
export const getSearchSuggestions = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid query",
        message: "Query parameter is required for suggestions",
      });
    }

    const client = await initializeMusicClient();
    const suggestions = await client.getSuggestions(
      query.trim(),
      parseInt(limit)
    );

    res.json({
      success: true,
      query: query,
      suggestions: suggestions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Search suggestions error:", error.message);
    res.status(500).json({
      error: "Failed to get search suggestions",
      message: error.message,
    });
  }
};

/**
 * New endpoint: Advanced search with filters
 */
export const advancedFilteredSearch = async (req, res) => {
  const startTime = Date.now();

  try {
    const { query, filters = {}, limit = 25 } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid query",
        message: "Query parameter is required in request body",
      });
    }

    const client = await initializeMusicClient();
    const searchResults = await client.advancedSearch(query.trim(), {
      ...filters,
      limit: Math.min(parseInt(limit), 50),
    });

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
        searchType: searchResults.searchType,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("❌ Advanced filtered search error:", error.message);

    res.status(500).json({
      error: "Advanced search failed",
      message: error.message,
      query: req.body.query || null,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    });
  }
};
