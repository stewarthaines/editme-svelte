import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Video capture for Storybook workflow stories.
 *
 * Same discovery as capture-screenshots.js (the running Storybook's
 * index.json, filtered to the `capture` tag by default), but records each
 * story's play() run as a webm via Playwright's video recording. Meant for
 * the Workflows/* stories that seed a project and drive the app.
 *
 * Usage: npm run storybook   (in another terminal)
 *        npm run videos [-- --all | --tag <name>]
 */

const SB_URL = process.env.SB_URL ?? 'http://localhost:6006';
const videosDir = path.resolve(process.cwd(), '__videos__');

const args = process.argv.slice(2);
const captureAll = args.includes('--all');
const tagFlag = args.indexOf('--tag');
const tag = tagFlag !== -1 ? args[tagFlag + 1] : 'capture';

async function discoverStories() {
  const res = await fetch(`${SB_URL}/index.json`);
  if (!res.ok) throw new Error(`Cannot fetch ${SB_URL}/index.json — is Storybook running?`);
  const index = await res.json();
  return Object.values(index.entries).filter(
    entry => entry.type === 'story' && (captureAll || entry.tags?.includes(tag))
  );
}

async function captureVideos() {
  const stories = await discoverStories();
  if (stories.length === 0) {
    console.log(`No stories to record (tag: ${captureAll ? 'ALL' : tag}).`);
    return;
  }
  fs.mkdirSync(videosDir, { recursive: true });

  const browser = await chromium.launch();
  console.log(`🎥 Recording ${stories.length} stories from ${SB_URL}...`);

  for (const story of stories) {
    // One context per story so each recording is its own file.
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      recordVideo: { dir: videosDir, size: { width: 1280, height: 800 } },
    });
    const page = await context.newPage();
    try {
      console.log(`Recording ${story.id}...`);
      await page.goto(`${SB_URL}/iframe.html?id=${story.id}&viewMode=story`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(story.tags?.includes('play-fn') ? 40000 : 5000);

      const video = page.video();
      await context.close(); // finalises the recording
      if (video) {
        const finalPath = path.join(videosDir, `${story.id}.webm`);
        fs.renameSync(await video.path(), finalPath);
        console.log(`✅ Saved ${story.id}.webm`);
      }
    } catch (error) {
      console.error(`❌ Failed to record ${story.id}:`, error.message);
      await context.close().catch(() => {});
    }
  }

  await browser.close();
  console.log('🎉 Video capture complete!');
}

captureVideos().catch(error => {
  console.error(error);
  process.exit(1);
});
