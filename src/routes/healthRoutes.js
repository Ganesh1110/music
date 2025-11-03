import express from "express";
import { healthCheck } from "../controllers/healthController.js";

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Comprehensive health check for all services
 *     description: Check the health status of all backend services including database, YTMusicAdvanced, cache, and external APIs
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Health status of all services
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 memory:
 *                   type: object
 *                   properties:
 *                     rss:
 *                       type: number
 *                       description: Resident Set Size
 *                     heapTotal:
 *                       type: number
 *                     heapUsed:
 *                       type: number
 *                     external:
 *                       type: number
 *                     arrayBuffers:
 *                       type: number
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: "connected"
 *                     ytmusicAdvanced:
 *                       type: string
 *                       example: "connected"
 *                     cache:
 *                       type: string
 *                       example: "healthy"
 *                     geniusApi:
 *                       type: string
 *                       example: "connected"
 *                 system:
 *                   type: object
 *                   properties:
 *                     nodeVersion:
 *                       type: string
 *                     platform:
 *                       type: string
 *                     arch:
 *                       type: string
 *                     memoryUsage:
 *                       type: object
 *                     loadAverage:
 *                       type: array
 *                       items:
 *                         type: number
 *                 environment:
 *                   type: string
 *                   example: "production"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *       503:
 *         description: One or more services are unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "degraded"
 *                 timestamp:
 *                   type: string
 *                 unhealthyServices:
 *                   type: array
 *                   items:
 *                     type: string
 *                 details:
 *                   type: object
 */
router.get("/", healthCheck);

/**
 * @swagger
 * /health/readiness:
 *   get:
 *     summary: Readiness probe
 *     description: Check if the service is ready to accept traffic
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ready"
 *                 timestamp:
 *                   type: string
 *                 services:
 *                   type: object
 *       503:
 *         description: Service is not ready
 */
router.get("/readiness", async (req, res) => {
  try {
    const health = await performReadinessCheck();

    if (health.ready) {
      res.json({
        status: "ready",
        timestamp: new Date().toISOString(),
        services: health.services,
      });
    } else {
      res.status(503).json({
        status: "not ready",
        timestamp: new Date().toISOString(),
        unhealthyServices: health.unhealthyServices,
        details: health.details,
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "not ready",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /health/liveness:
 *   get:
 *     summary: Liveness probe
 *     description: Check if the service is alive and responding
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "alive"
 *                 timestamp:
 *                   type: string
 *                 uptime:
 *                   type: number
 *       500:
 *         description: Service is not responding properly
 */
router.get("/liveness", (req, res) => {
  // Simple liveness check - just verify the process is running
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  // If uptime is very low, might indicate recent crash/restart
  if (uptime < 10) {
    return res.status(500).json({
      status: "unstable",
      timestamp: new Date().toISOString(),
      uptime: uptime,
      message: "Service recently started, may be unstable",
    });
  }

  // Check memory usage (if using too much memory, might indicate issues)
  const memoryThreshold = 0.9; // 90% of available memory
  const memoryRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;

  if (memoryRatio > memoryThreshold) {
    return res.status(500).json({
      status: "degraded",
      timestamp: new Date().toISOString(),
      uptime: uptime,
      memoryUsage: memoryRatio,
      message: "High memory usage detected",
    });
  }

  res.json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: uptime,
    memoryUsage: {
      ratio: Math.round(memoryRatio * 100) + "%",
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + "MB",
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + "MB",
    },
  });
});

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health information
 *     description: Get comprehensive health information including performance metrics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health information
 */
router.get("/detailed", async (req, res) => {
  try {
    const detailedHealth = await getDetailedHealthInfo();
    res.json(detailedHealth);
  } catch (error) {
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /health/services:
 *   get:
 *     summary: Individual service health checks
 *     description: Get health status for each individual service
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Individual service health statuses
 */
router.get("/services", async (req, res) => {
  try {
    const serviceHealth = await checkIndividualServices();
    res.json(serviceHealth);
  } catch (error) {
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /health/metrics:
 *   get:
 *     summary: Application metrics
 *     description: Get performance and business metrics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application metrics
 */
router.get("/metrics", async (req, res) => {
  try {
    const metrics = await getApplicationMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Helper functions

/**
 * Perform readiness check for all required services
 */
async function performReadinessCheck() {
  const checks = {
    database: false,
    ytmusicAdvanced: false,
    cache: false,
    geniusApi: false,
  };

  const details = {};
  const unhealthyServices = [];

  // Check database
  try {
    if (global.DB_POOL) {
      await global.DB_POOL.execute("SELECT 1");
      checks.database = true;
    } else {
      details.database = "Database pool not initialized";
      unhealthyServices.push("database");
    }
  } catch (error) {
    details.database = error.message;
    unhealthyServices.push("database");
  }

  // Check YTMusicAdvanced
  try {
    const ytmusicService = await import("../services/ytmusicService.js");
    const health = await ytmusicService.default.healthCheck();
    checks.ytmusicAdvanced = health.healthy;
    details.ytmusicAdvanced = health;

    if (!health.healthy) {
      unhealthyServices.push("ytmusicAdvanced");
    }
  } catch (error) {
    details.ytmusicAdvanced = error.message;
    unhealthyServices.push("ytmusicAdvanced");
  }

  // Check cache service
  try {
    const cacheService = await import("../services/cacheService.js");
    const cacheHealth = cacheService.cacheService.health();
    checks.cache = cacheHealth.status === "healthy";
    details.cache = cacheHealth;

    if (!checks.cache) {
      unhealthyServices.push("cache");
    }
  } catch (error) {
    details.cache = error.message;
    unhealthyServices.push("cache");
  }

  // Check Genius API
  try {
    const Genius = await import("genius-lyrics");
    const geniusClient = new Genius.Client(
      process.env.GENIUS_CLIENT_ACCESS_TOKEN
    );
    await geniusClient.songs.search("test", { limit: 1 });
    checks.geniusApi = true;
    details.geniusApi = "Connected successfully";
  } catch (error) {
    details.geniusApi = error.message;
    unhealthyServices.push("geniusApi");
  }

  const ready = Object.values(checks).every((status) => status === true);

  return {
    ready,
    services: checks,
    unhealthyServices,
    details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get detailed health information
 */
async function getDetailedHealthInfo() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
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
        external:
          Math.round(process.memoryUsage().external / 1024 / 1024) + "MB",
      },
      loadAverage: require("os").loadavg(),
      cpuCount: require("os").cpus().length,
      freeMemory: Math.round(require("os").freemem() / 1024 / 1024) + "MB",
      totalMemory: Math.round(require("os").totalmem() / 1024 / 1024) + "MB",
    },
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
    services: {},
    performance: {
      responseTimes: await getResponseTimeMetrics(),
      errorRates: await getErrorRateMetrics(),
      cacheHitRate: await getCacheHitRate(),
    },
  };

  // Add individual service health
  const serviceHealth = await checkIndividualServices();
  health.services = serviceHealth;

  // Determine overall status
  const unhealthyServices = Object.entries(serviceHealth)
    .filter(([service, status]) => status.status !== "healthy")
    .map(([service]) => service);

  if (unhealthyServices.length > 0) {
    health.status =
      unhealthyServices.length === Object.keys(serviceHealth).length
        ? "unhealthy"
        : "degraded";
    health.unhealthyServices = unhealthyServices;
  }

  return health;
}

/**
 * Check individual services
 */
async function checkIndividualServices() {
  const services = {};

  // Database health
  try {
    if (global.DB_POOL) {
      await global.DB_POOL.execute("SELECT 1");
      services.database = {
        status: "healthy",
        message: "Connected successfully",
        timestamp: new Date().toISOString(),
      };
    } else {
      services.database = {
        status: "unhealthy",
        message: "Database pool not initialized",
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    services.database = {
      status: "unhealthy",
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  // YTMusicAdvanced health
  try {
    const ytmusicService = await import("../services/ytmusicService.js");
    const health = await ytmusicService.default.healthCheck();
    services.ytmusicAdvanced = {
      status: health.healthy ? "healthy" : "unhealthy",
      message: health.healthy ? "Client ready" : "Client issues",
      details: health,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    services.ytmusicAdvanced = {
      status: "unhealthy",
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  // Cache health
  try {
    const cacheService = await import("../services/cacheService.js");
    const cacheHealth = cacheService.cacheService.health();
    services.cache = {
      status: cacheHealth.status,
      message: `Cache service ${cacheHealth.status}`,
      details: cacheHealth,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    services.cache = {
      status: "unhealthy",
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  // Genius API health
  try {
    const Genius = await import("genius-lyrics");
    const geniusClient = new Genius.Client(
      process.env.GENIUS_CLIENT_ACCESS_TOKEN
    );
    await geniusClient.songs.search("test", { limit: 1 });
    services.geniusApi = {
      status: "healthy",
      message: "API connected successfully",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    services.geniusApi = {
      status: "unhealthy",
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  return services;
}

/**
 * Get application metrics
 */
async function getApplicationMetrics() {
  // These would typically come from your monitoring system
  // For now, we'll return some basic metrics

  const metrics = {
    timestamp: new Date().toISOString(),
    application: {
      uptime: process.uptime(),
      memory: {
        rss: process.memoryUsage().rss,
        heapTotal: process.memoryUsage().heapTotal,
        heapUsed: process.memoryUsage().heapUsed,
        external: process.memoryUsage().external,
      },
      activeRequests: process._getActiveRequests().length,
      activeHandles: process._getActiveHandles().length,
    },
    business: {
      totalSearches: 0, // You would track this in your application
      totalAudioExtractions: 0,
      totalLyricsSearches: 0,
      averageResponseTime: 0,
    },
    cache: await getCacheMetrics(),
    performance: await getPerformanceMetrics(),
  };

  return metrics;
}

// Mock metrics functions (implement based on your tracking)
async function getResponseTimeMetrics() {
  return {
    search: { p50: 120, p95: 450, p99: 800 },
    audio: { p50: 200, p95: 600, p99: 1200 },
    lyrics: { p50: 300, p95: 800, p99: 1500 },
  };
}

async function getErrorRateMetrics() {
  return {
    search: "0.5%",
    audio: "1.2%",
    lyrics: "2.1%",
    overall: "1.2%",
  };
}

async function getCacheHitRate() {
  try {
    const cacheService = await import("../services/cacheService.js");
    const stats = cacheService.cacheService.getStats();
    return {
      hitRate: stats.customStats.hitRate,
      hits: stats.customStats.hits,
      misses: stats.customStats.misses,
    };
  } catch (error) {
    return { hitRate: 0, hits: 0, misses: 0 };
  }
}

async function getCacheMetrics() {
  try {
    const cacheService = await import("../services/cacheService.js");
    const stats = cacheService.cacheService.getStats();
    const memoryUsage = cacheService.cacheService.getMemoryUsage();

    return {
      keys: stats.keys,
      hitRate: stats.customStats.hitRate,
      hits: stats.customStats.hits,
      misses: stats.customStats.misses,
      memoryUsage: memoryUsage,
      enabled: stats.customStats.enabled,
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function getPerformanceMetrics() {
  return {
    cpu: {
      usage: "45%",
      load: require("os").loadavg(),
    },
    memory: {
      usage: "65%",
      free: Math.round(require("os").freemem() / 1024 / 1024) + "MB",
    },
    network: {
      activeConnections: 0, // You would track this
    },
  };
}

export default router;
