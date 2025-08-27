import { searchSongs } from "../models/musicSearchModel.js";

export const searchMusic = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query?.trim()) {
      return res.status(400).json({ error: "`query` parameter is required" });
    }

    const results = await searchSongs(query);

    res.json({
      success: true,
      query,
      data: results,
    });
  } catch (err) {
    console.error("❌ YTMusic search error:", err.message || err);
    res.status(500).json({ error: "Search failed" });
  }
};
