import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import DB_connection from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Server is working");
});

app.get("/time", (req, res) => {
  const currentTime = new Date().toISOString();
  res.json({ serverTime: currentTime });
});

app.get("/users", async (req, res) => {
  try {
    const [rows] = await DB_connection.execute("SELECT * FROM users");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
