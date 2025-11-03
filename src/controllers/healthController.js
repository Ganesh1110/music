import os from "os";

// Global variables to track health metrics
let healthMetrics = {
  startTime: new Date(),
  totalRequests: 0,
  errorCount: 0,
  searchCount: 0,
  audioCount: 0,
  lyricsCount: 0,
};

/**
 * Comprehensive health check endpoint
 */
export const healthCheck = async (req, res) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      database: "unknown",
      ytmusicAdvanced: "unknown",
      cache: "unknown",
      geniusApi: "unknown",
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + "MB",
        heapTotal:
          Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + "MB",
        heapUsed:
          Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
      },
      loadAverage: os.loadavg(),
      cpuCount: os.cpus().length,
      freeMemory: Math.round(os.freemem() / 1024 / 1024) + "MB",
      totalMemory: Math.round(os.totalmem() / 1024 / 1024) + "MB",
    },
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
  };

  const unhealthyServices = [];

  // Test database connection
  try {
    if (global.DB_POOL) {
      await global.DB_POOL.execute("SELECT 1");
      health.services.database = "connected";
    } else {
      health.services.database = "disconnected";
      unhealthyServices.push("database");
    }
  } catch (error) {
    health.services.database = "disconnected";
    unhealthyServices.push("database");
    health.databaseError = error.message;
  }

  // Test YouTube Music service
  try {
    const ytmusicService = await import("../services/ytmusicService.js");
    const ytHealth = await ytmusicService.default.healthCheck();
    health.services.ytmusicAdvanced = ytHealth.healthy
      ? "connected"
      : "disconnected";
    health.ytmusicAdvancedDetails = ytHealth;

    if (!ytHealth.healthy) {
      unhealthyServices.push("ytmusicAdvanced");
    }
  } catch (error) {
    health.services.ytmusicAdvanced = "disconnected";
    unhealthyServices.push("ytmusicAdvanced");
    health.ytmusicAdvancedError = error.message;
  }

  // Test cache service
  try {
    const cacheService = await import("../services/cacheService.js");
    const cacheHealth = cacheService.cacheService.health();
    health.services.cache = cacheHealth.status;
    health.cacheDetails = cacheHealth;

    if (cacheHealth.status !== "healthy") {
      unhealthyServices.push("cache");
    }
  } catch (error) {
    health.services.cache = "disconnected";
    unhealthyServices.push("cache");
    health.cacheError = error.message;
  }

  // Test Genius API
  try {
    const Genius = await import("genius-lyrics");
    const geniusClient = new Genius.Client(
      process.env.GENIUS_CLIENT_ACCESS_TOKEN
    );
    await geniusClient.songs.search("test", { limit: 1 });
    health.services.geniusApi = "connected";
  } catch (error) {
    health.services.geniusApi = "disconnected";
    unhealthyServices.push("geniusApi");
    health.geniusApiError = error.message;
  }

  // Add application metrics
  health.metrics = {
    ...healthMetrics,
    uptime: Math.round(process.uptime()),
    requestRate: calculateRequestRate(),
    errorRate:
      healthMetrics.totalRequests > 0
        ? (
            (healthMetrics.errorCount / healthMetrics.totalRequests) *
            100
          ).toFixed(2) + "%"
        : "0%",
  };

  // Determine overall status
  if (unhealthyServices.length > 0) {
    health.status =
      unhealthyServices.length === Object.keys(health.services).length
        ? "unhealthy"
        : "degraded";
    health.unhealthyServices = unhealthyServices;
  }

  // Update metrics
  healthMetrics.totalRequests++;

  res.json(health);
};

/**
 * Update health metrics (call this from other controllers)
 */
export const updateHealthMetrics = (type, success = true) => {
  if (!success) {
    healthMetrics.errorCount++;
  }

  switch (type) {
    case "search":
      healthMetrics.searchCount++;
      break;
    case "audio":
      healthMetrics.audioCount++;
      break;
    case "lyrics":
      healthMetrics.lyricsCount++;
      break;
  }
};

/**
 * Get health metrics for monitoring
 */
export const getHealthMetrics = () => {
  return {
    ...healthMetrics,
    uptime: process.uptime(),
    requestRate: calculateRequestRate(),
    errorRate:
      healthMetrics.totalRequests > 0
        ? healthMetrics.errorCount / healthMetrics.totalRequests
        : 0,
  };
};

/**
 * Reset health metrics (for testing)
 */
export const resetHealthMetrics = () => {
  healthMetrics = {
    startTime: new Date(),
    totalRequests: 0,
    errorCount: 0,
    searchCount: 0,
    audioCount: 0,
    lyricsCount: 0,
  };
};

// Helper function to calculate request rate
function calculateRequestRate() {
  const uptime = process.uptime();
  const hours = uptime / 3600;

  if (hours === 0) return 0;

  return (healthMetrics.totalRequests / hours).toFixed(2) + " req/hour";
}
