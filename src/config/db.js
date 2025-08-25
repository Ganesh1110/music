import mysql from "mysql2";
import dotenv from "dotenv";

const ENV = dotenv.config()?.parsed;

let pool;

try {
  pool = mysql.createPool({
    host: ENV?.MYSQL_HOST,
    user: ENV?.MYSQL_USER,
    password: ENV?.MYSQL_PASSWORD,
    database: ENV?.MYSQL_DB,
    port: ENV?.MYSQL_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // allowPublicKeyRetrieval: true,
    // ssl: false,
  });

  // Test connection
  const testConnection = async () => {
    try {
      const connection = await pool.promise().getConnection();
      console.log("✅ MySQL Connected:", {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        database: process.env.MYSQL_DB,
      });
      connection.release();
    } catch (err) {
      console.error("❌ MySQL Connection Error:", err.message);
      process.exit(1); // stop server if DB fails
    }
  };

  testConnection();
} catch (err) {
  console.error("❌ Pool Creation Error:", err.message);
  process.exit(1);
}

export default pool.promise();
