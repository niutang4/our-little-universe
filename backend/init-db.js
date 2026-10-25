const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

function getConnectionConfig(includeDatabase = false) {
  const config = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "123456",
    multipleStatements: false
  };
  if (includeDatabase) config.database = process.env.DB_NAME || "love_universe";
  return config;
}

async function runFile(connection, filename) {
  const sql = fs.readFileSync(path.resolve(__dirname, "..", "db", filename), "utf8");
  const statements = sql.split(/;\s*(?:\r?\n|$)/).map((statement) => statement.trim()).filter(Boolean);
  for (const statement of statements) await connection.query(statement);
}

async function main() {
  const connection = await mysql.createConnection(getConnectionConfig());
  try {
    await runFile(connection, "schema.sql");
    await runFile(connection, "seed.sql");
    console.log("Database schema and seed data are ready.");
  } finally {
    await connection.end();
  }
}

main().catch((error) => { console.error("Database initialization failed:", error.message); process.exitCode = 1; });
