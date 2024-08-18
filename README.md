# Video API

## Setup

1. Clone the repository.
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`.
4. Install FFmpeg Locally: `brew install ffmpeg`.
5. Run the server: `npm start`
6. Run the test suite: `npm test`

## API Endpoints

- `POST /videos/upload`: Upload a video file.
- `POST /videos/trim`: Trim an uploaded video.
- `POST /videos/merge`: Merge multiple video files.
- `POST /videos/share`: Generate a sharable link with an expiry time.
- `GET /videos/watch/:id`: Access a video via the generated link.

## Assumptions

- All API calls require a static API token.
- SQLite is used as the database for simplicity.
- File size and duration limits are enforced during upload.

## References

- [Multer Documentation](https://github.com/expressjs/multer)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
