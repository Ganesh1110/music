import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import DB_POOL from "./config/db.js";
import routes from "./routes/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  req.db = DB_POOL;
  next();
});

app.get("/", (req, res) => res.send("✅ Server is working"));
app.use("/", routes);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
