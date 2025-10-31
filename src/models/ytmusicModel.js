import YTMusicAdvanced from "ytmusic-advanced";

// Initialize YTMusicAdvanced client
let musicClient;
let isInitialized = false;

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
    const searchResults = await client.searchMusic(videoId, { limit: 1 });

    if (searchResults.success && searchResults.items.length > 0) {
      const video = searchResults.items[0];
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

    throw new Error("Video not found in YTMusicAdvanced");
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
