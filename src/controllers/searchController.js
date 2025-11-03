import YTMusicAdvanced from "ytmusic-advanced";
import ytmusicService from "../services/ytmusicService.js";

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

    // Validation
    if (!query?.trim()) {
      return res.status(400).json({
        error: "Invalid query",
        message: "Query parameter is required",
      });
    }

    const cleanedQuery = query.trim();
    console.log(`🔍 Search: "${cleanedQuery}" [${type}]`);

    let searchResults;
    const searchLimit = Math.min(parseInt(limit), 50);

    // Use enhanced YTMusicAdvanced methods
    switch (type) {
      case "quick":
        searchResults = await ytmusicService.quickSearch(cleanedQuery, {
          limit: searchLimit,
        });
        break;
      case "all":
        searchResults = await ytmusicService.searchMusic(cleanedQuery, {
          limit: searchLimit,
        });
        break;
      case "music":
      default:
        searchResults = await ytmusicService.searchMusic(cleanedQuery, {
          limit: searchLimit,
        });
        break;
    }

    const responseTime = Date.now() - startTime;

    if (!searchResults.success) {
      return res.status(503).json({
        error: "Search service unavailable",
        message: searchResults.error,
        query: cleanedQuery,
        responseTime: `${responseTime}ms`,
      });
    }

    // Enhanced response format
    const response = {
      success: true,
      query: cleanedQuery,
      type: type,
      data: {
        items: searchResults.items || [],
        metadata: {
          totalResults:
            searchResults.totalResults || searchResults.items?.length || 0,
          searchType: searchResults.searchType,
          relevanceScore: searchResults.relevanceScore,
        },
      },
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        searchEngine: "YTMusicAdvanced",
      },
    };

    console.log(
      `✅ Search completed: "${cleanedQuery}" - ${response.data.items.length} results`
    );
    res.json(response);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("❌ Search error:", error.message);

    res.status(500).json({
      error: "Search failed",
      message: error.message,
      query: req.query.query,
      responseTime: `${responseTime}ms`,
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
    const { query, limit = 10 } = req.query;

    if (!query?.trim()) {
      return res.status(400).json({
        error: "Query is required",
      });
    }

    const suggestions = await ytmusicService.getSuggestions(
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
  try {
    const { query, filters = {} } = req.body;

    if (!query?.trim()) {
      return res.status(400).json({
        error: "Query is required",
      });
    }

    const searchResults = await ytmusicService.advancedSearch(
      query.trim(),
      filters
    );

    res.json({
      success: true,
      query: query,
      filters: filters,
      data: searchResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Advanced search error:", error.message);
    res.status(500).json({
      error: "Advanced search failed",
      message: error.message,
    });
  }
};
