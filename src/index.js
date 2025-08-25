import express from "express";
import cors from "cors";
import db from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  req.db = db;
  next();
});

app.get("/", (req, res) => {
  res.send("✅ Server is working");
});

app.get("/time", async (req, res) => {
  const [rows] = await req.db.query("SELECT NOW() as time");
  res.json({ serverTime: rows[0].time });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
