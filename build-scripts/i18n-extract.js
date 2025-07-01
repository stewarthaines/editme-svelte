#!/usr/bin/env node

/**
 * Extract translatable strings from Svelte files using gettext-extractor
 */

import { GettextExtractor, JsExtractors } from 'gettext-extractor';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const locales = ['en', 'de', 'ka', 'ar', 'he', 'zh-Hant', 'ja'];

async function extractStrings() {
  console.log('🔍 Extracting translatable strings...');

  const extractor = new GettextExtractor();

  // Find all Svelte and TypeScript files, excluding test files
  const svelteFiles = await glob('src/**/*.svelte', { 
    cwd: projectRoot,
    ignore: ['**/*.test.*', '**/test/**', '**/__tests__/**']
  });
  const tsFiles = await glob('src/**/*.ts', { 
    cwd: projectRoot,
    ignore: ['**/*.test.*', '**/test/**', '**/__tests__/**']
  });
  const allFiles = [...svelteFiles, ...tsFiles];

  console.log(`📁 Found ${allFiles.length} files to scan`);

  // Extract from each file
  for (const file of allFiles) {
    const fullPath = join(projectRoot, file);
    
    extractor
      .createJsParser([
        // Basic translation calls: t('text')
        JsExtractors.callExpression('t', {
          arguments: {
            text: 0,
            context: 1
          }
        }),
        // Reactive store syntax: $t('text')
        JsExtractors.callExpression('$t', {
          arguments: {
            text: 0,
            context: 1
          }
        }),
        // Alternative underscore syntax: _('text') 
        JsExtractors.callExpression('_', {
          arguments: {
            text: 0,
            context: 1
          }
        })
      ])
      .parseFile(fullPath);
  }

  // Create/update .po files for each locale
  for (const locale of locales) {
    const poPath = join(projectRoot, 'locales', `${locale}.po`);
    
    try {
      console.log(`💾 Updating ${locale}.po...`);
      
      // Read existing translations if file exists
      const existingTranslations = {};
      if (existsSync(poPath)) {
        const existingContent = readFileSync(poPath, 'utf8');
        const lines = existingContent.split('\n');
        
        let currentMsgid = '';
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('msgid "') && line !== 'msgid ""') {
            const match = line.match(/^msgid "(.+)"$/);
            if (match) {
              currentMsgid = match[1];
            }
          } else if (line.startsWith('msgstr "') && currentMsgid) {
            const match = line.match(/^msgstr "(.+)"$/);
            if (match && match[1] !== '') {
              existingTranslations[currentMsgid] = match[1];
            }
            currentMsgid = '';
          }
        }
        console.log(`📚 Preserved ${Object.keys(existingTranslations).length} existing translations for ${locale}`);
      }
      
      // Generate new .po file
      extractor.savePotFile(poPath, {
        'Language': locale,
        'MIME-Version': '1.0',
        'Content-Type': 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding': '8bit',
        'Project-Id-Version': 'EDITME EPUB Editor',
        'Report-Msgid-Bugs-To': '',
        'POT-Creation-Date': new Date().toISOString(),
        'PO-Revision-Date': new Date().toISOString(),
        'Last-Translator': '',
        'Language-Team': '',
        'Plural-Forms': 'nplurals=2; plural=(n != 1);'
      });
      
      // Merge back existing translations
      if (Object.keys(existingTranslations).length > 0) {
        let content = readFileSync(poPath, 'utf8');
        const lines = content.split('\n');
        const result = [];
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          result.push(line);
          
          if (line.startsWith('msgid "') && line !== 'msgid ""') {
            const match = line.match(/^msgid "(.+)"$/);
            if (match && existingTranslations[match[1]]) {
              // Look ahead for msgstr line and replace it
              if (i + 1 < lines.length && lines[i + 1].startsWith('msgstr ""')) {
                result[result.length] = `msgstr "${existingTranslations[match[1]]}"`;
                i++; // Skip original empty msgstr
              }
            }
          }
        }
        
        // Write back the merged content
        writeFileSync(poPath, result.join('\n'));
      }
      
    } catch (error) {
      console.error(`❌ Error creating ${locale}.po:`, error.message);
      process.exit(1);
    }
  }

  const messageCount = extractor.getMessages().length;
  console.log(`✅ Extracted ${messageCount} translatable strings`);
  console.log(`📝 Updated ${locales.length} .po files`);
}

// Run extraction
extractStrings().catch(error => {
  console.error('❌ Extraction failed:', error);
  process.exit(1);
});