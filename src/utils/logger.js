import winston from "winston";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES modules equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LOGS_DIR = path.join(__dirname, "..", "logs");
const MAX_LOG_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  verbose: 5,
  silly: 6,
};

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  console.log(`📁 Created logs directory: ${LOGS_DIR}`);
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss.SSS",
  }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    let log = `${timestamp} [${service}] ${level}: ${message}`;

    // Add metadata if present (excluding service)
    const metaWithoutService = { ...meta };
    delete metaWithoutService.service;

    if (Object.keys(metaWithoutService).length > 0) {
      log += ` | ${JSON.stringify(metaWithoutService)}`;
    }

    return log;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss.SSS",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Custom log levels with colors
const customLevels = {
  levels: LOG_LEVELS,
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "blue",
    verbose: "cyan",
    silly: "gray",
  },
};

// Add colors to winston
winston.addColors(customLevels.colors);

// Create logger instance
const logger = winston.createLogger({
  levels: customLevels.levels,
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
  format: fileFormat,
  defaultMeta: {
    service: "music-api",
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
  },
  transports: [
    // Error logs (errors only)
    new winston.transports.File({
      filename: path.join(LOGS_DIR, "error.log"),
      level: "error",
      maxsize: MAX_FILE_SIZE,
      maxFiles: MAX_LOG_FILES,
      tailable: true,
      handleExceptions: true,
      handleRejections: true,
    }),

    // HTTP logs (HTTP requests and responses)
    new winston.transports.File({
      filename: path.join(LOGS_DIR, "http.log"),
      level: "http",
      maxsize: MAX_FILE_SIZE,
      maxFiles: MAX_LOG_FILES,
      tailable: true,
    }),

    // Combined logs (everything except debug/verbose/silly in production)
    new winston.transports.File({
      filename: path.join(LOGS_DIR, "combined.log"),
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      maxsize: MAX_FILE_SIZE,
      maxFiles: MAX_LOG_FILES,
      tailable: true,
    }),

    // Debug logs (only in development)
    ...(process.env.NODE_ENV !== "production"
      ? [
          new winston.transports.File({
            filename: path.join(LOGS_DIR, "debug.log"),
            level: "debug",
            maxsize: MAX_FILE_SIZE,
            maxFiles: MAX_LOG_FILES,
            tailable: true,
          }),
        ]
      : []),
  ],

  // Exception handling
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(LOGS_DIR, "exceptions.log"),
      maxsize: MAX_FILE_SIZE,
      maxFiles: MAX_LOG_FILES,
    }),
  ],

  // Rejection handling
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(LOGS_DIR, "rejections.log"),
      maxsize: MAX_FILE_SIZE,
      maxFiles: MAX_LOG_FILES,
    }),
  ],

  // Don't exit on handled exceptions
  exitOnError: false,
});

// Console transport for non-production environments
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      level: "debug",
      handleExceptions: true,
      handleRejections: true,
    })
  );
} else {
  // In production, only log warnings and errors to console
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      level: "warn",
      handleExceptions: true,
      handleRejections: true,
    })
  );
}

// Custom logger methods with enhanced functionality
class EnhancedLogger {
  constructor(winstonLogger) {
    this.logger = winstonLogger;
  }

  // Standard logging methods
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  http(message, meta = {}) {
    this.logger.http(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  verbose(message, meta = {}) {
    this.logger.verbose(message, meta);
  }

  // Enhanced logging methods
  apiRequest(method, url, statusCode, responseTime, meta = {}) {
    this.http(`${method} ${url}`, {
      type: "api_request",
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      ...meta,
    });
  }

  databaseQuery(query, duration, meta = {}) {
    this.debug(`DB Query: ${query}`, {
      type: "database_query",
      query,
      duration: `${duration}ms`,
      ...meta,
    });
  }

  cacheOperation(operation, key, hit = false, meta = {}) {
    const level = hit ? "debug" : "verbose";
    this.logger.log(level, `Cache ${operation}: ${key}`, {
      type: "cache_operation",
      operation,
      key,
      hit,
      ...meta,
    });
  }

  searchQuery(query, resultsCount, responseTime, strategy, meta = {}) {
    this.info(`Search: "${query}" - ${resultsCount} results`, {
      type: "search_query",
      query,
      resultsCount,
      responseTime: `${responseTime}ms`,
      strategy,
      ...meta,
    });
  }

  ytmusicOperation(operation, videoId, success, meta = {}) {
    const level = success ? "info" : "warn";
    this.logger.log(level, `YTMusic ${operation}: ${videoId}`, {
      type: "ytmusic_operation",
      operation,
      videoId,
      success,
      ...meta,
    });
  }

  // Performance logging
  performance(operation, duration, threshold = 1000, meta = {}) {
    const level = duration > threshold ? "warn" : "debug";
    this.logger.log(level, `Performance: ${operation} took ${duration}ms`, {
      type: "performance",
      operation,
      duration,
      threshold,
      ...meta,
    });
  }

  // Security logging
  security(event, user = "unknown", meta = {}) {
    this.warn(`Security: ${event}`, {
      type: "security",
      event,
      user,
      ip: meta.ip || "unknown",
      ...meta,
    });
  }

  // Startup logging
  startup(service, status, meta = {}) {
    const level = status === "ready" ? "info" : "error";
    this.logger.log(level, `Startup: ${service} - ${status}`, {
      type: "startup",
      service,
      status,
      ...meta,
    });
  }

  // Health check logging
  health(service, status, responseTime, meta = {}) {
    const level = status === "healthy" ? "verbose" : "error";
    this.logger.log(level, `Health: ${service} - ${status}`, {
      type: "health",
      service,
      status,
      responseTime: `${responseTime}ms`,
      ...meta,
    });
  }

  // With metadata helper
  withMeta(additionalMeta) {
    return {
      error: (message, meta = {}) =>
        this.error(message, { ...additionalMeta, ...meta }),
      warn: (message, meta = {}) =>
        this.warn(message, { ...additionalMeta, ...meta }),
      info: (message, meta = {}) =>
        this.info(message, { ...additionalMeta, ...meta }),
      debug: (message, meta = {}) =>
        this.debug(message, { ...additionalMeta, ...meta }),
      http: (message, meta = {}) =>
        this.http(message, { ...additionalMeta, ...meta }),
    };
  }

  // Get logger statistics (useful for monitoring)
  getStats() {
    const transports = this.logger.transports.map((t) => ({
      name: t.name || t.constructor.name,
      level: t.level,
      silent: t.silent,
    }));

    return {
      level: this.logger.level,
      transports,
      defaultMeta: this.logger.defaultMeta,
      timestamp: new Date().toISOString(),
    };
  }

  // Stream for Morgan HTTP logger
  getStream() {
    return {
      write: (message) => {
        this.http(message.trim());
      },
    };
  }
}

// Create enhanced logger instance
const enhancedLogger = new EnhancedLogger(logger);

// Log startup information
enhancedLogger.startup("Logger", "ready", {
  logLevel: enhancedLogger.logger.level,
  environment: process.env.NODE_ENV || "development",
  logFiles: [
    "error.log",
    "http.log",
    "combined.log",
    ...(process.env.NODE_ENV !== "production" ? ["debug.log"] : []),
  ],
});

export default enhancedLogger;
