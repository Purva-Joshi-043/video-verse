const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { getDb } = require("../models/database");
const ffmpeg = require("fluent-ffmpeg");
const { randomUUID } = require("crypto");

// Configure Multer storage with original file extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit
});

const validateVideo = (filePath) =>
  new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format.duration;
      resolve(duration);
    });
  });

const uploadVideo = async (req, res) => {
  try {
    const db = await getDb();
    const file = req.file;
    const duration = await validateVideo(file.path);

    if (duration < 5 || duration > 25) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ message: "Invalid video duration." });
    }

    const stmt = await db.prepare(
      "INSERT INTO videos (filename, path, duration, size, created_at, title) VALUES (?, ?, ?, ?, ?, ?)"
    );

    stmt.run(
      file.filename,
      file.path,
      Math.floor(duration),
      file.size,
      new Date().toISOString(),
      file.originalname
    );
    stmt.finalize();

    res.status(201).json({ message: "Video uploaded successfully." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

const trimVideo = async (req, res) => {
  const db = await getDb();
  const { id, start, end } = req.body;

  db.get("SELECT * FROM videos WHERE id = ?", [id], (err, video) => {
    if (err || !video)
      return res.status(404).json({ message: "Video not found." });

    const outputFile = `uploads/trimmed_${video.filename}.mp4`;

    ffmpeg(video.path)
      .setStartTime(start)
      .setDuration(end - start)
      .output(outputFile)
      .on("end", async () => {
        await db.run("UPDATE videos SET path = ? WHERE id = ?", [
          outputFile,
          id,
        ]);
        res.status(200).json({ message: "Video trimmed successfully." });
      })
      .on("error", (err) => {
        res.status(500).json({ message: "Error trimming video." });
      })
      .run();
  });
};

const mergeVideos = async (req, res) => {
  const db = await getDb();
  const { videoIds } = req.body;
  const paths = await Promise.all(
    videoIds.map(async (id) => {
      const video = await db.get("SELECT * FROM videos WHERE id = ?", [id]);
      if (!video) {
        return res
          .status(404)
          .json({ message: `Video not found with id - ${id}` });
      }
      return video.path;
    })
  );

  const outputFile = `uploads/merged_${Date.now()}.mp4`;
  const ffmpegCommand = ffmpeg();

  console.log("\n hhu ", paths, "\n");
  paths.forEach((p) => ffmpegCommand.input(p));
  ffmpegCommand
    .on("end", async () => {
      await db.run(
        "INSERT INTO videos (filename, path, duration, size, created_at) VALUES (?, ?, ?, ?, ?)",
        [
          path.basename(outputFile),
          outputFile,
          null,
          null,
          new Date().toISOString(),
        ]
      );
      res.status(200).json({ message: "Videos merged successfully." });
    })
    .on("error", (err) => {
      console.log(err);
      res.status(500).json({ message: "Error merging videos." });
    })
    .mergeToFile(outputFile);
};

const shareVideoLink = async (req, res) => {
  const db = await getDb();
  const { id, expiry } = req.body;

  db.get("SELECT * FROM videos WHERE id = ?", [id], async (err, video) => {
    if (err || !video)
      return res.status(404).json({ message: "Video not found." });

    const expiryDate = new Date(Date.now() + expiry * 1000).toISOString();

    const uuid = randomUUID();
    const link = `http://localhost:${process.env.PORT}/videos/watch/${uuid}`;

    await db.run(
      "INSERT INTO shared_links (video_id, link_id, link, expires_at) VALUES (?, ?, ?, ?)",
      [id, uuid, link, expiryDate]
    );

    res.status(201).json({ link, expires_at: expiryDate });
  });
};

const watchVideo = (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM shared_links WHERE link_id = ?", [id], (err, link) => {
    if (err || !link)
      return res.status(404).json({ message: "Link not found." });

    if (new Date(link.expires_at) < new Date()) {
      return res.status(403).json({ message: "Link expired." });
    }

    db.get(
      "SELECT * FROM videos WHERE id = ?",
      [link.video_id],
      (err, video) => {
        if (err || !video)
          return res.status(404).json({ message: "Video not found." });

        res.sendFile(path.resolve(video.path));
      }
    );
  });
};

module.exports = {
  upload,
  uploadVideo,
  trimVideo,
  mergeVideos,
  shareVideoLink,
  watchVideo,
};
