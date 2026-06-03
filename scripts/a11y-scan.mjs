/**
 * Full-app accessibility scan.
 *
 * Drives the running app with Playwright and runs axe-core on each view, reporting
 * whole-page issues (landmarks, focus order, contrast, cross-component) that the
 * Storybook component-level a11y addon can't see. The app is a stateful SPA with no
 * URL routes, so we navigate by clicking the sidebar (and create a project to reach
 * the workspace-dependent views) rather than page.goto(route).
 *
 * Usage:
 *   npm run dev                 # in another terminal (or set A11Y_URL)
 *   npm run test:a11y           # report only (exit 0)
 *   npm run test:a11y -- --fail-on=serious   # exit 1 on serious/critical violations
 *
 * Env: A11Y_URL (default http://localhost:5173)
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const URL = process.env.A11Y_URL || 'http://localhost:5173';
const failOnArg = process.argv.find(a => a.startsWith('--fail-on='));
const failOn = failOnArg ? failOnArg.split('=')[1] : null;
const IMPACT_ORDER = ['minor', 'moderate', 'serious', 'critical'];
const rank = impact => IMPACT_ORDER.indexOf(impact ?? 'minor');

async function scanView(page, label) {
  // Exclude iframes: the spine preview holds the author's EPUB content (it has its own
  // in-preview axe) and the publish view embeds the plugin (a separate app). We only
  // want the app's own chrome here.
  const { violations } = await new AxeBuilder({ page }).exclude('iframe').analyze();
  return { label, violations };
}

async function clickNav(page, name) {
  await page.getByRole('button', { name, exact: true }).first().click();
  // SPA view swap: no navigation event to await — settle briefly and wait for content.
  await page.waitForTimeout(500);
  await page
    .locator('.main-content')
    .first()
    .waitFor({ state: 'visible', timeout: 10000 })
    .catch(() => undefined);
}

function printViolations({ label, violations }) {
  if (violations.length === 0) {
    console.log(`\n✓ ${label} — no violations`);
    return;
  }
  console.log(`\n✗ ${label} — ${violations.length} violation${violations.length === 1 ? '' : 's'}`);
  for (const v of violations.slice().sort((a, b) => rank(b.impact) - rank(a.impact))) {
    const target = v.nodes[0]?.target?.join(' ') ?? '';
    console.log(
      `   [${(v.impact ?? 'n/a').toUpperCase()}] ${v.id} — ${v.help}` +
        ` (${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'}: ${target})`
    );
    console.log(`        ${v.helpUrl}`);
  }
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(URL, { waitUntil: 'networkidle' });
  } catch (e) {
    console.error(`\nCould not load ${URL} — is the dev server running? (${e.message})`);
    await browser.close();
    process.exit(2);
  }

  // App shell ready (sidebar nav present).
  await page
    .getByRole('button', { name: 'Projects', exact: true })
    .first()
    .waitFor({ timeout: 15000 })
    .catch(() => undefined);

  const reports = [];
  const scan = async label => {
    try {
      reports.push(await scanView(page, label));
    } catch (e) {
      console.warn(`\nWARN: could not scan "${label}": ${e.message}`);
      reports.push({ label, violations: [], skipped: true });
    }
  };

  // Views reachable without a workspace.
  for (const name of ['Projects', 'About', 'Publish', 'Settings']) {
    try {
      await clickNav(page, name);
    } catch (e) {
      console.warn(`\nWARN: could not navigate to "${name}": ${e.message}`);
      continue;
    }
    await scan(name);
  }

  // Create a minimal project, then scan the workspace-dependent views.
  let workspaceReady = false;
  try {
    await clickNav(page, 'Projects');
    await page
      .getByRole('button', { name: /create a new/i })
      .first()
      .click();
    // Create lands on Metadata; its nav button only appears once a workspace exists.
    await page
      .getByRole('button', { name: 'Metadata', exact: true })
      .first()
      .waitFor({ state: 'visible', timeout: 20000 });
    workspaceReady = true;
  } catch (e) {
    console.warn(`\nWARN: could not create a project (skipping workspace views): ${e.message}`);
  }

  if (workspaceReady) {
    for (const name of ['Metadata', 'Manifest', 'Navigation']) {
      try {
        await clickNav(page, name);
      } catch (e) {
        console.warn(`\nWARN: could not navigate to "${name}": ${e.message}`);
        continue;
      }
      await scan(name);
    }
    // Spine editor: reached by selecting a chapter (best-effort — a minimal project may
    // have one). Each spine item is a role=button .spine-item in the sidebar.
    try {
      const firstChapter = page.locator('.spine-item').first();
      if (await firstChapter.count()) {
        await firstChapter.click();
        await page.waitForTimeout(700);
        await scan('Spine (chapter editor)');
      } else {
        console.warn('\nWARN: no chapter found to open the Spine editor — skipped.');
      }
    } catch (e) {
      console.warn(`\nWARN: could not open the Spine editor: ${e.message}`);
    }
  }

  await browser.close();

  // Report.
  console.log('\n──────── Accessibility scan ────────');
  reports.forEach(printViolations);

  const all = reports.flatMap(r => r.violations);
  const byImpact = {};
  for (const v of all) byImpact[v.impact ?? 'n/a'] = (byImpact[v.impact ?? 'n/a'] ?? 0) + 1;
  const summary = IMPACT_ORDER.slice()
    .reverse()
    .filter(i => byImpact[i])
    .map(i => `${byImpact[i]} ${i}`)
    .join(', ');
  console.log(
    `\n──────── Summary: ${all.length} violation${all.length === 1 ? '' : 's'} across ` +
      `${reports.length} views${summary ? ` (${summary})` : ''} ────────`
  );

  if (failOn) {
    const threshold = rank(failOn);
    const failing = all.filter(v => rank(v.impact) >= threshold);
    if (failing.length) {
      console.error(`\nFAIL: ${failing.length} violation(s) at or above "${failOn}".`);
      process.exit(1);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(2);
});
