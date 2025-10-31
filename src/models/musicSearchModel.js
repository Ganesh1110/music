import YTMusicAdvanced from "ytmusic-advanced";

// Initialize YTMusicAdvanced client
let musicClient;
let isInitialized = false;

// Enhanced cache with TTL and size limits
class SearchCache {
  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  get(key) {
    const item = this.cache.get(key.toLowerCase());
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key.toLowerCase());
      return null;
    }

    item.lastAccessed = Date.now();
    return item.data;
  }

  set(key, data, ttl = this.defaultTTL) {
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key.toLowerCase(), {
      data,
      expires: Date.now() + ttl,
      lastAccessed: Date.now(),
    });
  }

  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (value.lastAccessed < oldestTime) {
        oldestTime = value.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new SearchCache();

export const initYTMusic = async () => {
  if (isInitialized) return musicClient;

  try {
    musicClient = await YTMusicAdvanced.initialize({
      cacheEnabled: true,
      language: "en",
      country: "US",
    });
    isInitialized = true;
    console.log("✅ YTMusicAdvanced initialized successfully");
    return musicClient;
  } catch (error) {
    console.error("❌ Failed to initialize YTMusicAdvanced:", error.message);
    isInitialized = false;
    throw new Error(`YTMusicAdvanced initialization failed: ${error.message}`);
  }
};

/**
 * Enhanced search with YTMusicAdvanced
 */
export const searchSongs = async (query) => {
  if (!query || typeof query !== "string" || !query.trim()) {
    throw new Error("Invalid query provided");
  }

  const normalizedQuery = query.trim();

  // Check cache first
  const cachedResult = cache.get(normalizedQuery);
  if (cachedResult) {
    console.log(`📋 Cache hit for query: "${normalizedQuery}"`);
    return cachedResult;
  }

  const client = await initYTMusic();

  const result = {
    songs: [],
    albums: [],
    videos: [],
    communityPlaylists: [],
    artists: [],
    query: normalizedQuery,
    timestamp: new Date().toISOString(),
  };

  // Helper function to determine if a video is likely a compilation
  const isCompilation = (item) => {
    const title = (item.title || "").toLowerCase();
    const duration = item.duration || 0;

    // Check for compilation indicators
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
    ];

    const hasCompilationKeywords = compilationKeywords.some((keyword) =>
      title.includes(keyword)
    );

    // Long duration (over 10 minutes) often indicates compilation
    const isLongDuration = duration > 600; // 10 minutes

    return hasCompilationKeywords || isLongDuration;
  };

  // Helper function to calculate relevance score
  const calculateRelevanceScore = (item, searchQuery) => {
    const title = (item.title || "").toLowerCase();
    const artist = (item.author || "").toLowerCase();
    const query = searchQuery.toLowerCase();

    let score = 0;

    // Exact matches get highest score
    if (title === query) score += 100;
    if (artist === query) score += 90;

    // Title starts with query
    if (title.startsWith(query)) score += 50;

    // Title contains query
    if (title.includes(query)) score += 30;

    // Artist matches
    if (artist.includes(query)) score += 40;

    // Penalty for compilations
    if (isCompilation(item)) score -= 30;

    // Bonus for having view counts (indicates popularity)
    if (item.viewCount) score += 20;

    // Duration bonus for normal song length (2-6 minutes)
    const duration = item.duration || 0;
    if (duration >= 120 && duration <= 360) score += 10;

    return Math.max(0, score);
  };

  const processItems = (items) => {
    if (!Array.isArray(items)) {
      console.warn("⚠️ Invalid items array received");
      return;
    }

    for (const item of items) {
      try {
        const category = item.category || item.type || "";
        const relevanceScore = calculateRelevanceScore(item, normalizedQuery);

        // Enhanced searchable fields
        const searchableFields = [item.title, item.author, item.album].filter(
          Boolean
        );

        const isQueryMatched = searchableFields.some((field) =>
          field.toLowerCase().includes(normalizedQuery.toLowerCase())
        );

        switch (category) {
          case "song":
          case "video":
            // Handle both songs and videos
            const isSong =
              category === "song" ||
              (item.duration && !isCompilation(item) && isQueryMatched);

            if (isSong) {
              result.songs.push({
                type: "song",
                title: item.title || "Unknown Title",
                artists: item.author || "Unknown Artist",
                videoId: item.videoId,
                audioUrl: item.videoId
                  ? `https://www.youtube.com/watch?v=${item.videoId}`
                  : null,
                duration: item.duration || null,
                durationFormatted: item.durationFormatted,
                thumbnail: item.thumbnails?.[0]?.url,
                isExplicit: item.isExplicit || false,
                relevanceScore,
                viewCount: item.viewCount || null,
                album: item.album,
                year: item.year,
              });
            } else {
              // Add as video
              result.videos.push({
                type: "video",
                title: item.title || "Unknown Video",
                author: item.author || "Unknown Author",
                duration: item.duration || null,
                durationFormatted: item.durationFormatted,
                videoId: item.videoId,
                url: item.videoId
                  ? `https://www.youtube.com/watch?v=${item.videoId}`
                  : null,
                thumbnail: item.thumbnails?.[0]?.url,
                viewCount: item.viewCount || null,
                relevanceScore,
                isCompilation: isCompilation(item),
              });
            }
            break;

          case "album":
            result.albums.push({
              type: "album",
              title: item.title || "Unknown Album",
              artist: item.author || "Unknown Artist",
              year: item.year || null,
              albumId: item.albumId || item.videoId,
              browseId: item.browseId || null,
              url: item.albumId
                ? `https://music.youtube.com/browse/${item.albumId}`
                : null,
              thumbnail: item.thumbnails?.[0]?.url,
              trackCount: item.trackCount || null,
              relevanceScore,
            });
            break;

          case "playlist":
            result.communityPlaylists.push({
              type: "playlist",
              title: item.title || "Unknown Playlist",
              author: item.author || "Unknown Author",
              playlistId: item.playlistId || item.videoId,
              count: item.itemCount || item.trackCount || null,
              url: item.playlistId
                ? `https://music.youtube.com/playlist?list=${item.playlistId}`
                : null,
              thumbnail: item.thumbnails?.[0]?.url,
              description: item.description || null,
              relevanceScore,
            });
            break;

          case "artist":
            result.artists.push({
              type: "artist",
              name: item.author || item.title || "Unknown Artist",
              browseId: item.browseId || item.videoId,
              subscribers: item.subscriberCount || null,
              url: item.browseId
                ? `https://music.youtube.com/channel/${item.browseId}`
                : null,
              thumbnail: item.thumbnails?.[0]?.url,
              verified: item.verified || false,
              relevanceScore,
            });
            break;

          default:
            // Handle unclassified items that might be songs
            if (
              item.videoId &&
              item.duration &&
              isQueryMatched &&
              !isCompilation(item)
            ) {
              result.songs.push({
                type: "song",
                title: item.title || "Unknown Title",
                artists: item.author || "Unknown Artist",
                videoId: item.videoId,
                audioUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
                duration: item.duration,
                durationFormatted: item.durationFormatted,
                thumbnail: item.thumbnails?.[0]?.url,
                isExplicit: false,
                source: "unknown",
                relevanceScore,
                viewCount: item.viewCount,
              });
            }
            break;
        }
      } catch (itemError) {
        console.error("⚠️ Error processing item:", itemError.message, item);
      }
    }
  };

  // Multi-strategy search approach with YTMusicAdvanced
  const multiStrategySearch = async () => {
    const searchStrategies = [
      { type: "music", method: client.searchMusic, weight: 1.0 },
      { type: "all", method: client.searchAll, weight: 0.8 },
      { type: "quick", method: client.quickSearch, weight: 0.6 },
    ];

    let allItems = [];
    let bestResults = null;

    for (const strategy of searchStrategies) {
      try {
        console.log(
          `🔍 Trying search strategy: ${strategy.type} for "${normalizedQuery}"`
        );

        const searchResults = await strategy.method.call(
          client,
          normalizedQuery,
          {
            limit: 20,
          }
        );

        if (
          searchResults.success &&
          Array.isArray(searchResults.items) &&
          searchResults.items.length > 0
        ) {
          const items = searchResults.items;

          // Apply strategy weight to relevance scores
          items.forEach((item) => {
            if (item.relevanceScore) {
              item.relevanceScore *= strategy.weight;
            }
          });

          allItems.push(...items);

          // Check if this strategy gave us good song results
          const songCount = items.filter(
            (item) =>
              item.category === "song" ||
              item.type === "song" ||
              (item.videoId && item.duration && !isCompilation(item))
          ).length;

          if (songCount >= 3 && !bestResults) {
            bestResults = items;
            console.log(
              `✅ Found good results with ${strategy.type} strategy: ${songCount} songs`
            );
          }
        }

        // Small delay between strategies
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.warn(`⚠️ Strategy ${strategy.type} failed:`, error.message);
      }
    }

    return bestResults || allItems;
  };

  try {
    const items = await multiStrategySearch();

    if (Array.isArray(items) && items.length > 0) {
      processItems(items);
    } else {
      // Fallback to basic search if multi-strategy fails
      console.log(`🔄 Falling back to basic search for "${normalizedQuery}"`);
      const basicResults = await client.searchMusic(normalizedQuery, {
        limit: 20,
      });
      if (basicResults.success && Array.isArray(basicResults.items)) {
        processItems(basicResults.items);
      }
    }

    // Sort results by relevance score
    result.songs.sort(
      (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)
    );
    result.albums.sort(
      (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)
    );
    result.videos.sort(
      (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)
    );
    result.communityPlaylists.sort(
      (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)
    );
    result.artists.sort(
      (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)
    );

    // Remove duplicates based on videoId for songs
    const seenVideoIds = new Set();
    result.songs = result.songs.filter((song) => {
      if (song.videoId && seenVideoIds.has(song.videoId)) {
        return false;
      }
      if (song.videoId) {
        seenVideoIds.add(song.videoId);
      }
      return true;
    });

    // Add metadata
    result.totalResults =
      result.songs.length +
      result.albums.length +
      result.videos.length +
      result.communityPlaylists.length +
      result.artists.length;

    // Cache the result
    cache.set(normalizedQuery, result);

    console.log(
      `✅ Multi-strategy search completed for "${normalizedQuery}": ${result.totalResults} total results`
    );
    console.log(
      `📊 Songs: ${result.songs.length}, Albums: ${result.albums.length}, Videos: ${result.videos.length}`
    );

    return result;
  } catch (error) {
    console.error("❌ Multi-strategy search failed:", error.message);

    const errorResult = {
      ...result,
      error: true,
      errorMessage: error.message || "YTMusicAdvanced search failed",
      totalResults: 0,
    };

    return errorResult;
  }
};

export const clearSearchCache = () => {
  cache.clear();
  console.log("🗑️ Search cache cleared");
};

export const getCacheStats = () => {
  return {
    size: cache.cache.size,
    maxSize: cache.maxSize,
    defaultTTL: cache.defaultTTL,
  };
};

/**
 * Additional enhanced methods with YTMusicAdvanced
 */
export const advancedSearch = async (query, filters = {}) => {
  const client = await initYTMusic();
  const searchResults = await client.advancedSearch(query, filters);

  if (!searchResults.success) {
    throw new Error(searchResults.error || "Advanced search failed");
  }

  return searchResults;
};

export const getSearchSuggestions = async (query, limit = 10) => {
  const client = await initYTMusic();
  return await client.getSuggestions(query, limit);
};

export const getClientStatus = async () => {
  const client = await initYTMusic();
  return client.getStatus();
};
