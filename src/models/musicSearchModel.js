import YTMusic from "ytmusic-api";

const ytmusic = new YTMusic();
let isInitialized = false;

const cache = new Map(); // optional, simple in-memory cache

export const initYTMusic = async () => {
  if (isInitialized) return;
  await ytmusic.initialize();
  isInitialized = true;
  console.log("✅ YTMusic API initialized");
};

/**
 * Simple memory cache to speed up duplicate searches
 */
const getCachedResult = (query) => {
  const cached = cache.get(query.toLowerCase());
  const TTL = 60 * 1000; // 1 min
  if (cached && Date.now() - cached.timestamp < TTL) {
    return cached.data;
  }
  return null;
};

// export const searchSongs = async (query) => {
//   await initYTMusic();

//   const cacheKey = query.toLowerCase();
//   const TTL = 60 * 1000;
//   const cached = cache.get(cacheKey);

//   if (cached && Date.now() - cached.timestamp < TTL) {
//     return cached.data;
//   }

//   const items = await ytmusic.search(query, "all");

//   const result = {
//     songs: [],
//     albums: [],
//     videos: [],
//     communityPlaylists: [],
//     artists: [],
//   };

//   for (const item of items) {
//     const type = (item.resultType || item.type || "").toLowerCase();
//     const thumbnail = item.thumbnails?.at(-1)?.url;

//     // Combine all fields that might contain song or artist name
//     const searchableFields = [
//       item.title,
//       item.name,
//       item.artist?.name,
//       item.author,
//       ...(item.artists?.map((a) => a.name) || []),
//     ].filter(Boolean);

//     const isQueryMatched = searchableFields.some((f) =>
//       f.toLowerCase().includes(query.toLowerCase())
//     );

//     switch (type) {
//       case "song":
//         result.songs.push({
//           type: "song",
//           title: item.title || item.name,
//           artists:
//             item.artists?.map((a) => a.name).join(", ") || item.artist?.name,
//           videoId: item.videoId,
//           audioUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
//           duration: item.duration,
//           thumbnail,
//         });
//         break;

//       case "album":
//         result.albums.push({
//           type: "album",
//           title: item.title || item.name,
//           artist: item.artist?.name,
//           year: item.year,
//           albumId: item.albumId,
//           browseId: item.browseId || item.playlistId,
//           url: `https://music.youtube.com/browse/${
//             item.browseId || item.playlistId
//           }`,
//           thumbnail,
//         });
//         break;

//       case "video":
//         result.videos.push({
//           type: "video",
//           title: item.title || item.name,
//           author: item.author || item.artist?.name,
//           duration: item.duration,
//           videoId: item.videoId,
//           url: `https://www.youtube.com/watch?v=${item.videoId}`,
//           thumbnail,
//         });

//         // If it's musically relevant (title/artist match), classify also as a "song"
//         if (item.videoId && item.duration && isQueryMatched) {
//           result.songs.push({
//             type: "song",
//             title: item.title || item.name,
//             artists:
//               item.artists?.map((a) => a.name).join(", ") ||
//               item.artist?.name ||
//               item.author ||
//               "Unknown",
//             videoId: item.videoId,
//             audioUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
//             duration: item.duration,
//             thumbnail,
//           });
//         }
//         break;

//       case "playlist":
//         result.communityPlaylists.push({
//           type: "playlist",
//           title: item.title || item.name,
//           author: item.artist?.name || item.author || "Unknown",
//           playlistId: item.playlistId,
//           count: item.itemCount || null,
//           url: `https://music.youtube.com/playlist?list=${item.playlistId}`,
//           thumbnail,
//         });
//         break;

//       case "artist":
//         result.artists.push({
//           type: "artist",
//           name: item.name,
//           browseId: item.browseId || item.artistId,
//           subscribers: item.subscriberCount || null,
//           url: `https://music.youtube.com/channel/${
//             item.browseId || item.artistId
//           }`,
//           thumbnail,
//         });
//         break;

//       default: {
//         if (item.videoId && item.duration && isQueryMatched) {
//           result.songs.push({
//             type: "song",
//             title: item.title || item.name,
//             artists:
//               item.artists?.map((a) => a.name).join(", ") ||
//               item.artist?.name ||
//               item.author ||
//               "Unknown",
//             videoId: item.videoId,
//             audioUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
//             duration: item.duration,
//             thumbnail,
//           });
//         } else {
//           console.warn("🔍 Skipped (not matching):", {
//             title: item.title || item.name,
//             artist: item.artist?.name || item.author,
//             type,
//           });
//         }
//         break;
//       }
//     }
//   }

//   cache.set(cacheKey, { data: result, timestamp: Date.now() });
//   return result;
// };

// export const searchSongs = async (query) => {
//   await initYTMusic();

//   const cacheKey = query.toLowerCase();
//   const TTL = 60 * 1000;

//   const cached = cache.get(cacheKey);
//   if (cached && Date.now() - cached.timestamp < TTL) {
//     return cached.data;
//   }

//   const result = {
//     songs: [],
//     albums: [],
//     videos: [],
//     communityPlaylists: [],
//     artists: [],
//   };

//   // Helper function to process items into categories
//   const processItems = (items) => {
//     for (const item of items) {
//       const type = (item.resultType || item.type || "").toLowerCase();
//       const thumbnail = item.thumbnails?.at(-1)?.url;

//       const searchableFields = [
//         item.title,
//         item.name,
//         item.artist?.name,
//         item.author,
//         ...(item.artists?.map((a) => a.name) || []),
//       ].filter(Boolean);

//       const isQueryMatched = searchableFields.some((f) =>
//         f.toLowerCase().includes(query.toLowerCase())
//       );

//       switch (type) {
//         case "song":
//           result.songs.push({
//             type: "song",
//             title: item.title || item.name,
//             artists:
//               item.artists?.map((a) => a.name).join(", ") || item.artist?.name,
//             videoId: item.videoId,
//             audioUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
//             duration: item.duration,
//             thumbnail,
//           });
//           break;

//         case "album":
//           result.albums.push({
//             type: "album",
//             title: item.title || item.name,
//             artist: item.artist?.name,
//             year: item.year,
//             albumId: item.albumId,
//             browseId: item.browseId || item.playlistId,
//             url: `https://music.youtube.com/browse/${
//               item.browseId || item.playlistId
//             }`,
//             thumbnail,
//           });
//           break;

//         case "video":
//           result.videos.push({
//             type: "video",
//             title: item.title || item.name,
//             author: item.author || item.artist?.name,
//             duration: item.duration,
//             videoId: item.videoId,
//             url: `https://www.youtube.com/watch?v=${item.videoId}`,
//             thumbnail,
//           });

//           if (item.videoId && item.duration && isQueryMatched) {
//             result.songs.push({
//               type: "song",
//               title: item.title || item.name,
//               artists:
//                 item.artists?.map((a) => a.name).join(", ") ||
//                 item.artist?.name ||
//                 item.author ||
//                 "Unknown",
//               videoId: item.videoId,
//               audioUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
//               duration: item.duration,
//               thumbnail,
//             });
//           }
//           break;

//         case "playlist":
//           result.communityPlaylists.push({
//             type: "playlist",
//             title: item.title || item.name,
//             author: item.artist?.name || item.author || "Unknown",
//             playlistId: item.playlistId,
//             count: item.itemCount || null,
//             url: `https://music.youtube.com/playlist?list=${item.playlistId}`,
//             thumbnail,
//           });
//           break;

//         case "artist":
//           result.artists.push({
//             type: "artist",
//             name: item.name,
//             browseId: item.browseId || item.artistId,
//             subscribers: item.subscriberCount || null,
//             url: `https://music.youtube.com/channel/${
//               item.browseId || item.artistId
//             }`,
//             thumbnail,
//           });
//           break;

//         default:
//           if (item.videoId && item.duration && isQueryMatched) {
//             result.songs.push({
//               type: "song",
//               title: item.title || item.name,
//               artists:
//                 item.artists?.map((a) => a.name).join(", ") ||
//                 item.artist?.name ||
//                 item.author ||
//                 "Unknown",
//               videoId: item.videoId,
//               audioUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
//               duration: item.duration,
//               thumbnail,
//             });
//           }
//           break;
//       }
//     }
//   };

//   try {
//     let items = await ytmusic.search(query, "all");

//     // if songs are empty after first try, wait and retry once
//     const isLikelyColdStart =
//       items.length < 3 || !items.find((i) => i.type === "song");
//     if (isLikelyColdStart) {
//       console.warn("⚠️ Search cold-start detected: retrying once after delay");
//       await new Promise((resolve) => setTimeout(resolve, 2000)); // wait 2 secs
//       items = await ytmusic.search(query, "all");
//     }

//     processItems(items);

//     cache.set(cacheKey, { data: result, timestamp: Date.now() });
//     return result;
//   } catch (err) {
//     console.error("❌ Error during ytmusic search:", err.message || err);
//     return {
//       songs: [],
//       albums: [],
//       videos: [],
//       communityPlaylists: [],
//       artists: [],
//       error: true,
//       message: "YTMusic search failed",
//     };
//   }
// };

export const searchSongs = async (query) => {
  await initYTMusic();

  const cacheKey = query.toLowerCase();
  const TTL = 60 * 1000;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < TTL) {
    return cached.data;
  }

  const result = {
    songs: [],
    albums: [],
    videos: [],
    communityPlaylists: [],
    artists: [],
  };

  const processItems = (items) => {
    for (const item of items) {
      const type = (item.resultType || item.type || "").toLowerCase();
      const thumbnail = item.thumbnails?.at(-1)?.url;

      const searchableFields = [
        item.title,
        item.name,
        item.artist?.name,
        item.author,
        ...(item.artists?.map((a) => a.name) || []),
      ].filter(Boolean);

      const isQueryMatched = searchableFields.some((f) =>
        f.toLowerCase().includes(query.toLowerCase())
      );

      switch (type) {
        case "song":
          result.songs.push({
            type: "song",
            title: item.title || item.name,
            artists:
              item.artists?.map((a) => a.name).join(", ") || item.artist?.name,
            videoId: item.videoId,
            audioUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
            duration: item.duration,
            thumbnail,
          });
          break;

        case "album":
          result.albums.push({
            type: "album",
            title: item.title || item.name,
            artist: item.artist?.name,
            year: item.year,
            albumId: item.albumId,
            browseId: item.browseId || item.playlistId,
            url: `https://music.youtube.com/browse/${
              item.browseId || item.playlistId
            }`,
            thumbnail,
          });
          break;

        case "video":
          result.videos.push({
            type: "video",
            title: item.title || item.name,
            author: item.author || item.artist?.name,
            duration: item.duration,
            videoId: item.videoId,
            url: `https://www.youtube.com/watch?v=${item.videoId}`,
            thumbnail,
          });

          if (item.videoId && item.duration && isQueryMatched) {
            result.songs.push({
              type: "song",
              title: item.title || item.name,
              artists:
                item.artists?.map((a) => a.name).join(", ") ||
                item.artist?.name ||
                item.author ||
                "Unknown",
              videoId: item.videoId,
              audioUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
              duration: item.duration,
              thumbnail,
            });
          }
          break;

        case "playlist":
          result.communityPlaylists.push({
            type: "playlist",
            title: item.title || item.name,
            author: item.artist?.name || item.author || "Unknown",
            playlistId: item.playlistId,
            count: item.itemCount || null,
            url: `https://music.youtube.com/playlist?list=${item.playlistId}`,
            thumbnail,
          });
          break;

        case "artist":
          result.artists.push({
            type: "artist",
            name: item.name,
            browseId: item.browseId || item.artistId,
            subscribers: item.subscriberCount || null,
            url: `https://music.youtube.com/channel/${
              item.browseId || item.artistId
            }`,
            thumbnail,
          });
          break;

        default:
          if (item.videoId && item.duration && isQueryMatched) {
            result.songs.push({
              type: "song",
              title: item.title || item.name,
              artists:
                item.artists?.map((a) => a.name).join(", ") ||
                item.artist?.name ||
                item.author ||
                "Unknown",
              videoId: item.videoId,
              audioUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
              duration: item.duration,
              thumbnail,
            });
          }
          break;
      }
    }
  };

  // 🛡 Retry helper
  const retrySearch = async (retries = 3, delay = 1500) => {
    for (let i = 0; i < retries; i++) {
      try {
        const items = await ytmusic.search(query, "all");
        const hasSongs = items.some(
          (item) =>
            (item.resultType || item.type || "").toLowerCase() === "song" ||
            (item.title?.toLowerCase().includes(query.toLowerCase()) &&
              item.videoId)
        );

        if (hasSongs || i === retries - 1) {
          return items;
        }

        console.warn(`⚠️ Retry ${i + 1}/${retries}: no songs detected yet`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (err) {
        console.error("❌ Retry error:", err.message);
      }
    }

    return [];
  };

  try {
    const items = await retrySearch(3); // Try max 3 times
    processItems(items);

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.error("❌ Final searchSongs error:", err.message || err);
    return {
      error: true,
      message: "YTMusic search failed, please try again later.",
      ...result,
    };
  }
};
