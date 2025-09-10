import {
  searchSongs,
  getCacheStats,
  clearSearchCache,
} from "../models/musicSearchModel.js";

/**
 * Enhanced search controller with better validation and error handling
 */
export const searchMusic = async (req, res) => {
  const startTime = Date.now();

  try {
    const { query } = req.query;

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
      `🔍 Search request: "${trimmedQuery}" from ${req.ip || "unknown IP"}`
    );

    const results = await searchSongs(trimmedQuery);
    const responseTime = Date.now() - startTime;

    // Check if search returned an error
    if (results.error) {
      return res.status(503).json({
        error: "Search service unavailable",
        message:
          results.errorMessage ||
          "Search failed due to external service issues",
        query: trimmedQuery,
        responseTime: `${responseTime}ms`,
        retryAfter: "30 seconds",
      });
    }

    // Enhanced response with metadata
    const response = {
      success: true,
      query: trimmedQuery,
      data: results,
      metadata: {
        totalResults: results.totalResults || 0,
        responseTime: `${responseTime}ms`,
        timestamp: results.timestamp,
        categories: {
          songs: results.songs?.length || 0,
          albums: results.albums?.length || 0,
          videos: results.videos?.length || 0,
          playlists: results.communityPlaylists?.length || 0,
          artists: results.artists?.length || 0,
        },
      },
    };

    // Log successful search
    console.log(
      `✅ Search completed: "${trimmedQuery}" - ${results.totalResults} results in ${responseTime}ms`
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
        stack: error.stack,
      }),
    });
  }
};

/**
 * Get search cache statistics (useful for monitoring)
 */
export const getCacheStatistics = async (req, res) => {
  try {
    const stats = getCacheStats();

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
 * Clear search cache (admin endpoint)
 */
export const clearCache = async (req, res) => {
  try {
    clearSearchCache();

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
 * Health check endpoint for search service
 */
export const healthCheck = async (req, res) => {
  try {
    // Test with a simple query
    const testResult = await searchSongs("test", 1); // Quick test search

    res.json({
      status: "healthy",
      service: "search",
      ytmusicInitialized: true,
      lastCheck: new Date().toISOString(),
      cacheStats: getCacheStats(),
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      service: "search",
      error: error.message,
      lastCheck: new Date().toISOString(),
    });
  }
};
