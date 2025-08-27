import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import DB_connection from "./config/db.js";
import routes from "./routes/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Default
app.get("/", (req, res) => res.send("✅ Server is working"));

// // DB example
// app.get("/users", async (req, res) => {
//   try {
//     const [rows] = await DB_connection.execute("SELECT * FROM users");
//     res.json(rows);
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.use("/", routes);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

//http://10.168.10.107:3000/users for mobile application
//http://devtest.net:3000/users to check on web
