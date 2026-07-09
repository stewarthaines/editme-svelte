#!/usr/bin/env node
/**
 * Rename guard: the pre-2026 product name must not reappear.
 *
 * Scans every git-tracked file (case-insensitive) for the former name. The
 * single sanctioned exception is the legacy-storage migration module, which
 * exists to name the old IndexedDB database it adopts projects from; its
 * allowlist entry is deleted together with the module when the migration
 * window closes. See process/RENAME_SEED_HTML.md.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Assembled to keep this guard out of its own net.
const FORMER_NAME = ['edit', 'me'].join('');

const ALLOWLIST = new Set(['src/lib/storage/legacy-migration.ts']);

const files = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);

const offenders = [];
for (const file of files) {
  if (ALLOWLIST.has(file)) continue;
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue; // unreadable/binary
  }
  if (text.toLowerCase().includes(FORMER_NAME)) {
    const line = text.split('\n').findIndex(l => l.toLowerCase().includes(FORMER_NAME)) + 1;
    offenders.push(`${file}:${line}`);
  }
}

if (offenders.length > 0) {
  console.error(`✖ rename guard: the former product name appears outside the allowlist:`);
  for (const hit of offenders) console.error(`  ${hit}`);
  process.exit(1);
}
console.log('✓ rename guard: no former-name references outside the allowlist');
