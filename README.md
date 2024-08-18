# Video API

## Setup

1. Clone the repository.
2. Install dependencies: `npm install`
3. Set up environment variables:
   - Create a `.env` file in the root directory of the project.
   - Add the following variables to the `.env` file:
     ```env
     PORT=3000
     API_TOKEN=your_api_token_here
     ```
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
- [FFmpeg npm Documentation](https://www.npmjs.com/package/ffmpeg)
- [promised-sqlite npm Documentation](https://www.npmjs.com/package/promised-sqlite3)