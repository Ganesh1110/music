import rateLimit from "express-rate-limit";

export const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many search requests",
    message: "Please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const audioStreamLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 audio streams per hour
  message: {
    error: "Audio stream limit exceeded",
    message: "Please try again later",
  },
});
