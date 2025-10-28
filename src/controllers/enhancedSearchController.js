import AdvancedYTSearchService from "../services/advancedYTSearchService.js";

export const enhancedSearch = async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      query,
      limit = 25,
      type = "all",
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

    // Parse types
    const types =
      type === "all"
        ? ["songs", "videos", "albums", "artists", "playlists"]
        : type.split(",").map((t) => t.trim());

    // Parse options
    const options = {
      limit: Math.min(parseInt(limit), 50), // Cap at 50
      types,
      strategy: ["fast", "comprehensive", "accurate"].includes(strategy)
        ? strategy
        : "comprehensive",
      filterExplicit: filter_explicit === "true",
      includeSuggestions: include_suggestions === "true",
    };

    console.log(`🔍 Enhanced search: "${cleanedQuery}" [${strategy}]`);

    const results = await AdvancedYTSearchService.advancedSearch(
      cleanedQuery,
      options
    );

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      query: cleanedQuery,
      data: results,
      metadata: {
        ...results.metadata,
        responseTime: `${responseTime}ms`,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("❌ Enhanced search error:", error.message);

    res.status(500).json({
      error: "Search failed",
      message: error.message,
      query: req.query.query || null,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    });
  }
};

export const getSearchStats = async (req, res) => {
  try {
    const cacheStats = AdvancedYTSearchService.getCacheStats();

    res.json({
      success: true,
      cache: cacheStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get search stats",
      message: error.message,
    });
  }
};

export const clearSearchCache = async (req, res) => {
  try {
    AdvancedYTSearchService.clearCache();

    res.json({
      success: true,
      message: "Search cache cleared successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to clear cache",
      message: error.message,
    });
  }
};
