// Import necessary modules
const express = require("express"); // Express framework for handling server requests
const cors = require("cors"); // CORS middleware to enable cross-origin requests
const os = require("os"); // OS module to access operating system related utilities
const { Pool } = require("pg"); // PostgreSQL client pool from the pg module

// Initialize express application
const app = express();

app.use(cors()); // Apply CORS middleware

// Configuration for server and PostgreSQL
const PORT = 4000; // Server port
const hostname = "0.0.0.0";
const MAX_RETRIES = 10; // Maximum number of retries to connect to the database
const RETRY_DELAY = 5000; // Delay in milliseconds between retries

const pool = new Pool({
  // PostgreSQL connection pool configuration
  user: "root",
  host: "db",
  database: "pean-db",
  password: "podnes1972",
  port: 5432,
});

// Function to initialize the database
const initializeDb = async () => {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      // Create a 'users' table if it does not exist
      await pool.query(
        "CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, fullName TEXT NOT NULL)"
      );

      // Insert initial data if the table is empty
      const res = await pool.query("SELECT COUNT(*) FROM users");
      if (parseInt(res.rows[0].count) === 0) {
        await pool.query(
          "INSERT INTO users (fullName) VALUES ('Oleksii Pidnebesnyi')"
        );
      }

      break; // If no errors, exit the loop
    } catch (error) {
      console.error("Error initializing database:", error);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
};

// Define a GET route
app.get("/", async (req, res) => {
  try {
    // Fetch the first user's full name from the database
    const result = await pool.query("SELECT fullName FROM users LIMIT 1");
    const user = result.rows[0].fullname;

    // Respond with user data and container ID
    res.json({ user, containerId: os.hostname() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define a GET route to update the user's name
app.get("/update-name", async (req, res) => {
  try {
    // Get name from query string or default to 'Alex Pidnebesnyi'
    const newName = req.query.name || "Alex Pidnebesnyi";

    await pool.query("UPDATE users SET fullName = $1 WHERE id = 1", [newName]);

    res.json({ message: "Name updated successfully", newName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Function to start the server
const startServer = async () => {
  try {
    await initializeDb(); // Initialize the database
    app.listen(PORT, hostname, () => {
      // Start the server
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
  }
};

startServer(); // Invoke the server start function
