/**
 * ZIP-based translation loader with storage integration
 */

import type { I18nLoader, TranslationCatalog } from './types.js';
import { FileStorageAPI } from '../storage/index.js';
import { Zip } from '../zip/index.js';

const LOCALES_WORKSPACE_ID = 'locales';

/**
 * Create translation loader instance
 */
export function createI18nLoader(): I18nLoader {
  return new TranslationLoader();
}

class TranslationLoader implements I18nLoader {
  private storage = new FileStorageAPI();
  private indexedDbStorage: FileStorageAPI | null = null;

  /**
   * Always extract translations from ZIP bundle on startup
   */
  async needsUpdate(): Promise<boolean> {
    // Always extract ZIP on startup - no caching
    return true;
  }

  /**
   * Extract translations from ZIP archive to storage
   */
  async extractTranslations(): Promise<void> {
    try {
      console.log('📦 Extracting translations from ZIP bundle...');

      // Try to get embedded translation data URL from global variable
      let translationsDataUrl = (globalThis as any).__EDITME_I18N_BUNDLE__;
      let response: Response;

      if (!translationsDataUrl) {
        // Development fallback: try to fetch from static directory
        console.log('⚠️ No embedded translation data found, trying static file fallback...');
        console.log('This usually means you need to rebuild the single file with: npm run build');
        try {
          response = await fetch('/i18n-bundle.zip');
          if (!response.ok) {
            throw new Error(`Failed to fetch i18n-bundle.zip: ${response.status}`);
          }
        } catch (error) {
          throw new Error(
            'Translation data not found. For single file builds, please run "npm run build" to generate a new build with embedded translations.'
          );
        }
      } else {
        // Production: fetch from embedded data URL
        console.log('✅ Found embedded translation data, extracting...');
        response = await fetch(translationsDataUrl);
        // Clean up memory after reading the data URL
        delete (globalThis as any).__EDITME_I18N_BUNDLE__;
        if (!response.ok) {
          throw new Error(`Failed to fetch translation data: ${response.status}`);
        }
      }

      // Get ZIP data as ArrayBuffer
      console.log(
        '📥 Fetched ZIP data, size:',
        response.headers.get('content-length') || 'unknown'
      );
      const zipArrayBuffer = await response.arrayBuffer();
      console.log('📦 ZIP buffer size:', zipArrayBuffer.byteLength, 'bytes');

      // Parse ZIP using our ZIP library
      let zip: Zip;
      try {
        zip = new Zip(zipArrayBuffer);
        console.log('✅ ZIP parsed successfully, entries:', zip.entries.length);
      } catch (error) {
        console.error('❌ ZIP parsing failed:', error);
        throw new Error(
          `Failed to parse ZIP archive: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      console.log(`📄 Found ${zip.entries.length} files in ZIP`);

      // Initialize storage if needed
      if (!this.storage.isInitialized()) {
        console.log('🔧 Initializing storage manager...');
        await this.storage.init();
      }

      // Ensure workspace exists
      try {
        await this.storage.createWorkspace(LOCALES_WORKSPACE_ID);
        console.log(`✅ Workspace ${LOCALES_WORKSPACE_ID} created/verified`);
      } catch (workspaceError) {
        console.error(`❌ Failed to create workspace ${LOCALES_WORKSPACE_ID}:`, workspaceError);
        throw workspaceError;
      }

      // Extract each JSON file from ZIP
      for (const entry of zip.entries) {
        if (!entry.fileName.endsWith('.json')) {
          console.log(`⏭️ Skipping non-JSON file: ${entry.fileName}`);
          continue;
        }

        try {
          console.log(`📝 Extracting ${entry.fileName} (${entry.uncompressedSize} bytes)`);

          // Extract file content as text
          const blob = await entry.extract();
          const content = await blob.text();

          // Validate JSON before writing
          try {
            JSON.parse(content);
            console.log(`✅ ${entry.fileName}: Valid JSON, ${content.length} chars`);
          } catch (parseError) {
            console.error(`❌ ${entry.fileName}: Invalid JSON from ZIP:`, parseError);
            throw new Error(
              `Invalid JSON in ${entry.fileName}: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
            );
          }

          // Write to storage
          await this.storage.writeTextFile(LOCALES_WORKSPACE_ID, entry.fileName, content);
          console.log(`✅ Wrote ${entry.fileName} to storage`);

          // Verification
          try {
            // Add small delay to ensure write completes
            await new Promise(resolve => setTimeout(resolve, 50));

            // First check if file exists
            const fileExists = await this.storage.fileExists(LOCALES_WORKSPACE_ID, entry.fileName);
            console.log(`🔍 File exists check for ${entry.fileName}: ${fileExists}`);

            if (fileExists) {
              // Retry read with exponential backoff handling
              let readBack = '';
              let attempts = 0;
              const maxAttempts = 3;

              while (attempts < maxAttempts) {
                try {
                  readBack = await this.storage.readTextFile(LOCALES_WORKSPACE_ID, entry.fileName);

                  if (readBack.length > 0) {
                    console.log(
                      `✅ Verified ${entry.fileName} - read back ${readBack.length} chars (attempt ${attempts + 1})`
                    );

                    // Double-check by trying to parse the read-back content
                    try {
                      JSON.parse(readBack);
                      console.log(`🔍 Read-back JSON is valid for ${entry.fileName}`);
                      break; // Success, exit retry loop
                    } catch (jsonError) {
                      console.error(`❌ Read-back JSON invalid for ${entry.fileName}:`, jsonError);
                      break; // Don't retry JSON parse errors
                    }
                  } else {
                    console.warn(
                      `⚠️ Read back 0 chars for ${entry.fileName}, attempt ${attempts + 1}/${maxAttempts}`
                    );
                    attempts++;

                    if (attempts < maxAttempts) {
                      // Exponential backoff: 100ms, 200ms, 400ms
                      await new Promise(resolve =>
                        setTimeout(resolve, 100 * Math.pow(2, attempts - 1))
                      );
                    }
                  }
                } catch (readError) {
                  console.error(
                    `❌ Read attempt ${attempts + 1} failed for ${entry.fileName}:`,
                    readError
                  );
                  attempts++;

                  if (attempts < maxAttempts) {
                    await new Promise(resolve =>
                      setTimeout(resolve, 100 * Math.pow(2, attempts - 1))
                    );
                  }
                }
              }

              if (attempts >= maxAttempts && readBack.length === 0) {
                console.error(`❌ Failed to read ${entry.fileName} after ${maxAttempts} attempts`);
                console.error(`❌ Storage backend: ${this.storage.getBackendType()}`);
              }
            } else {
              console.error(`❌ File ${entry.fileName} does not exist after write!`);
            }
          } catch (error) {
            console.error(`❌ Failed to read back ${entry.fileName}:`, error);
            console.error(`❌ Storage backend type: ${this.storage.getBackendType()}`);
            console.error(`❌ Storage initialized: ${this.storage.isInitialized()}`);
          }
        } catch (extractError) {
          console.error(`❌ Failed to extract ${entry.fileName}:`, extractError);
          throw extractError;
        }
      }

      // After all writes, list what's actually in the workspace
      try {
        const allFiles = await this.storage.listFiles(LOCALES_WORKSPACE_ID);
        console.log(`📋 Final workspace contents: ${allFiles.length} files:`, allFiles);

        // Also check if the workspace exists
        const workspaces = await this.storage.listWorkspaces();
        console.log(`🔍 Available workspaces:`, workspaces);
        console.log(`🔍 Locales workspace exists: ${workspaces.includes(LOCALES_WORKSPACE_ID)}`);
      } catch (listError) {
        console.error(`❌ Failed to list workspace contents:`, listError);
        console.error(`❌ Storage backend: ${this.storage.getBackendType()}`);
      }

      console.log('🎉 Translation extraction complete');
    } catch (error) {
      console.error('❌ Failed to extract translations:', error);
      throw error;
    }
  }

  /**
   * Load translations from storage
   */
  async loadTranslations(): Promise<Record<string, TranslationCatalog>> {
    try {
      const catalogs: Record<string, TranslationCatalog> = {};

      // Initialize storage if needed
      if (!this.storage.isInitialized()) {
        await this.storage.init();
      }

      // List all JSON files in locales workspace
      const filePaths = await this.storage.listFiles(LOCALES_WORKSPACE_ID);
      console.log(
        `🔍 Debug: Found ${filePaths.length} total files in locales workspace:`,
        filePaths
      );
      const localeFiles = filePaths.filter(path => path.endsWith('.json'));
      console.log(`🔍 Debug: Filtered to ${localeFiles.length} JSON files:`, localeFiles);

      console.log(`📚 Loading ${localeFiles.length} translation catalogs...`);

      // Load each catalog
      for (const filePath of localeFiles) {
        try {
          const content = await this.storage.readTextFile(LOCALES_WORKSPACE_ID, filePath);

          console.log(`📄 ${filePath}: content length ${content.length}`);

          let jsonData;
          try {
            jsonData = JSON.parse(content);
            console.log(`✅ ${filePath}: JSON parsed successfully`);
          } catch (parseError) {
            console.error(`❌ ${filePath}: JSON parse failed:`, parseError);
            console.log(`🔍 ${filePath}: first 100 chars: "${content.slice(0, 100)}"`);
            console.log(`🔍 ${filePath}: last 100 chars: "${content.slice(-100)}"`);
            throw parseError;
          }

          // Extract locale code from filename (e.g., 'en.json' -> 'en')
          const filename = filePath.split('/').pop() || filePath;
          const locale = filename.replace('.json', '');

          // Convert po2json format to our catalog format
          const catalog: TranslationCatalog = {
            locale,
            messages: this.extractMessages(jsonData),
            headers: jsonData[''] || {}, // po2json stores headers under empty key
          };

          catalogs[locale] = catalog;
        } catch (error) {
          console.error(`Failed to load ${filePath}:`, error);
          // Continue with other files
        }
      }

      console.log(`✅ Loaded ${Object.keys(catalogs).length} translation catalogs`);

      // Debug: check sample content in English catalog
      if (catalogs.en) {
        const sampleKeys = Object.keys(catalogs.en.messages).filter(k => k.startsWith('sample.'));
        console.log(
          `🔍 Debug: English catalog has ${Object.keys(catalogs.en.messages).length} total keys, ${sampleKeys.length} sample keys`
        );
        if (sampleKeys.length > 0) {
          console.log(`🔍 Sample keys found: ${sampleKeys.slice(0, 3).join(', ')}...`);
          console.log(
            `🔍 Sample title: "${catalogs.en.messages['sample.book.title'] || 'MISSING'}"`
          );
        } else {
          console.log('❌ No sample keys found in English catalog!');
        }
      }

      return catalogs;
    } catch (error) {
      console.error('❌ Failed to load translations from storage:', error);
      throw error;
    }
  }

  /**
   * Extract message strings from po2json output
   */
  private extractMessages(jsonData: any): Record<string, string> {
    const messages: Record<string, string> = {};

    for (const [key, value] of Object.entries(jsonData)) {
      // Skip empty key (contains headers)
      if (key === '') continue;

      // po2json can return arrays for plurals, we'll take the first form for now
      const translation = Array.isArray(value) ? value[0] : value;

      if (typeof translation === 'string') {
        messages[key] = translation;
      }
    }

    return messages;
  }
}
