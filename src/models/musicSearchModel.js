import YTMusic from "ytmusic-api";

const ytmusic = new YTMusic();
let isInitialized = false;
let initializationPromise = null;

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
  if (isInitialized) return;

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      await ytmusic.initialize();
      isInitialized = true;
      console.log("✅ YTMusic API initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize YTMusic:", error.message);
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
};

/**
 * Enhanced search with multiple search strategies
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

  await initYTMusic();

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
    const title = (item.title || item.name || "").toLowerCase();
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
    const title = (item.title || item.name || "").toLowerCase();
    const artist = (item.artist?.name || item.author || "").toLowerCase();
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

    // Bonus for having view/play counts (indicates popularity)
    if (item.viewCount || item.playCount) score += 20;

    // Duration bonus for normal song length (2-6 minutes)
    const duration = item.duration || 0;
    if (duration >= 120 && duration <= 360) score += 10;

    return Math.max(0, score);
  };

  const processItems = (items, searchType = "all") => {
    if (!Array.isArray(items)) {
      console.warn("⚠️ Invalid items array received");
      return;
    }

    const processedItems = [];

    for (const item of items) {
      try {
        const type = (item.resultType || item.type || "").toLowerCase();
        const thumbnail = item.thumbnails?.at(-1)?.url || null;
        const relevanceScore = calculateRelevanceScore(item, normalizedQuery);

        // Enhanced searchable fields
        const searchableFields = [
          item.title,
          item.name,
          item.artist?.name,
          item.author,
          ...(Array.isArray(item.artists)
            ? item.artists.map((a) => a?.name).filter(Boolean)
            : []),
        ].filter(Boolean);

        const isQueryMatched = searchableFields.some((field) =>
          field.toLowerCase().includes(normalizedQuery.toLowerCase())
        );

        const processedItem = {
          ...item,
          relevanceScore,
          isCompilation: isCompilation(item),
        };
        processedItems.push(processedItem);

        switch (type) {
          case "song":
            result.songs.push({
              type: "song",
              title: item.title || item.name || "Unknown Title",
              artists: Array.isArray(item.artists)
                ? item.artists
                    .map((a) => a?.name)
                    .filter(Boolean)
                    .join(", ")
                : item.artist?.name || "Unknown Artist",
              videoId: item.videoId,
              audioUrl: item.videoId
                ? `https://www.youtube.com/watch?v=${item.videoId}`
                : null,
              duration: item.duration || null,
              thumbnail,
              isExplicit: item.isExplicit || false,
              relevanceScore,
              playCount: item.playCount || null,
            });
            break;

          case "album":
            result.albums.push({
              type: "album",
              title: item.title || item.name || "Unknown Album",
              artist: item.artist?.name || "Unknown Artist",
              year: item.year || null,
              albumId: item.albumId || null,
              browseId: item.browseId || item.playlistId || null,
              url:
                item.browseId || item.playlistId
                  ? `https://music.youtube.com/browse/${
                      item.browseId || item.playlistId
                    }`
                  : null,
              thumbnail,
              trackCount: item.trackCount || null,
              relevanceScore,
            });
            break;

          case "video":
            // Only add videos that aren't compilations or add them separately
            const videoData = {
              type: "video",
              title: item.title || item.name || "Unknown Video",
              author: item.author || item.artist?.name || "Unknown Author",
              duration: item.duration || null,
              videoId: item.videoId,
              url: item.videoId
                ? `https://www.youtube.com/watch?v=${item.videoId}`
                : null,
              thumbnail,
              viewCount: item.viewCount || null,
              relevanceScore,
              isCompilation: isCompilation(item),
            };

            result.videos.push(videoData);

            // Add as song if it's not a compilation and matches query
            if (
              item.videoId &&
              item.duration &&
              isQueryMatched &&
              !isCompilation(item)
            ) {
              result.songs.push({
                type: "song",
                title: item.title || item.name || "Unknown Title",
                artists: Array.isArray(item.artists)
                  ? item.artists
                      .map((a) => a?.name)
                      .filter(Boolean)
                      .join(", ")
                  : item.artist?.name || item.author || "Unknown Artist",
                videoId: item.videoId,
                audioUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
                duration: item.duration,
                thumbnail,
                isExplicit: false,
                source: "video",
                relevanceScore,
              });
            }
            break;

          case "playlist":
            result.communityPlaylists.push({
              type: "playlist",
              title: item.title || item.name || "Unknown Playlist",
              author: item.artist?.name || item.author || "Unknown Author",
              playlistId: item.playlistId,
              count: item.itemCount || item.trackCount || null,
              url: item.playlistId
                ? `https://music.youtube.com/playlist?list=${item.playlistId}`
                : null,
              thumbnail,
              description: item.description || null,
              relevanceScore,
            });
            break;

          case "artist":
            result.artists.push({
              type: "artist",
              name: item.name || "Unknown Artist",
              browseId: item.browseId || item.artistId || null,
              subscribers: item.subscriberCount || null,
              url:
                item.browseId || item.artistId
                  ? `https://music.youtube.com/channel/${
                      item.browseId || item.artistId
                    }`
                  : null,
              thumbnail,
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
                title: item.title || item.name || "Unknown Title",
                artists: Array.isArray(item.artists)
                  ? item.artists
                      .map((a) => a?.name)
                      .filter(Boolean)
                      .join(", ")
                  : item.artist?.name || item.author || "Unknown Artist",
                videoId: item.videoId,
                audioUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
                duration: item.duration,
                thumbnail,
                isExplicit: false,
                source: "unknown",
                relevanceScore,
              });
            }
            break;
        }
      } catch (itemError) {
        console.error("⚠️ Error processing item:", itemError.message, item);
      }
    }

    return processedItems;
  };

  // Multi-strategy search approach
  const multiStrategySearch = async () => {
    const searchStrategies = [
      { type: "song", weight: 1.0 },
      { type: "all", weight: 0.8 },
      { type: "video", weight: 0.6 },
    ];

    let allItems = [];
    let bestResults = null;

    for (const strategy of searchStrategies) {
      try {
        console.log(
          `🔍 Trying search strategy: ${strategy.type} for "${normalizedQuery}"`
        );

        const items = await ytmusic.search(normalizedQuery, strategy.type);

        if (Array.isArray(items) && items.length > 0) {
          const processedItems = processItems(items, strategy.type);

          // Apply strategy weight to relevance scores
          processedItems.forEach((item) => {
            if (item.relevanceScore) {
              item.relevanceScore *= strategy.weight;
            }
          });

          allItems.push(...processedItems);

          // Check if this strategy gave us good song results
          const songCount = items.filter(
            (item) =>
              (item.resultType || item.type || "").toLowerCase() === "song" ||
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

    if (Array.isArray(items)) {
      processItems(items);
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
      errorMessage: error.message || "YTMusic search failed",
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
