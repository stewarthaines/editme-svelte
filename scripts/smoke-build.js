import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { pathToFileURL } from 'url';

/**
 * Build-boot smoke test.
 *
 * Unit tests run against source in happy-dom; nothing exercises the actual
 * single-file build artifact. This script boots the built `dist/index.html` in a
 * real Chromium — over HTTP and over file:// — and asserts the app mounts with no
 * uncaught errors. It is the safety net for build-toolchain upgrades (Vite /
 * Rollup / vite-plugin-singlefile), where a regression (e.g. an over-aggressive
 * treeshake) passes every unit test but produces a blank page.
 *
 * Usage: npm run smoke   (build first: `npm run build`)
 */

const distDir = path.resolve(process.cwd(), 'dist');
const indexPath = path.join(distDir, 'index.html');
const PORT = 4178;
const MOUNT_TIMEOUT_MS = 20000;

// Console errors that are noise, not boot failures.
const IGNORED_CONSOLE = [/favicon\.ico/i, /Failed to load resource.*favicon/i];

function fail(msg) {
  console.error(`\n❌ smoke: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  fail(`no build found at ${indexPath}. Run \`npm run build\` first.`);
}

/** Serve the single-file app: every non-favicon path returns index.html. */
function startServer() {
  const html = fs.readFileSync(indexPath);
  const server = http.createServer((req, res) => {
    if (req.url && /favicon\.ico$/.test(req.url)) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  return new Promise(resolve => server.listen(PORT, () => resolve(server)));
}

/**
 * Load `url` in a fresh page and assert the app mounts without uncaught errors.
 * Returns a list of problems (empty = pass).
 */
async function bootCheck(browser, url, label) {
  const problems = [];
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('pageerror', err => problems.push(`[${label}] uncaught: ${err.message}`));
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (IGNORED_CONSOLE.some(re => re.test(text))) return;
    problems.push(`[${label}] console.error: ${text}`);
  });

  try {
    await page.goto(url, { waitUntil: 'load', timeout: MOUNT_TIMEOUT_MS });
    // App is mounted once #app has rendered at least one child element.
    await page.waitForFunction(
      () => {
        const app = document.getElementById('app');
        return !!app && app.childElementCount > 0;
      },
      { timeout: MOUNT_TIMEOUT_MS }
    );
    console.log(`✓ [${label}] app mounted`);
  } catch (e) {
    problems.push(`[${label}] app did not mount: ${e instanceof Error ? e.message : e}`);
  }

  await context.close();
  return problems;
}

/** Launch Chromium, falling back to the system Chrome if no browser is downloaded. */
async function launchBrowser() {
  try {
    return await chromium.launch();
  } catch (e) {
    if (e instanceof Error && /Executable doesn't exist/.test(e.message)) {
      console.log('• Playwright browser not installed; using system Chrome (channel: chrome)');
      return await chromium.launch({ channel: 'chrome' });
    }
    throw e;
  }
}

const server = await startServer();
const browser = await launchBrowser();
const problems = [];

try {
  problems.push(...(await bootCheck(browser, `http://localhost:${PORT}/`, 'http')));
  problems.push(...(await bootCheck(browser, pathToFileURL(indexPath).href, 'file')));
} finally {
  await browser.close();
  server.close();
}

if (problems.length > 0) {
  console.error('\nProblems:');
  for (const p of problems) console.error(`  - ${p}`);
  fail(`${problems.length} problem(s) booting the built single-file.`);
}

console.log('\n✅ smoke: built single-file boots over http and file://');
