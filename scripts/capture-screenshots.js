import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const screenshotsDir = path.resolve(process.cwd(), '__screenshots__');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const stories = [
  { name: 'button-primary', url: 'http://localhost:6006/iframe.html?args=&id=example-button--primary&viewMode=story' },
  { name: 'button-secondary', url: 'http://localhost:6006/iframe.html?args=&id=example-button--secondary&viewMode=story' },
  { name: 'button-large', url: 'http://localhost:6006/iframe.html?args=&id=example-button--large&viewMode=story' },
  { name: 'button-small', url: 'http://localhost:6006/iframe.html?args=&id=example-button--small&viewMode=story' },
  { name: 'header-logged-in', url: 'http://localhost:6006/iframe.html?args=&id=example-header--logged-in&viewMode=story' },
  { name: 'header-logged-out', url: 'http://localhost:6006/iframe.html?args=&id=example-header--logged-out&viewMode=story' },
  { name: 'page-logged-in', url: 'http://localhost:6006/iframe.html?args=&id=example-page--logged-in&viewMode=story' },
  { name: 'page-logged-out', url: 'http://localhost:6006/iframe.html?args=&id=example-page--logged-out&viewMode=story' },
];

async function captureScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage({screen: {width: 800, height: 600}});
  
  console.log('📸 Capturing screenshots...');
  
  for (const story of stories) {
    try {
      console.log(`Capturing ${story.name}...`);
      await page.goto(story.url);
      await page.waitForTimeout(1000); // Wait for story to load
      
      const screenshotPath = path.join(screenshotsDir, `${story.name}.png`);
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: false 
      });
      
      console.log(`✅ Saved ${story.name}.png`);
    } catch (error) {
      console.error(`❌ Failed to capture ${story.name}:`, error);
    }
  }
  
  await browser.close();
  console.log('🎉 Screenshot capture complete!');
}

captureScreenshots().catch(console.error);