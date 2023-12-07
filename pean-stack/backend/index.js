// Import express
const express = require("express");
const cors = require("cors");
const os = require("os");
const { Pool } = require("pg");

// Create an express application
const app = express();

app.use(cors());

// Define a port (this should match the port you expose in your Dockerfile)
const PORT = 3000;
const hostname = "0.0.0.0";

const pool = new Pool({
  user: "root",
  host: "db",
  database: "pean-db",
  password: "podnes1972",
  port: 5432,
});

const initializeDb = async () => {
  try {
    // Create the table if it doesn't exist
    await pool.query(
      "CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, fullName TEXT NOT NULL)"
    );

    // Check if the table is empty
    const res = await pool.query("SELECT COUNT(*) FROM users");

    // If the table is empty, insert the initial data
    if (parseInt(res.rows[0].count) === 0) {
      await pool.query(
        "INSERT INTO users (fullName) VALUES ('Oleksii Pidnebesnyi')"
      );
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

// A simple GET route
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT fullName FROM users LIMIT 1");

    const user = result.rows[0].fullname;
    res.json({ user, containerId: os.hostname() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const startServer = async () => {
  try {
    await initializeDb();
    app.listen(PORT, hostname, async () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
  }
};

startServer();
