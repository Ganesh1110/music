import YTMusicAdvanced from "ytmusic-advanced";

class AdvancedYTSearchService {
  constructor() {
    this.musicClient = null;
    this.initialized = false;
    this.searchCache = new Map();
    this.CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  }

  async initialize() {
    if (!this.initialized) {
      this.musicClient = await YTMusicAdvanced.initialize({
        cacheEnabled: true,
        language: "en",
        country: "US",
      });
      this.initialized = true;
      console.log(
        "✅ Advanced YTMusic Search initialized with YTMusicAdvanced"
      );
    }
    return this.musicClient;
  }

  /**
   * Main enhanced search method using YTMusicAdvanced
   */
  async advancedSearch(query, options = {}) {
    const client = await this.initialize();

    const {
      limit = 25,
      types = ["songs", "videos", "albums", "artists", "playlists"],
      strategy = "comprehensive",
      includeSuggestions = true,
      filterExplicit = false,
      minDuration = 30, // seconds
      maxDuration = 600, // seconds
    } = options;

    const searchId = `${query}-${JSON.stringify(options)}`;

    // Check cache first
    const cached = this.getFromCache(searchId);
    if (cached) {
      console.log(`📋 Cache hit for: "${query}"`);
      return cached;
    }

    const startTime = Date.now();

    try {
      let results;

      switch (strategy) {
        case "fast":
          results = await this.fastSearch(client, query, types, limit);
          break;
        case "comprehensive":
          results = await this.comprehensiveSearch(client, query, types, limit);
          break;
        case "accurate":
          results = await this.accurateSearch(client, query, types, limit);
          break;
        default:
          results = await this.comprehensiveSearch(client, query, types, limit);
      }

      // Apply filters
      if (filterExplicit) {
        results.songs = results.songs.filter((song) => !song.isExplicit);
        results.videos = results.videos.filter((video) => !video.isExplicit);
      }

      if (minDuration || maxDuration) {
        results.songs = results.songs.filter(
          (song) =>
            !song.duration ||
            (song.duration >= minDuration && song.duration <= maxDuration)
        );
        results.videos = results.videos.filter(
          (video) =>
            !video.duration ||
            (video.duration >= minDuration && video.duration <= maxDuration)
        );
      }

      // Add metadata
      results.metadata = {
        query,
        searchTime: Date.now() - startTime,
        strategy,
        totalResults: this.calculateTotal(results),
        timestamp: new Date().toISOString(),
        cache: false,
      };

      // Generate suggestions if requested
      if (includeSuggestions) {
        results.suggestions = await this.generateSmartSuggestions(
          client,
          query,
          results
        );
      }

      // Cache the results
      this.setCache(searchId, results);

      console.log(
        `✅ Search completed: "${query}" - ${results.metadata.totalResults} results in ${results.metadata.searchTime}ms`
      );

      return results;
    } catch (error) {
      console.error(`❌ Search failed for "${query}":`, error.message);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Fast search using YTMusicAdvanced methods
   */
  async fastSearch(client, query, types, limit) {
    const results = {
      songs: [],
      videos: [],
      albums: [],
      artists: [],
      playlists: [],
    };

    try {
      // Use appropriate YTMusicAdvanced search method based on types
      let searchResults;

      if (
        types.includes("songs") ||
        (types.length === 1 && types[0] === "songs")
      ) {
        searchResults = await client.searchMusic(query, { limit: limit * 2 });
      } else if (types.includes("all") || types.length > 2) {
        searchResults = await client.searchAll(query, { limit: limit * 2 });
      } else {
        searchResults = await client.searchMusic(query, { limit: limit * 2 });
      }

      if (searchResults.success && Array.isArray(searchResults.items)) {
        const processedItems = this.processYTMusicResults(
          searchResults.items,
          query
        );

        // Categorize results
        processedItems.forEach((item) => {
          const category = this.mapCategory(item.category || item.type);
          if (types.includes(category)) {
            results[category].push(item);
          }
        });
      }
    } catch (error) {
      console.warn(`⚠️ Fast search failed:`, error.message);
    }

    return this.enhanceResults(results, query);
  }

  /**
   * Comprehensive search with multiple strategies
   */
  async comprehensiveSearch(client, query, types, limit) {
    const strategies = [
      // Primary search
      this.fastSearch(client, query, types, limit * 2),

      // Query variations
      this.queryVariationSearch(client, query, types, Math.floor(limit / 2)),

      // Quick search for additional results
      this.quickSearchFallback(client, query, types, Math.floor(limit / 3)),
    ];

    const results = await Promise.allSettled(strategies);
    const mergedResults = this.mergeMultipleResults(results, query);

    return this.deduplicateAndRank(mergedResults, limit);
  }

  /**
   * Accurate search with advanced scoring
   */
  async accurateSearch(client, query, types, limit) {
    const [primaryResults, quickResults] = await Promise.all([
      this.fastSearch(client, query, types, limit * 3),
      this.quickSearchFallback(client, query, types, limit * 2),
    ]);

    const merged = this.mergeResults([primaryResults, quickResults]);
    const scoredResults = this.applyAdvancedScoring(merged, query);

    return this.filterHighQualityResults(scoredResults, limit);
  }

  /**
   * Search with query variations using YTMusicAdvanced
   */
  async queryVariationSearch(client, query, types, limit) {
    const variations = this.generateQueryVariations(query);
    const variationPromises = variations.map((variation) =>
      this.fastSearch(
        client,
        variation,
        types,
        Math.floor(limit / variations.length)
      ).catch(() => ({
        songs: [],
        videos: [],
        albums: [],
        artists: [],
        playlists: [],
      }))
    );

    const results = await Promise.allSettled(variationPromises);
    return this.mergeMultipleResults(results, query);
  }

  /**
   * Quick search fallback using YTMusicAdvanced quickSearch
   */
  async quickSearchFallback(client, query, types, limit) {
    try {
      const quickResults = await client.quickSearch(query, {
        limit: limit * 2,
      });

      if (quickResults.success && Array.isArray(quickResults.items)) {
        const processedItems = this.processYTMusicResults(
          quickResults.items,
          query
        );
        const results = {
          songs: [],
          videos: [],
          albums: [],
          artists: [],
          playlists: [],
        };

        processedItems.forEach((item) => {
          const category = this.mapCategory(item.category || item.type);
          if (types.includes(category)) {
            results[category].push(item);
          }
        });

        return results;
      }
    } catch (error) {
      console.warn(`⚠️ Quick search fallback failed:`, error.message);
    }

    return {
      songs: [],
      videos: [],
      albums: [],
      artists: [],
      playlists: [],
    };
  }

  /**
   * Process YTMusicAdvanced results to consistent format
   */
  processYTMusicResults(items, originalQuery) {
    if (!Array.isArray(items)) return [];

    return items.map((item) => {
      const category = this.mapCategory(item.category || item.type);

      const processedItem = {
        ...item,
        // Standardize field names
        title: item.title || "Unknown Title",
        author: item.author || "Unknown Artist",
        duration: item.duration,
        durationFormatted: item.durationFormatted,
        thumbnails: item.thumbnails || [],
        videoId: item.videoId,
        viewCount: item.viewCount,
        isExplicit: item.isExplicit || false,
        category: category,
        type: category,

        // Enhanced fields
        relevanceScore: this.calculateRelevanceScore(
          item,
          originalQuery,
          category
        ),
        searchMetadata: {
          matchedQuery: originalQuery,
          matchType: this.determineMatchType(item, originalQuery, category),
          confidence: this.calculateRelevanceScore(
            item,
            originalQuery,
            category
          ),
        },
        isLikelySong: this.isLikelySong(item),
        qualityScore: this.calculateQualityScore(item),
      };

      // Add type-specific IDs
      if (category === "album" && !item.albumId) {
        processedItem.albumId = item.videoId;
      }
      if (category === "playlist" && !item.playlistId) {
        processedItem.playlistId = item.videoId;
      }
      if (category === "artist" && !item.artistId) {
        processedItem.artistId = item.videoId;
      }

      return processedItem;
    });
  }

  /**
   * Map YTMusicAdvanced categories to our internal types
   */
  mapCategory(category) {
    const categoryMap = {
      song: "songs",
      video: "videos",
      album: "albums",
      artist: "artists",
      playlist: "playlists",
      songs: "songs",
      videos: "videos",
      albums: "albums",
      artists: "artists",
      playlists: "playlists",
    };

    return categoryMap[category] || "videos";
  }

  /**
   * Advanced relevance scoring (adapted for YTMusicAdvanced data structure)
   */
  calculateRelevanceScore(item, query, type) {
    const queryTerms = query.toLowerCase().split(/\s+/);
    let score = 0;

    const title = (item.title || "").toLowerCase();
    const artist = (item.author || "").toLowerCase();

    // Exact matches (highest priority)
    if (title === query.toLowerCase()) score += 3.0;
    if (artist === query.toLowerCase()) score += 2.5;

    // Title contains full query
    if (title.includes(query.toLowerCase())) score += 2.0;

    // Individual term matching
    queryTerms.forEach((term) => {
      if (title.includes(term)) score += 0.8;
      if (artist.includes(term)) score += 0.6;
    });

    // Type-specific bonuses
    if (type === "songs") {
      // Prefer standard song length (2-6 minutes)
      const duration = item.duration || 0;
      if (duration >= 120 && duration <= 360) score += 0.5;

      // Bonus for popular songs
      if (item.viewCount > 1000000) score += 0.3;

      // Small penalty for very long durations (likely mixes)
      if (duration > 600) score -= 0.3;
    }

    // Penalty for compilation-like titles
    if (this.isCompilation(item)) score -= 0.5;

    return Math.max(0, Math.min(score, 5.0));
  }

  /**
   * Determine how well the item matches the query
   */
  determineMatchType(item, query, type) {
    const title = (item.title || "").toLowerCase();
    const artist = (item.author || "").toLowerCase();
    const queryLower = query.toLowerCase();

    if (title === queryLower) return "exact_title";
    if (artist === queryLower) return "exact_artist";
    if (title.includes(queryLower)) return "title_contains";
    if (artist.includes(queryLower)) return "artist_contains";

    const queryTerms = queryLower.split(/\s+/);
    const titleTerms = title.split(/\s+/);
    const artistTerms = artist.split(/\s+/);

    const titleTermMatches = queryTerms.filter((term) =>
      titleTerms.some((titleTerm) => titleTerm.includes(term))
    ).length;

    const artistTermMatches = queryTerms.filter((term) =>
      artistTerms.some((artistTerm) => artistTerm.includes(term))
    ).length;

    if (titleTermMatches === queryTerms.length) return "all_title_terms";
    if (artistTermMatches === queryTerms.length) return "all_artist_terms";
    if (titleTermMatches > 0 && artistTermMatches > 0) return "mixed_terms";
    if (titleTermMatches > 0) return "partial_title";
    if (artistTermMatches > 0) return "partial_artist";

    return "weak";
  }

  /**
   * Calculate overall quality score
   */
  calculateQualityScore(item) {
    let score = 0.5; // Base score

    // Duration quality (prefer standard song lengths)
    if (item.duration) {
      if (item.duration >= 120 && item.duration <= 360) score += 0.3;
      else if (item.duration >= 60 && item.duration <= 480) score += 0.1;
    }

    // Popularity indicators
    if (item.viewCount > 1000000) score += 0.1;

    // Quality indicators from YTMusicAdvanced
    if (item.isExplicit) score += 0.05; // Slight bonus for explicit (often official)
    if (item.thumbnails && item.thumbnails.length > 0) score += 0.05;

    return Math.min(score, 1.0);
  }

  /**
   * Check if item is likely a single song vs compilation
   */
  isLikelySong(item) {
    if (!item.title) return true;

    const title = item.title.toLowerCase();
    const duration = item.duration || 0;

    // Compilation indicators
    const compilationKeywords = [
      "playlist",
      "compilation",
      "full album",
      "greatest hits",
      "best of",
      "mix",
      "collection",
      "top 10",
      "best songs",
      "megamix",
      "marathon",
    ];

    const hasCompilationKeyword = compilationKeywords.some((keyword) =>
      title.includes(keyword)
    );

    // Very long duration often indicates compilation
    const isVeryLong = duration > 600; // 10 minutes

    return !hasCompilationKeyword && !isVeryLong;
  }

  isCompilation(item) {
    return !this.isLikelySong(item);
  }

  /**
   * Generate smart search suggestions using YTMusicAdvanced
   */
  async generateSmartSuggestions(client, query, results) {
    const suggestions = new Set();

    try {
      // Get suggestions from YTMusicAdvanced
      const ytSuggestions = await client.getSuggestions(query, 5);
      ytSuggestions.forEach((suggestion) => suggestions.add(suggestion));
    } catch (error) {
      console.warn(
        "⚠️ Failed to get YTMusicAdvanced suggestions:",
        error.message
      );
    }

    // Based on artists found
    results.artists.slice(0, 3).forEach((artist) => {
      suggestions.add(`${artist.author} songs`);
      suggestions.add(`${artist.author} popular`);
    });

    // Based on albums found
    results.albums.slice(0, 2).forEach((album) => {
      suggestions.add(album.title);
      if (album.author) {
        suggestions.add(`${album.author} ${album.title}`);
      }
    });

    // Common variations
    suggestions.add(`${query} lyrics`);
    suggestions.add(`${query} official audio`);
    suggestions.add(`${query} live`);
    suggestions.add(`${query} acoustic`);

    // Remove the original query
    suggestions.delete(query);

    return Array.from(suggestions).slice(0, 8);
  }

  // The following methods remain largely the same as they're utility functions:
  // - generateQueryVariations
  // - mergeMultipleResults
  // - mergeResults
  // - deduplicateAndRank
  // - applyAdvancedScoring
  // - calculateFinalScore
  // - isHighQuality
  // - filterHighQualityResults
  // - enhanceResults
  // - getFromCache
  // - setCache
  // - clearCache
  // - getCacheStats
  // - calculateTotal

  // Keeping the existing implementations for these utility methods:
  generateQueryVariations(query) {
    const variations = new Set();
    const words = query.toLowerCase().split(/\s+/);

    // Original query
    variations.add(query);

    // Remove common filler words
    const fillerWords = new Set([
      "official",
      "video",
      "lyrics",
      "audio",
      "music",
      "song",
      "hd",
      "4k",
    ]);
    const cleaned = words.filter((word) => !fillerWords.has(word));
    if (cleaned.length > 0 && cleaned.join(" ") !== query) {
      variations.add(cleaned.join(" "));
    }

    // Artist-song format variations
    if (words.length >= 2) {
      variations.add(words.slice().reverse().join(" "));
    }

    // Add "topic" for official audio (YouTube Music specific)
    variations.add(`${query} topic`);

    // Remove featuring information for broader search
    const withoutFeat = query
      .replace(/\s+ft\.?\s+.+/i, "")
      .replace(/\s+feat\.?\s+.+/i, "")
      .replace(/\s+featuring\s+.+/i, "");
    if (withoutFeat !== query) {
      variations.add(withoutFeat.trim());
    }

    return Array.from(variations).slice(0, 5);
  }

  mergeMultipleResults(results, query) {
    const successfulResults = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    return this.mergeResults(successfulResults);
  }

  mergeResults(resultsArray) {
    const merged = {
      songs: [],
      videos: [],
      albums: [],
      artists: [],
      playlists: [],
    };

    resultsArray.forEach((results) => {
      Object.keys(merged).forEach((type) => {
        if (results[type] && Array.isArray(results[type])) {
          merged[type].push(...results[type]);
        }
      });
    });

    return merged;
  }

  deduplicateAndRank(results, limit) {
    const processed = {};

    Object.keys(results).forEach((type) => {
      const items = results[type];
      const seen = new Set();

      processed[type] = items
        .filter((item) => {
          const id =
            item.videoId || item.playlistId || item.browseId || item.albumId;
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        })
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, type === "songs" ? limit : Math.floor(limit / 2));
    });

    return processed;
  }

  applyAdvancedScoring(results, query) {
    const scored = { ...results };

    Object.keys(scored).forEach((type) => {
      scored[type] = scored[type].map((item) => ({
        ...item,
        finalScore: this.calculateFinalScore(item, query, type),
        isHighQuality: this.isHighQuality(item, type),
      }));
    });

    return scored;
  }

  calculateFinalScore(item, query, type) {
    const baseScore = item.relevanceScore || 0;
    const qualityScore = item.qualityScore || 0.5;

    // Weight relevance higher than quality
    return baseScore * 0.7 + qualityScore * 0.3;
  }

  isHighQuality(item, type) {
    if (type === "songs" || type === "videos") {
      return (
        (item.qualityScore || 0) > 0.6 &&
        (item.relevanceScore || 0) > 1.0 &&
        this.isLikelySong(item)
      );
    }
    return (item.relevanceScore || 0) > 1.0;
  }

  filterHighQualityResults(results, limit) {
    const filtered = {};

    Object.keys(results).forEach((type) => {
      filtered[type] = results[type]
        .filter((item) => item.isHighQuality)
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, limit);
    });

    return filtered;
  }

  enhanceResults(results, query) {
    const enhanced = { ...results };

    // Ensure all arrays exist
    ["songs", "videos", "albums", "artists", "playlists"].forEach((type) => {
      if (!enhanced[type]) enhanced[type] = [];
    });

    // Sort each category by relevance
    Object.keys(enhanced).forEach((type) => {
      if (Array.isArray(enhanced[type])) {
        enhanced[type].sort(
          (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)
        );
      }
    });

    return enhanced;
  }

  getFromCache(key) {
    const cached = this.searchCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return {
        ...cached.data,
        metadata: { ...cached.data.metadata, cache: true },
      };
    }

    if (cached) {
      this.searchCache.delete(key);
    }

    return null;
  }

  setCache(key, data) {
    this.searchCache.set(key, {
      data,
      timestamp: Date.now(),
    });

    if (this.searchCache.size > 500) {
      const firstKey = this.searchCache.keys().next().value;
      this.searchCache.delete(firstKey);
    }
  }

  clearCache() {
    this.searchCache.clear();
    console.log("🗑️ Search cache cleared");
  }

  getCacheStats() {
    return {
      size: this.searchCache.size,
      maxSize: 500,
      ttl: this.CACHE_TTL,
    };
  }

  calculateTotal(results) {
    return Object.values(results).reduce((total, category) => {
      return total + (Array.isArray(category) ? category.length : 0);
    }, 0);
  }
}

export default new AdvancedYTSearchService();
