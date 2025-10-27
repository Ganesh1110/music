export const config = {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  },
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY,
  },
  genius: {
    accessToken: process.env.GENIUS_CLIENT_ACCESS_TOKEN,
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 300000,
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 100,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
};
