# Social Media Frame Extractor

A Node.js tool to download social media videos (currently supports **Facebook Reels**, and **Instagram Reels**) and extract frames at configurable frame rates. Designed for **research, moderation, and educational purposes**.

⸻

## ⚠️ Disclaimer
- This tool is intended for **legal and ethical use only**.
- Users **must comply** with each platform’s Terms of Service and all applicable laws.
- Do **not use** this software to access or store private, restricted, or adult content without explicit permission.
- Example content shown is for demonstration purposes only.

⸻

## Features
- Download Facebook Reels as MP4 videos.
- Download Instagram Reels as MP4 videos.
- Extract frames from videos at a configurable FPS.
- Automatically stores frames in a dedicated folder (`./frames`).
- Cookies are saved to `facebook_cookies.json`.

⸻

## Installation

```bash
git clone https://github.com/<your-username>/social-media-frame-extractor.git
cd social-media-frame-extractor
npm install
```

> Requires 'ffmpeg' and 'instaloader' installed on your system.

⸻

## Running
- For Facebook Reels, login using the following command to set up your cookies file:

```bash
node manualLogin.js
```

This will save cookies to `facebook_cookies.json`.

⸻

## Downloading Content
- Parameters:
  - `<CONTENT_ID>` – Reel/Video ID from Facebook || `<CONTENT_URL>` from Instagram.
  - `<FPS_NUMBER>` – Frames per second (default 10).

Run:
```bash
node downloadSocialMedia.js <CONTENT_ID> [FPS_NUMBER]
```

Examples:
- Download Facebook Reel with default 10 fps:
  ```bash
  node downloadSocialMedia.js 123456789
  ```
- Download with custom FPS:
  ```bash
  node downloadSocialMedia.js 123456789 20
  ```

- Download Instagram Reel with default 10 fps:
  ```bash
  node downloadSocialMedia.js https://www.instagram.com/reel/123456789
  ```
- Download with custom FPS:
  ```bash
  node downloadSocialMedia.js https://www.instagram.com/reel/123456789 20
  ```

- If no parameters are supplied, the script will prompt for the content ID and FPS.

- Downloaded videos are saved as `facebook_<id>.mp4` or `instagram_<id>.mp4`.
- Extracted frames are saved as `frame_0001.png`, `frame_0002.png`, etc. in the `./frames` folder.

⸻

## Cleanup
To cleanup all the files in frames:
```bash
node cleanup_frames
```
This will delete all files under the `frames` folder.

⸻

## Safety & Best Practices
- Only process **public or permitted content**.
- Use the tool for **AI/ML research, moderation, or educational purposes**.
- Regularly **clear downloaded content** after use.

⸻

## License
MIT License – see [LICENSE](LICENSE) for details.