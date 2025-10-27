import express from "express";
import ytmusicRoutes from "./ytmusicRoutes.js";
import getSong from "./getSongRoute.js";
import searchRoutes from "./searchRoutes.js";
import docsRoutes from "./docs.js";

const router = express.Router();

router.get("/", (req, res) => res.send("✅ Server is working"));

router.use("/api-docs", docsRoutes);

router.get("/users", async (req, res) => {
  try {
    const [rows] = await req.db.execute("SELECT * FROM users");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.use("/ytmusic", ytmusicRoutes);
router.use("/song", getSong);
router.use("/search", searchRoutes);

export default router;
