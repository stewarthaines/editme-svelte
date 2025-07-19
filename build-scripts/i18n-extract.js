#!/usr/bin/env node

/**
 * Extract translatable strings from Svelte files using gettext-extractor
 */

import gettextExtractor from 'gettext-extractor';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const { GettextExtractor, JsExtractors } = gettextExtractor;

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
    ignore: ['**/*.test.*', '**/test/**', '**/__tests__/**'],
  });
  const tsFiles = await glob('src/**/*.ts', {
    cwd: projectRoot,
    ignore: ['**/*.test.*', '**/test/**', '**/__tests__/**'],
  });

  console.log(`📁 Found ${svelteFiles.length} Svelte files and ${tsFiles.length} TypeScript files to scan`);

  // Configure extraction options
  const extractorOptions = {
    arguments: {
      text: 0,
      context: 1,
    },
  };

  // Extract from TypeScript files using JavaScript parser
  const jsParser = extractor
    .createJsParser([
      JsExtractors.callExpression('t', extractorOptions),
      JsExtractors.callExpression('$t', extractorOptions),
      JsExtractors.callExpression('_', extractorOptions),
      JsExtractors.callExpression('translate', extractorOptions),
    ]);
  
  for (const file of tsFiles) {
    const fullPath = join(projectRoot, file);
    jsParser.parseFile(fullPath);
  }

  // Extract from Svelte files using custom regex approach
  for (const file of svelteFiles) {
    const fullPath = join(projectRoot, file);
    const content = readFileSync(fullPath, 'utf8');
    
    // Use regex to find translation patterns in Svelte templates
    const patterns = [
      // Match {$t('text')} patterns (template expressions)
      /\{\s*\$t\s*\(\s*(["'])((?:\\.|(?!\1).)*?)\1\s*\)/g,
      // Match {t('text')} patterns (template expressions)
      /\{\s*t\s*\(\s*(["'])((?:\\.|(?!\1).)*?)\1\s*\)/g,
      // Match $t('text') patterns in attributes (but not import statements)
      /(?:=\s*|\{\s*)\$t\s*\(\s*(["'])((?:\\.|(?!\1).)*?)\1\s*\)/g,
      // Match t('text') patterns in attributes (but not import statements)
      /(?:=\s*|\{\s*)t\s*\(\s*(["'])((?:\\.|(?!\1).)*?)\1\s*\)/g,
      // Match {_('text')} patterns
      /\{\s*_\s*\(\s*(["'])((?:\\.|(?!\1).)*?)\1\s*\)/g,
      // Match {translate('text')} patterns
      /\{\s*translate\s*\(\s*(["'])((?:\\.|(?!\1).)*?)\1\s*\)/g,
    ];
    
    // Function to filter out non-translatable strings
    const isTranslatable = (text) => {
      // Skip empty strings
      if (!text || text.trim() === '') return false;
      
      // Skip package names and module paths
      if (text.includes('@') && text.includes('/')) return false;
      if (text.startsWith('@')) return false;
      
      // Skip file extensions and paths
      if (text.includes('.') && (text.endsWith('.js') || text.endsWith('.ts') || text.endsWith('.json') || text.endsWith('.css'))) return false;
      
      // Skip single characters that aren't words
      if (text.length === 1 && !/[a-zA-Z]/.test(text)) return false;
      
      // Skip URLs and paths
      if (text.startsWith('http') || text.startsWith('//') || text.startsWith('./') || text.startsWith('../')) return false;
      
      // Skip technical strings
      if (text.includes('\\n') && text.trim() === '\\n') return false;
      if (text === '/' || text === '.' || text === '..') return false;
      
      // Skip HTML tag names
      if (/^[a-z]+$/.test(text) && text.length <= 5 && ['div', 'span', 'p', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'form', 'input', 'label', 'button', 'select', 'option', 'textarea'].includes(text)) return false;
      
      return true;
    };

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const text = match[2]; // The captured text content
        
        // Filter out non-translatable strings
        if (isTranslatable(text)) {
          // Add the message to the extractor with proper reference format
          const lineNumber = content.substring(0, match.index).split('\n').length;
          extractor.addMessage({
            text: text,
            references: [`${join(projectRoot, file)}:${lineNumber}`]
          });
        }
      }
    });
  }
  
  console.log(`✅ Processed ${tsFiles.length} TypeScript files and ${svelteFiles.length} Svelte files`);

  // Use the single extractor that processed all files
  const allMessages = extractor.getMessages();
  
  console.log(`📝 Extracted ${allMessages.length} strings from all files`);

  // Use the main extractor directly
  const combinedExtractor = extractor;

  // Create/update .po files for each locale
  for (const locale of locales) {
    const poPath = join(projectRoot, 'locales', `${locale}.po`);

    try {
      console.log(`💾 Updating ${locale}.po...`);

      // Read existing translations and metadata if file exists
      const existingTranslations = {};
      let existingHeaders = {};
      if (existsSync(poPath)) {
        const existingContent = readFileSync(poPath, 'utf8');
        const lines = existingContent.split('\n');

        // Parse existing headers
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith('"') && line.includes(':')) {
            const match = line.match(/^"([^:]+):\s*([^"]*?)\\?n?"$/);
            if (match) {
              existingHeaders[match[1]] = match[2];
            }
          }
          if (line.trim() === '' && i > 0) break; // End of headers
        }

        // Function to normalize quotes for consistent comparison
        const normalizeQuotes = (text) => text.replace(/\\"/g, '"');

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
              // Store translations with normalized keys for consistent lookup
              const normalizedKey = normalizeQuotes(currentMsgid);
              existingTranslations[normalizedKey] = match[1];
            }
            currentMsgid = '';
          }
        }
        console.log(
          `📚 Preserved ${Object.keys(existingTranslations).length} existing translations for ${locale}`
        );
      }

      // Check if content has actually changed by comparing actual message content
      const currentMessages = combinedExtractor.getMessages();
      const normalizeQuotes = (text) => text.replace(/\\"/g, '"');
      
      let contentChanged = !existsSync(poPath);
      if (!contentChanged) {
        // Compare actual message content, not just counts
        const existingMsgids = new Set(Object.keys(existingTranslations));
        const currentMsgids = new Set(currentMessages.map(m => normalizeQuotes(m.text)));
        
        contentChanged = existingMsgids.size !== currentMsgids.size || 
                        ![...existingMsgids].every(id => currentMsgids.has(id));
      }

      // Preserve existing dates if content hasn't changed
      const now = new Date().toISOString();
      const headers = {
        Language: locale,
        'MIME-Version': '1.0',
        'Content-Type': 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding': '8bit',
        'Project-Id-Version': 'EDITME EPUB Editor',
        'Report-Msgid-Bugs-To': '',
        'POT-Creation-Date': contentChanged ? now : existingHeaders['POT-Creation-Date'] || now,
        'PO-Revision-Date': contentChanged ? now : existingHeaders['PO-Revision-Date'] || now,
        'Last-Translator': existingHeaders['Last-Translator'] || '',
        'Language-Team': existingHeaders['Language-Team'] || '',
        'Plural-Forms': 'nplurals=2; plural=(n != 1);',
      };

      // Generate new .po file
      combinedExtractor.savePotFile(poPath, headers);

      // Post-process to clean up the file
      let content = readFileSync(poPath, 'utf8');
      const lines = content.split('\n');
      const result = [];

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        result.push(line);

        // Merge back existing translations
        if (line.startsWith('msgid "') && line !== 'msgid ""') {
          const match = line.match(/^msgid "(.+)"$/);
          if (match) {
            // Normalize the key for lookup
            const normalizedKey = match[1].replace(/\\"/g, '"');
            if (existingTranslations[normalizedKey]) {
              // Look ahead for msgstr line and replace it
              if (i + 1 < lines.length && lines[i + 1].startsWith('msgstr ""')) {
                result[result.length] = `msgstr "${existingTranslations[normalizedKey]}"`;
                i++; // Skip original empty msgstr
              }
            }
          }
        }
      }

      // Write back the cleaned and merged content
      writeFileSync(poPath, result.join('\n'));
    } catch (error) {
      console.error(`❌ Error creating ${locale}.po:`, error.message);
      process.exit(1);
    }
  }

  const messageCount = combinedExtractor.getMessages().length;
  console.log(`✅ Extracted ${messageCount} translatable strings`);
  console.log(`📝 Updated ${locales.length} .po files`);
}

// Run extraction
extractStrings().catch(error => {
  console.error('❌ Extraction failed:', error);
  process.exit(1);
});
