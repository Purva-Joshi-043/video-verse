const {
  uploadVideo,
  trimVideo,
  mergeVideos,
  shareVideoLink,
  watchVideo,
} = require("../../controllers/videoController");
const db = require("../../models/database");

jest.mock("fluent-ffmpeg", () =>
  jest.fn().mockReturnValue({
    ffprobe: jest.fn(),
    setStartTime: jest.fn().mockReturnThis(),
    setDuration: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    on: jest.fn().mockImplementation((event, callback) => {
      if (event === "end") callback();
      return { run: jest.fn() };
    }),
  })
);

describe("Video Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should upload a video successfully", async () => {
    const req = {
      file: {
        filename: "test.mp4",
        path: "uploads/test.mp4",
        size: 5000000,
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    db.run = jest.fn();

    await uploadVideo(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Video uploaded successfully.",
    });
    expect(db.run).toHaveBeenCalled();
  });

  it("should return an error if video duration is invalid", async () => {
    const req = {
      file: {
        filename: "test.mp4",
        path: "uploads/test.mp4",
        size: 5000000,
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const validateVideo = jest
      .spyOn(global, "validateVideo")
      .mockResolvedValue(3);

    await uploadVideo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid video duration.",
    });
  });

  // Additional unit tests for trimming, merging, and sharing
  it("should trim a video successfully", async () => {
    const req = {
      body: {
        id: 1,
        start: 5,
        end: 20,
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.get = jest.fn((query, params, callback) => {
      callback(null, { path: "uploads/test.mp4", filename: "test.mp4" });
    });
    db.run = jest.fn();

    await trimVideo(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Video trimmed successfully.",
    });
  });

  it("should merge videos successfully", async () => {
    const req = {
      body: {
        videoIds: [1, 2],
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.get = jest.fn((query, params, callback) => {
      callback(null, { path: "uploads/test.mp4" });
    });
    db.run = jest.fn();

    await mergeVideos(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Videos merged successfully.",
    });
  });

  it("should generate a shareable link", async () => {
    const req = {
      body: {
        id: 1,
        expiry: 3600,
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    db.get = jest.fn((query, params, callback) => {
      callback(null, { id: 1 });
    });
    db.run = jest.fn();

    await shareVideoLink(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        link: expect.any(String),
        expires_at: expect.any(String),
      })
    );
  });
});
