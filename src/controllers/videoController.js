const fs = require("fs");
const path = require("path");
const multer = require("multer");
const db = require("../models/database");

const ffmpeg = require("fluent-ffmpeg");

const upload = multer({
  dest: "uploads/",
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
    const file = req.file;
    const duration = await validateVideo(file.path);

    if (duration < 5 || duration > 35) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ message: "Invalid video duration." });
    }

    const stmt = db.prepare(
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

const trimVideo = (req, res) => {
  const { id, start, end } = req.body;

  db.get("SELECT * FROM videos WHERE id = ?", [id], (err, video) => {
    if (err || !video)
      return res.status(404).json({ message: "Video not found." });

    const outputFile = `uploads/trimmed_${video.filename}.mp4`;

    ffmpeg(video.path)
      .setStartTime(start)
      .setDuration(end - start)
      .output(outputFile)
      .on("end", () => {
        db.run("UPDATE videos SET path = ? WHERE id = ?", [outputFile, id]);
        res.status(200).json({ message: "Video trimmed successfully." });
      })
      .on("error", (err) => {
        res.status(500).json({ message: "Error trimming video." });
      })
      .run();
  });
};

const mergeVideos = (req, res) => {
  const { videoIds } = req.body;

  const paths = [];
  videoIds.forEach((id, index) => {
    db.get("SELECT * FROM videos WHERE id = ?", [id], (err, video) => {
      if (err || !video)
        return res
          .status(404)
          .json({ message: `Video with ID ${id} not found.` });

      paths.push(video.path);

      if (index === videoIds.length - 1) {
        const outputFile = `uploads/merged_${Date.now()}.mp4`;
        const ffmpegCommand = ffmpeg();

        paths.forEach((p) => ffmpegCommand.input(p));
        ffmpegCommand
          .on("end", () => {
            db.run(
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
            res.status(500).json({ message: "Error merging videos." });
          })
          .mergeToFile(outputFile);
      }
    });
  });
};

const shareVideoLink = (req, res) => {
  const { id, expiry } = req.body;

  db.get("SELECT * FROM videos WHERE id = ?", [id], (err, video) => {
    if (err || !video)
      return res.status(404).json({ message: "Video not found." });

    const link = `http://localhost:${process.env.PORT}/videos/watch/${id}`;
    const expiryDate = new Date(Date.now() + expiry * 1000).toISOString();

    db.run(
      "INSERT INTO shared_links (video_id, link, expires_at) VALUES (?, ?, ?)",
      [id, link, expiryDate]
    );

    res.status(201).json({ link, expires_at: expiryDate });
  });
};

const watchVideo = (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM shared_links WHERE video_id = ?", [id], (err, link) => {
    if (err || !link)
      return res.status(404).json({ message: "Link not found." });

    if (new Date(link.expires_at) < new Date()) {
      return res.status(403).json({ message: "Link expired." });
    }

    db.get("SELECT * FROM videos WHERE id = ?", [id], (err, video) => {
      if (err || !video)
        return res.status(404).json({ message: "Video not found." });

      res.sendFile(path.resolve(video.path));
    });
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
