export const healthCheck = async (req, res) => {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: "unknown",
    youtube: "unknown",
    cache: "unknown",
  };

  try {
    // Test database connection
    await DB_POOL.execute("SELECT 1");
    health.database = "connected";
  } catch (error) {
    health.database = "disconnected";
    health.status = "DEGRADED";
  }

  // Test YouTube service
  try {
    await initYTMusic();
    health.youtube = "connected";
  } catch (error) {
    health.youtube = "disconnected";
    health.status = "DEGRADED";
  }

  res.json(health);
};
