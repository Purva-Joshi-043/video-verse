const { AsyncDatabase } = require("promised-sqlite3");

let db = null;

const init = async () => {
  if (!db) {
    try {
      // Create the AsyncDatabase object and open the database.
      db = await AsyncDatabase.open("./database/database.sqlite");

      console.log("Connected to the SQLite database.");

      // Create the 'videos' table if it doesn't already exist
      await db.run(`
      CREATE TABLE IF NOT EXISTS videos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT,
          path TEXT,
          duration INTEGER,
          size INTEGER,
          created_at TEXT,
          title TEXT
      )
    `);

      // Create the 'shared_links' table if it doesn't already exist
      await db.run(`
      CREATE TABLE IF NOT EXISTS shared_links (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          video_id INTEGER,
          link_id TEXT,
          link TEXT,
          expires_at TEXT,
          FOREIGN KEY(video_id) REFERENCES videos(id)
      )
    `);
    } catch (err) {
      console.error("Error initializing database:", err.message);
      throw err; // Rethrow error to indicate initialization failure
    }
  }
  return db;
};

// Initialize the database and export the db instance
init().catch((err) => {
  console.error("Failed to initialize database:", err.message);
});

module.exports = {
  getDb: init,
};
