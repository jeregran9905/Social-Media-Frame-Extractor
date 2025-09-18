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
  let contentId = process.argv[2];
  let fps = process.argv[3] ? parseInt(process.argv[3], 10) : null;

  if (!contentId) {
    contentId = await askQuestion('Enter the Facebook Reel ID: ');
  }

  if (!fps) {
    const fpsInput = await askQuestion('Enter FPS (default 10): ');
    fps = fpsInput ? parseInt(fpsInput, 10) : 10;
  }

  const contentUrl = `https://www.facebook.com/reel/${contentId}`;
  const outputDir = path.resolve('./frames');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const storageStatePath = path.resolve('./facebook_cookies.json');
  if (!fs.existsSync(storageStatePath)) {
    console.log('Cookies file for Facebook not found. Launching manualLogin.js to generate cookies...');
    execSync('node manualLogin.js', { stdio: 'inherit' });
    if (!fs.existsSync(storageStatePath)) {
      console.error('manualLogin.js did not generate facebook cookies. Exiting.');
      process.exit(1);
    }
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ storageState: storageStatePath });
  const page = await context.newPage();

  console.log(`Navigating to Facebook content: ${contentUrl}`);

  await page.goto(contentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for a visible video element and get its src
  await page.waitForSelector('video', { timeout: 10000 });

  const videoUrl = await page.evaluate(() => {
    const videoEl = document.querySelector('video');
    return videoEl ? videoEl.src : null;
  });

  if (!videoUrl) {
    console.error('No MP4 video URL was captured.');
    await browser.close();
    process.exit(1);
  }

  console.log(`Direct MP4 URL captured: ${videoUrl}`);

  const videoPath = path.join(outputDir, `facebook_${contentId}.mp4`);
  execSync(`curl -L "${videoUrl}" -o "${videoPath}"`, { stdio: 'inherit' });

  if (!fs.existsSync(videoPath) || fs.statSync(videoPath).size < 1000) {
    console.error('Downloaded video seems invalid. Exiting.');
    process.exit(1);
  }

  execSync(`ffmpeg -i "${videoPath}" -vf "fps=${fps}" "${path.join(outputDir, 'frame_%04d.png')}"`, { stdio: 'inherit' });

  console.log('Frames extracted to', outputDir);
  await browser.close();
})();