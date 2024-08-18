const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const videoController = require("../controllers/videoController");

router.post(
  "/upload",
  auth,
  videoController.upload.single("video"),
  videoController.uploadVideo
);
router.post("/trim", auth, videoController.trimVideo);
router.post("/merge", auth, videoController.mergeVideos);
router.post("/share", auth, videoController.shareVideoLink);
router.get("/watch/:id", videoController.watchVideo);

module.exports = router;
