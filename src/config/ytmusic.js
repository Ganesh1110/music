export const YTMusicConfig = {
  // Client configuration
  client: {
    cacheEnabled: true,
    language: "en",
    country: "US",
    retryAttempts: 3,
    timeout: 30000,
  },

  // Audio extraction settings
  audio: {
    preferredFormats: ["webm", "mp4"],
    minBitrate: 50000,
    maxBitrate: 300000,
    enableProxy: false, // Set to true if you need proxy for restricted content
  },

  // Cache settings
  cache: {
    ttl: 3600000, // 1 hour
    maxSize: 100,
  },
};

export default YTMusicConfig;
