#!/usr/bin/env node

/**
 * Convert .po files to .json format for runtime use
 */

import po2json from 'po2json';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ENABLED_LOCALES } from './enabled-locales.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Only compile the shipped locales — scaffolded-but-untranslated .po files are skipped
// so their (placeholder) catalogs never reach the bundle.
const locales = ENABLED_LOCALES;

async function convertPoFiles() {
  console.log('🔄 Converting .po files to .json...');

  // Ensure output directory exists
  const outputDir = join(projectRoot, 'src', 'lib', 'i18n', 'locales');
  await fs.mkdir(outputDir, { recursive: true });

  let convertedCount = 0;

  for (const locale of locales) {
    const poPath = join(projectRoot, 'locales', `${locale}.po`);
    const jsonPath = join(outputDir, `${locale}.json`);

    try {
      // Check if .po file exists
      await fs.access(poPath);

      // Convert to JSON
      const translations = po2json.parseFileSync(poPath, {
        format: 'mf', // Message format for interpolation
        domain: locale,
        fuzzy: false, // Skip fuzzy translations
        fallback: locale === 'en', // Use English as fallback
      });

      // Write JSON file
      await fs.writeFile(jsonPath, JSON.stringify(translations, null, 2));

      const messageCount = Object.keys(translations).length;
      console.log(`✅ ${locale}.json - ${messageCount} translations`);
      convertedCount++;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`⚠️  ${locale}.po not found, skipping...`);
      } else {
        console.error(`❌ Error converting ${locale}.po:`, error.message);
        process.exit(1);
      }
    }
  }

  console.log(`🎉 Converted ${convertedCount} files successfully`);
}

// Run conversion
convertPoFiles().catch(error => {
  console.error('❌ Conversion failed:', error);
  process.exit(1);
});
