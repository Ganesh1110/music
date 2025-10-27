export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // YTDL Core errors
  if (err.message.includes("Video unavailable")) {
    return res.status(404).json({
      error: "Video not found",
      message: "The requested video is unavailable",
    });
  }

  // Database errors
  if (err.code === "ECONNREFUSED") {
    return res.status(503).json({
      error: "Service unavailable",
      message: "Database connection failed",
    });
  }

  // Default error
  res.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && {
      message: err.message,
      stack: err.stack,
    }),
  });
};
