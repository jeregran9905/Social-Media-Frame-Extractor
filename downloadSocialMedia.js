import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

function askQuestion(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
}

(async () => {
  let input = process.argv[2];
  let fps = process.argv[3] ? parseInt(process.argv[3], 10) : null;

  if (!input) {
    input = await askQuestion('Enter Facebook Reel ID or Instagram Reel URL: ');
  }

  if (!fps) {
    const fpsInput = await askQuestion('Enter FPS (default 10): ');
    fps = fpsInput ? parseInt(fpsInput, 10) : 10;
  }

  const outputDir = path.resolve('./frames');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Determine platform and reel ID
  let platform = '';
  let reelId = '';
  let contentUrl = '';

  if (input.startsWith('https://www.instagram.com/reel/')) {
    platform = 'instagram';
    const match = input.match(/reel\/([^\/\?]+)/);
    if (!match) {
      console.error('Invalid Instagram Reel URL.');
      process.exit(1);
    }
    reelId = match[1];
    contentUrl = input;
  } else {
    platform = 'facebook';
    reelId = input;
    contentUrl = `https://www.facebook.com/reel/${reelId}`;
  }

  if (platform === 'facebook') {
    const storageStatePath = path.resolve('./facebook_cookies.json');

    if (!fs.existsSync(storageStatePath)) {
      console.log('Cookies file not found. Launching manualLogin.js to generate cookies...');
      execSync('node manualLogin.js', { stdio: 'inherit' });
      if (!fs.existsSync(storageStatePath)) {
        console.error('manualLogin.js did not generate Facebook cookies. Exiting.');
        process.exit(1);
      }
    }

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ storageState: storageStatePath });
    const page = await context.newPage();

    console.log(`Navigating to Facebook Reel: ${contentUrl}`);
    try {
      await page.goto(contentUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForSelector('video', { timeout: 10000 });
    } catch (err) {
      console.error('Failed to load Facebook Reel:', err.message);
      await browser.close();
      process.exit(1);
    }

    const videoUrl = await page.evaluate(() => {
      const videoEl = document.querySelector('video');
      return videoEl ? videoEl.src : null;
    });

    if (!videoUrl) {
      console.error('No MP4 video URL matching the Reel ID was captured. Exiting.');
      await browser.close();
      process.exit(1);
    }

    console.log(`Direct MP4 URL captured: ${videoUrl}`);
    const videoPath = path.join(outputDir, `facebook_${reelId}.mp4`);

    execSync(`curl -L "${videoUrl}" -o "${videoPath}"`, { stdio: 'inherit' });

    if (!fs.existsSync(videoPath) || fs.statSync(videoPath).size < 1000) {
      console.error('Downloaded video seems invalid. Exiting.');
      process.exit(1);
    }

    execSync(`ffmpeg -i "${videoPath}" -vf "fps=${fps}" "${path.join(outputDir, 'frame_%04d.png')}"`, { stdio: 'inherit' });
    console.log('Frames extracted to', outputDir);
    await browser.close();

  } else if (platform === 'instagram') {
    console.log(`Downloading Instagram Reel: ${contentUrl}`);

    // Check if instaloader is installed
    try {
      execSync('instaloader --version', { stdio: 'ignore' });
    } catch {
      console.error('Instaloader is not installed. Please install it: pip install instaloader');
      process.exit(1);
    }

    const igVideoPath = path.join(outputDir, `instagram_${reelId}.mp4`);
    const igCommand = `instaloader --no-posts --no-profile-pic --no-captions --dirname-pattern="${outputDir}" --filename-pattern="instagram_${reelId}" -- -${reelId}`;

    try {
      execSync(igCommand, { stdio: 'inherit' });
    } catch (err) {
      console.error('Instagram download failed:', err.message);
      process.exit(1);
    }

    if (!fs.existsSync(igVideoPath)) {
      console.error('Instagram video not found after download. Exiting.');
      process.exit(1);
    }

    execSync(`ffmpeg -i "${igVideoPath}" -vf "fps=${fps}" "${path.join(outputDir, 'frame_%04d.png')}"`, { stdio: 'inherit' });
    console.log('Frames extracted to', outputDir);
  }

})();