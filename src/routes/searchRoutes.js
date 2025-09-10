import express from "express";
import {
  searchMusic,
  getCacheStatistics,
  clearCache,
  healthCheck,
} from "../controllers/searchController.js";

const router = express.Router();

// Main search endpoint
router.get("/", searchMusic);

// Cache management endpoints
router.get("/cache/stats", getCacheStatistics);
router.delete("/cache", clearCache);

// Health check endpoint
router.get("/health", healthCheck);

// Alternative search endpoint for backward compatibility
router.get("/music", searchMusic);

export default router;
