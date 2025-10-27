import mysql from "mysql2/promise";
import "dotenv/config";

const DB_POOL = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
});

console.log("✅ MySQL connection pool created!");

export { DB_POOL };

export default DB_POOL;
