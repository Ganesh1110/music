import logger from "../src/utils/logger.js";

const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request details
  logger.info("Incoming request", {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    query: req.query,
    timestamp: new Date().toISOString(),
  });

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info("Request completed", {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get("Content-Length"),
      timestamp: new Date().toISOString(),
    });
  });

  next();
};

export default requestLogger;
