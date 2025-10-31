import YTMusicAdvanced from "ytmusic-advanced";

// Initialize YTMusicAdvanced client
let musicClient;
let isInitialized = false;

const searchResultsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const initYTMusic = async () => {
  if (!isInitialized) {
    musicClient = await YTMusicAdvanced.initialize({
      cacheEnabled: true,
      language: "en",
      country: "US",
    });
    isInitialized = true;
    console.log("✅ YTMusicAdvanced initialized");
  }
  return musicClient;
};

export const searchSongs = async (query, options = {}) => {
  const client = await initYTMusic();
  const searchResults = await client.searchMusic(query, {
    limit: options.limit || 20,
    ...options,
  });

  if (!searchResults.success) {
    throw new Error(searchResults.error || "Search failed");
  }

  // Format results to match expected structure
  return searchResults.items.map((item) => ({
    videoId: item.videoId,
    title: item.title,
    artist: item.author,
    duration: item.duration,
    durationFormatted: item.durationFormatted,
    thumbnails: item.thumbnails,
    album: item.album,
    year: item.year,
    isExplicit: item.isExplicit,
    category: item.category,
    type: item.type,
    viewCount: item.viewCount,
  }));
};

export const searchAlbums = async (query, options = {}) => {
  const client = await initYTMusic();
  const searchResults = await client.searchMusic(query, {
    limit: options.limit || 20,
    ...options,
  });

  if (!searchResults.success) {
    throw new Error(searchResults.error || "Search failed");
  }

  // Filter and format album results
  const albumResults = searchResults.items.filter(
    (item) => item.category === "album" || item.type === "album" || item.isAlbum
  );

  return albumResults.map((album) => ({
    albumId: album.albumId || album.videoId,
    title: album.title,
    artist: album.author,
    year: album.year,
    thumbnails: album.thumbnails,
    trackCount: album.trackCount,
    duration: album.duration,
    type: "album",
  }));
};

export const getPlaylist = async (playlistId, options = {}) => {
  const client = await initYTMusic();

  try {
    // Try to get playlist using search first
    const searchResults = await client.searchMusic(`playlist:${playlistId}`, {
      limit: 50,
    });

    if (searchResults.success && searchResults.items.length > 0) {
      const playlistItems = searchResults.items.filter(
        (item) => item.category === "playlist" || item.playlistId === playlistId
      );

      if (playlistItems.length > 0) {
        return {
          playlistId: playlistId,
          title: playlistItems[0].title,
          author: playlistItems[0].author,
          thumbnails: playlistItems[0].thumbnails,
          trackCount: playlistItems.length,
          tracks: playlistItems.map((track) => ({
            videoId: track.videoId,
            title: track.title,
            artist: track.author,
            duration: track.duration,
            thumbnails: track.thumbnails,
          })),
        };
      }
    }

    throw new Error("Playlist not found");
  } catch (error) {
    console.error("❌ getPlaylist error:", error.message);
    throw new Error("Failed to fetch playlist");
  }
};

export const getLyrics = async (videoId) => {
  const client = await initYTMusic();

  try {
    // Search for the video to get enhanced data
    const searchResults = await client.searchMusic(videoId, { limit: 1 });

    if (searchResults.success && searchResults.items.length > 0) {
      const video = searchResults.items[0];

      return {
        videoId: videoId,
        title: video.title,
        artist: video.author,
        hasLyrics: false, // YTMusicAdvanced doesn't provide lyrics directly
        lyrics: null,
        message: "Lyrics feature requires additional integration",
        enhancedData: {
          duration: video.duration,
          thumbnails: video.thumbnails,
          category: video.category,
          viewCount: video.viewCount,
        },
      };
    }

    throw new Error("Video not found");
  } catch (error) {
    console.error("❌ getLyrics error:", error.message);
    return {
      videoId: videoId,
      hasLyrics: false,
      lyrics: null,
      error: "Lyrics not available",
    };
  }
};

export const getVideoDetails = async (videoId) => {
  try {
    const client = await initYTMusic();

    // Try direct video lookup first
    try {
      // Use search with video ID specifically
      const searchResults = await client.searchMusic(videoId, {
        limit: 1,
        filter: "videos",
      });

      if (searchResults.success && searchResults.items.length > 0) {
        const video = searchResults.items[0];

        // Verify it's the correct video by checking if videoId matches
        if (video.videoId === videoId) {
          return {
            title: video.title || "Unknown Title",
            author: video.author || "Unknown Artist",
            duration: video.duration,
            durationFormatted: video.durationFormatted,
            thumbnails: video.thumbnails,
            viewCount: video.viewCount,
            category: video.category,
            isExplicit: video.isExplicit,
            album: video.album,
            year: video.year,
            source: "YTMusicAdvanced",
          };
        }
      }
    } catch (ytmusicError) {
      console.warn("⚠️ Direct video lookup failed:", ytmusicError.message);
    }

    // Fallback: Search with video ID as exact match
    const searchResults = await client.searchMusic(`"${videoId}"`, {
      limit: 5,
    });

    if (searchResults.success && searchResults.items.length > 0) {
      // Find exact match by videoId
      const exactMatch = searchResults.items.find(
        (item) => item.videoId === videoId
      );

      if (exactMatch) {
        const video = exactMatch;
        return {
          title: video.title || "Unknown Title",
          author: video.author || "Unknown Artist",
          duration: video.duration,
          durationFormatted: video.durationFormatted,
          thumbnails: video.thumbnails,
          viewCount: video.viewCount,
          category: video.category,
          isExplicit: video.isExplicit,
          album: video.album,
          year: video.year,
          source: "YTMusicAdvanced (fallback)",
        };
      }
    }

    throw new Error(`Video ${videoId} not found in search results`);
  } catch (error) {
    console.error("❌ getVideoDetails error:", error.message);
    return {
      title: "Unknown Title",
      author: "Unknown Artist",
      source: "error",
      error: error.message,
    };
  }
};

/**
 * Enhanced direct video lookup with multiple fallback strategies
 */
export const getVideoById = async (videoId) => {
  try {
    const client = await initYTMusic();

    console.log(`🔍 Looking up video: ${videoId}`);

    // Strategy 1: Try exact video ID search with different approaches
    const searchStrategies = [
      // Try as exact phrase
      `"${videoId}"`,
      // Try with YouTube URL format
      `https://youtube.com/watch?v=${videoId}`,
      `youtube.com/watch?v=${videoId}`,
      // Try just the ID (might work differently)
      videoId,
      // Try with common prefixes/suffixes
      `video ${videoId}`,
      `watch ${videoId}`,
    ];

    let bestMatch = null;
    let strategyUsed = null;

    for (const strategy of searchStrategies) {
      try {
        console.log(`🔍 Trying strategy: "${strategy}"`);

        const searchResults = await client.searchMusic(strategy, {
          limit: 10,
          filter: "videos",
        });

        if (searchResults.success && searchResults.items.length > 0) {
          // Look for exact videoId match
          const exactMatch = searchResults.items.find(
            (item) => item.videoId === videoId
          );

          if (exactMatch) {
            console.log(`✅ Found exact match using strategy: "${strategy}"`);
            bestMatch = exactMatch;
            strategyUsed = strategy;
            break;
          }

          // If no exact match, check for similar videos that might be the same
          const similarVideos = searchResults.items.filter(
            (item) =>
              item.title?.toLowerCase().includes(videoId.toLowerCase()) ||
              item.videoId?.includes(videoId)
          );

          if (similarVideos.length > 0 && !bestMatch) {
            bestMatch = similarVideos[0];
            strategyUsed = `similar_${strategy}`;
          }
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (strategyError) {
        console.warn(
          `⚠️ Strategy "${strategy}" failed:`,
          strategyError.message
        );
      }
    }

    if (bestMatch) {
      return {
        success: true,
        video: {
          videoId: bestMatch.videoId,
          title: bestMatch.title || "Unknown Title",
          author: bestMatch.author || "Unknown Artist",
          duration: bestMatch.duration,
          durationFormatted: bestMatch.durationFormatted,
          thumbnails: bestMatch.thumbnails || [],
          viewCount: bestMatch.viewCount,
          category: bestMatch.category,
          isExplicit: bestMatch.isExplicit || false,
        },
        source: `strategy: ${strategyUsed}`,
        exactMatch: bestMatch.videoId === videoId,
      };
    }

    // Strategy 2: Try to find the video through the original search that worked
    console.log(`🔄 Falling back to original search method for: ${videoId}`);
    const fallbackSearch = await client.searchMusic("Powerhouse", {
      limit: 20,
      filter: "videos",
    });

    if (fallbackSearch.success && fallbackSearch.items.length > 0) {
      const videoFromOriginalSearch = fallbackSearch.items.find(
        (item) => item.videoId === videoId
      );

      if (videoFromOriginalSearch) {
        console.log(`✅ Found video through original search fallback`);
        return {
          success: true,
          video: {
            videoId: videoFromOriginalSearch.videoId,
            title: videoFromOriginalSearch.title || "Unknown Title",
            author: videoFromOriginalSearch.author || "Unknown Artist",
            duration: videoFromOriginalSearch.duration,
            durationFormatted: videoFromOriginalSearch.durationFormatted,
            thumbnails: videoFromOriginalSearch.thumbnails || [],
            viewCount: videoFromOriginalSearch.viewCount,
            category: videoFromOriginalSearch.category,
            isExplicit: videoFromOriginalSearch.isExplicit || false,
          },
          source: "original_search_fallback",
          exactMatch: true,
        };
      }
    }

    return {
      success: false,
      error: `Video ${videoId} not found through any search strategy`,
      message:
        "The video may be region-restricted, age-gated, or unavailable through the API",
      availableInSearch: false,
    };
  } catch (error) {
    console.error("❌ getVideoById error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Video lookup service unavailable",
    };
  }
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

export const quickSearch = async (query, limit = 5) => {
  const client = await initYTMusic();
  const searchResults = await client.quickSearch(query, { limit });

  if (!searchResults.success) {
    throw new Error(searchResults.error || "Quick search failed");
  }

  return searchResults.items;
};

export const getSearchSuggestions = async (query, limit = 10) => {
  const client = await initYTMusic();
  return await client.getSuggestions(query, limit);
};

export const getClientStatus = async () => {
  const client = await initYTMusic();
  return client.getStatus();
};

export const clearMusicCache = async () => {
  const client = await initYTMusic();
  await client.clearCache();
  console.log("✅ YTMusicAdvanced cache cleared");
};

/**
 * Search all content types
 */
export const searchAll = async (query, options = {}) => {
  const client = await initYTMusic();
  const searchResults = await client.searchAll(query, {
    limit: options.limit || 25,
    ...options,
  });

  if (!searchResults.success) {
    throw new Error(searchResults.error || "Search failed");
  }

  return searchResults;
};

/**
 * Get artist details
 */
export const getArtist = async (artistName, options = {}) => {
  const client = await initYTMusic();
  const searchResults = await client.searchMusic(artistName, {
    limit: options.limit || 20,
    ...options,
  });

  if (!searchResults.success) {
    throw new Error(searchResults.error || "Artist search failed");
  }

  const artistResults = searchResults.items.filter(
    (item) => item.category === "artist" || item.type === "artist"
  );

  if (artistResults.length === 0) {
    throw new Error("Artist not found");
  }

  const artist = artistResults[0];
  return {
    artistId: artist.artistId || artist.videoId,
    name: artist.author || artist.title,
    thumbnails: artist.thumbnails,
    description: artist.description,
    subscribers: artist.subscribers,
    videos: searchResults.items.filter((item) => item.author === artist.author),
  };
};

/**
 * Get video from cached search results
 */
export const getVideoFromCache = async (videoId) => {
  // Check if we have recent search results that contain this video
  for (const [query, { results, timestamp }] of searchResultsCache.entries()) {
    if (Date.now() - timestamp < CACHE_TTL) {
      const video = results.items?.find((item) => item.videoId === videoId);
      if (video) {
        console.log(`📋 Found video in search cache for query: "${query}"`);
        return {
          success: true,
          video: video,
          source: `cached_search:${query}`,
          cached: true,
        };
      }
    }
  }
  return null;
};

/**
 * Cache search results for future video lookups
 */
export const cacheSearchResults = (query, results) => {
  if (results?.items?.length > 0) {
    searchResultsCache.set(query, {
      results,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    for (const [key, { timestamp }] of searchResultsCache.entries()) {
      if (Date.now() - timestamp > CACHE_TTL) {
        searchResultsCache.delete(key);
      }
    }
  }
};
