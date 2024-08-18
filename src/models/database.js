const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database/database.sqlite", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the SQLite database.");
});

db.run(`
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

db.run(`
    CREATE TABLE IF NOT EXISTS shared_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id INTEGER,
        link TEXT,
        expires_at TEXT,
        FOREIGN KEY(video_id) REFERENCES videos(id)
    )
`);

module.exports = db;
