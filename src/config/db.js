import mysql from "mysql2/promise";
import "dotenv/config";

let DB_connection;

try {
  DB_connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log("✅ Connected to MySQL database!");
} catch (error) {
  console.error("❌ Failed to connect to MySQL database:", error.message);
  throw error;
}

export default DB_connection;
