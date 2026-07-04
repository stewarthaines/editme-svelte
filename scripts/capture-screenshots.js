import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Automated screenshot capture for Storybook stories.
 *
 * Stories are discovered from the running Storybook's index (index.json) —
 * no hard-coded story ids. By default only stories tagged `capture` are
 * shot (tag workflow stories with `tags: ['capture']` in defineMeta);
 * pass --all to shoot every story, or --tag <name> for a different tag.
 *
 * Stories with a play function (Storybook tags them `play-fn`) get a long
 * settle wait so the interaction completes before the shot.
 *
 * Usage: npm run storybook   (in another terminal)
 *        npm run screenshots [-- --all | --tag <name>]
 */

const SB_URL = process.env.SB_URL ?? 'http://localhost:6006';
const screenshotsDir = path.resolve(process.cwd(), '__screenshots__');

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

async function captureScreenshots() {
  const stories = await discoverStories();
  if (stories.length === 0) {
    console.log(`No stories to capture (tag: ${captureAll ? 'ALL' : tag}).`);
    return;
  }
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log(`📸 Capturing ${stories.length} stories from ${SB_URL}...`);

  for (const story of stories) {
    try {
      console.log(`Capturing ${story.id}...`);
      await page.goto(`${SB_URL}/iframe.html?id=${story.id}&viewMode=story`);
      await page.waitForLoadState('networkidle');
      // Play-function stories drive a workflow first; give it time to finish.
      await page.waitForTimeout(story.tags?.includes('play-fn') ? 40000 : 2000);

      await page.screenshot({ path: path.join(screenshotsDir, `${story.id}.png`) });
      console.log(`✅ Saved ${story.id}.png`);
    } catch (error) {
      console.error(`❌ Failed to capture ${story.id}:`, error.message);
    }
  }

  await browser.close();
  console.log('🎉 Screenshot capture complete!');
}

captureScreenshots().catch(error => {
  console.error(error);
  process.exit(1);
});
