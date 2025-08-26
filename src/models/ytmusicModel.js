import YTMusic from "ytmusic-api";
import ytdl from "@distube/ytdl-core";

const ytmusic = new YTMusic();

let isInitialized = false;

export const initYTMusic = async () => {
  if (!isInitialized) {
    await ytmusic.initialize();
    isInitialized = true;
    console.log("✅ YTMusic initialized");
  }
};

export const searchSongs = async (query) => {
  await initYTMusic();
  return await ytmusic.search(query, "song");
};

export const searchAlbums = async (query) => {
  await initYTMusic();
  return await ytmusic.search(query, "albums");
};

export const getPlaylist = async (playlistId) => {
  await initYTMusic();
  return await ytmusic.getPlaylist(playlistId);
};

export const getLyrics = async (videoId) => {
  await initYTMusic();
  return await ytmusic.getLyrics(videoId);
};

export const getVideoDetails = async (videoId) => {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(url);

    return {
      title: info.videoDetails?.title || "Unknown Title",
      author: info.videoDetails?.author?.name || "Unknown Artist",
    };
  } catch (err) {
    console.error("❌ getVideoDetails error:", err.message);
    return { title: "Unknown Title", author: "Unknown Artist" };
  }
};
