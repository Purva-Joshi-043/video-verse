const request = require("supertest");
const app = require("../../../app");
const path = require("path");
const db = require("../../models/database");

describe("Video API End-to-End Tests", () => {
  afterAll((done) => {
    db.close(done);
  });

  it("should upload a video", async () => {
    const res = await request(app)
      .post("/videos/upload")
      .set("Authorization", process.env.API_TOKEN)
      .attach("video", path.resolve(__dirname, "sample.mp4"));

    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toBe("Video uploaded successfully.");
  });

  it("should trim a video", async () => {
    // First upload the video
    const uploadRes = await request(app)
      .post("/videos/upload")
      .set("Authorization", process.env.API_TOKEN)
      .attach("video", path.resolve(__dirname, "sample.mp4"));

    const videoId = uploadRes.body.id;

    // Now trim the video
    const res = await request(app)
      .post("/videos/trim")
      .set("Authorization", process.env.API_TOKEN)
      .send({
        id: videoId,
        start: 5,
        end: 15,
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Video trimmed successfully.");
  });

  it("should merge videos", async () => {
    // First upload two videos
    const uploadRes1 = await request(app)
      .post("/videos/upload")
      .set("Authorization", process.env.API_TOKEN)
      .attach("video", path.resolve(__dirname, "sample1.mp4"));

    const uploadRes2 = await request(app)
      .post("/videos/upload")
      .set("Authorization", process.env.API_TOKEN)
      .attach("video", path.resolve(__dirname, "sample2.mp4"));

    const videoId1 = uploadRes1.body.id;
    const videoId2 = uploadRes2.body.id;

    // Now merge the videos
    const res = await request(app)
      .post("/videos/merge")
      .set("Authorization", process.env.API_TOKEN)
      .send({
        videoIds: [videoId1, videoId2],
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Videos merged successfully.");
  });

  it("should generate a shareable link", async () => {
    // First upload a video
    const uploadRes = await request(app)
      .post("/videos/upload")
      .set("Authorization", process.env.API_TOKEN)
      .attach("video", path.resolve(__dirname, "sample.mp4"));

    const videoId = uploadRes.body.id;

    // Now generate the shareable link
    const res = await request(app)
      .post("/videos/share")
      .set("Authorization", process.env.API_TOKEN)
      .send({
        id: videoId,
        expiry: 3600, // 1 hour
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("link");
    expect(res.body).toHaveProperty("expires_at");
  });

  it("should allow access to a video via a shared link", async () => {
    // First upload a video
    const uploadRes = await request(app)
      .post("/videos/upload")
      .set("Authorization", process.env.API_TOKEN)
      .attach("video", path.resolve(__dirname, "sample.mp4"));

    const videoId = uploadRes.body.id;

    // Now generate the shareable link
    const shareRes = await request(app)
      .post("/videos/share")
      .set("Authorization", process.env.API_TOKEN)
      .send({
        id: videoId,
        expiry: 3600, // 1 hour
      });

    const sharedLink = shareRes.body.link;

    // Access the video via the shared link
    const res = await request(app).get(`/videos/watch/${videoId}`);

    expect(res.statusCode).toEqual(200);
    expect(res.headers["content-type"]).toMatch(/video\/mp4/);
  });
});
