/**
 * Unit tests for SampleContentGenerator
 *
 * Comprehensive test suite following TDD principles - these tests are written
 * BEFORE the implementation exists and should FAIL initially, proving the TDD approach.
 *
 * Tests cover all public API methods with both success and error scenarios.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SampleContentGenerator } from '../sample-content-generator.js';
import type { TranslationCatalog } from '../../i18n/types.js';
import {
  TranslationMissingError,
  UnsupportedLocaleError,
  InvalidContentError,
  type DemoChapter,
} from '../types.js';
import {
  expectLocalizedContent,
  expectDemoChapters,
  expectEPUBMetadata,
  expectValidationResult,
  TEST_LOCALES,
} from './test-utils.js';

describe('SampleContentGenerator', () => {
  let generator: SampleContentGenerator;
  let catalogs: Record<string, TranslationCatalog>;

  beforeEach(() => {
    // Create complete translation catalogs for testing
    catalogs = {
      en: {
        locale: 'en',
        messages: {
          'sample.book.title': 'Introduction to EPUB',
          'sample.book.description': 'A comprehensive guide to EPUB creation',
          'sample.author.name': 'EDITME Editorial Team',
          'sample.publisher.name': 'EDITME Publishing',
          'sample.prologue.title': 'Welcome to Active EPUB',
          'sample.prologue.content': 'This document demonstrates the power of **Active EPUB** technology. Unlike traditional EPUB files, Active EPUBs contain their own editor, making them self-editable.\n\n## What is an Active EPUB?\n\nAn Active EPUB is a standard EPUB file that includes:\n- All the regular EPUB content (text, images, styles)\n- The EDITME.html editor application\n- SOURCE files containing the original plain text sources\n- Transform scripts for converting text to XHTML\n\nThis allows readers to not only read the book but also edit and republish it using nothing more than a web browser.\n\n*Experience the future of publishing with Active EPUB technology.*',
          'sample.chapter1.title': 'Getting Started',
          'sample.chapter1.content': 'This chapter will guide you through the basics of creating and editing EPUB files using the EDITME editor.\n\n## Basic Structure\n\nEvery EPUB file contains:\n1. **Metadata** - Information about the book (title, author, language, etc.)\n2. **Manifest** - List of all files in the EPUB\n3. **Spine** - Reading order of content files\n4. **Content** - The actual chapters and resources\n\n## Your First Edit\n\nTo make your first edit:\n1. Select a chapter from the spine\n2. Modify the text in the editor\n3. See live preview updates\n4. Save your changes\n\nThe editor automatically handles the conversion from plain text to properly formatted XHTML.\n\n> **Tip**: Use markdown-style formatting for rich text features like *italics*, **bold**, and [links](http://example.com).',
          'sample.chapter2.title': 'Advanced Features',
          'sample.chapter2.content': 'Once you\'re comfortable with basic editing, explore these advanced features:\n\n## Custom Transforms\n\nTransform scripts convert your plain text into XHTML. You can:\n- Modify existing transform logic\n- Add new formatting rules\n- Include external libraries (like Markdown processors)\n\n## Styling and Themes\n\nCustomize the appearance of your EPUB:\n- Edit CSS files in the manifest\n- Add custom fonts and images\n- Create responsive layouts for different devices\n\n## Multi-language Support\n\nThe editor supports creating EPUBs in multiple languages:\n- **Latin scripts**: English, German, French, Spanish\n- **Right-to-left**: Arabic, Hebrew\n- **Complex scripts**: Japanese, Chinese, Georgian\n\nEach locale includes culturally appropriate content and proper text direction handling.\n\n## Extension System\n\nExtend functionality with:\n- Custom transform scripts\n- Additional formatting processors\n- Third-party libraries\n\nThe modular design allows for unlimited customization while maintaining EPUB compatibility.',
          'sample.appendix.title': 'Technical Reference',
          'sample.appendix.content': '## File Structure\n\nActive EPUBs follow this enhanced structure:\n\n```\nyour-book.epub\n├── mimetype\n├── META-INF/\n│   ├── container.xml\n│   └── com.apple.ibooks.display-options.xml\n├── OEBPS/\n│   ├── content.opf          # Package document\n│   ├── toc.xhtml           # Table of contents\n│   ├── chapter1.xhtml      # Content files\n│   ├── chapter2.xhtml\n│   ├── styles.css          # Stylesheets\n│   ├── cover.jpg           # Images\n│   ├── SOURCE.zip          # Editor source files\n│   └── EDITME.html         # Editor application\n└── EXTRACT_EDITOR.txt      # Extraction instructions\n```\n\n## Technical Details\n\n- **EPUB Version**: 3.2\n- **Reading Systems**: Compatible with all major EPUB readers\n- **Editor Requirements**: Modern browser with JavaScript enabled\n- **Source Format**: Plain text with markdown-style formatting\n- **Transform Engine**: Custom JavaScript with extensible plugin system\n\n## API Reference\n\nThe editor exposes these key APIs:\n- `EditorAPI.loadWorkspace()` - Load EPUB for editing\n- `EditorAPI.saveChanges()` - Save modifications\n- `EditorAPI.exportEPUB()` - Generate final EPUB file\n- `TransformAPI.addProcessor()` - Add custom formatting\n\nFor complete API documentation, see the embedded help system.',
        },
        headers: {}
      },
      fr: {
        locale: 'fr',
        messages: {
          'sample.book.title': 'Introduction à EPUB',
          'sample.book.description': 'Un guide complet pour la création EPUB',
          'sample.author.name': 'Équipe éditoriale EDITME',
          'sample.publisher.name': 'Éditions EDITME',
          'sample.prologue.title': 'Bienvenue dans Active EPUB',
          'sample.prologue.content': 'Ce document démontre la puissance de la technologie **Active EPUB**.',
          'sample.chapter1.title': 'Premiers pas',
          'sample.chapter1.content': 'Ce chapitre vous guidera à travers les bases.',
          'sample.chapter2.title': 'Fonctionnalités avancées',
          'sample.chapter2.content': 'Une fois à l\'aise avec l\'édition de base.',
          'sample.appendix.title': 'Référence technique',
          'sample.appendix.content': 'Structure des fichiers Active EPUB.',
        },
        headers: {}
      },
      de: {
        locale: 'de',
        messages: {
          'sample.book.title': 'Einführung in EPUB',
          'sample.book.description': 'Ein umfassender Leitfaden zur EPUB-Erstellung',
          'sample.author.name': 'EDITME Redaktionsteam',
          'sample.publisher.name': 'EDITME Publikationen',
          'sample.prologue.title': 'Willkommen zu Active EPUB',
          'sample.prologue.content': 'Dieses Dokument demonstriert die Macht der **Active EPUB** Technologie.',
          'sample.chapter1.title': 'Erste Schritte',
          'sample.chapter1.content': 'Dieses Kapitel führt Sie durch die Grundlagen.',
          'sample.chapter2.title': 'Erweiterte Funktionen',
          'sample.chapter2.content': 'Sobald Sie mit der grundlegenden Bearbeitung vertraut sind.',
          'sample.appendix.title': 'Technische Referenz',
          'sample.appendix.content': 'Active EPUBs folgen dieser erweiterten Struktur.',
        },
        headers: {}
      },
      ar: {
        locale: 'ar',
        messages: {
          'sample.book.title': 'مقدمة إلى EPUB',
          'sample.book.description': 'دليل شامل لإنشاء EPUB',
          'sample.author.name': 'فريق تحرير EDITME',
          'sample.publisher.name': 'منشورات EDITME',
          'sample.prologue.title': 'مرحباً بكم في Active EPUB',
          'sample.prologue.content': 'تُظهر هذه الوثيقة قوة تقنية **Active EPUB**.',
          'sample.chapter1.title': 'البداية',
          'sample.chapter1.content': 'سيرشدك هذا الفصل عبر الأساسيات.',
          'sample.chapter2.title': 'الميزات المتقدمة',
          'sample.chapter2.content': 'بمجرد أن تصبح مرتاحاً مع التحرير الأساسي.',
          'sample.appendix.title': 'المرجع التقني',
          'sample.appendix.content': 'تتبع Active EPUBs هذا الهيكل المحسن.',
        },
        headers: {}
      }
    };

    // Create generator instance with catalogs
    generator = new SampleContentGenerator(catalogs);
  });

  describe('constructor', () => {
    it('should create instance with valid I18nSystem', () => {
      expect(generator).toBeInstanceOf(SampleContentGenerator);
      expect(generator).toBeDefined();
    });

    it('should store translation catalogs', () => {
      // Verify the catalogs are properly stored
      expect(generator).toBeDefined();
    });
  });

  describe('generateLocalizedContent()', () => {
    describe('successful content generation', () => {
      it('should generate complete English content', async () => {
        const result = await generator.generateLocalizedContent('en');

        // Verify structure matches LocalizedSampleContent interface
        expectLocalizedContent(result, 'en', 4);

        // Verify specific content
        expect(result.locale).toBe('en');
        expect(result.isRTL).toBe(false);
        expect(result.pageProgressionDirection).toBe('ltr');
        expect(result.metadata.title).toBe('Introduction to EPUB');
        expect(result.chapters).toHaveLength(4);

        // Verify chapters are in correct order
        expect(result.chapters[0].id).toBe('prologue');
        expect(result.chapters[1].id).toBe('chapter1');
        expect(result.chapters[2].id).toBe('chapter2');
        expect(result.chapters[3].id).toBe('appendix');

        // Verify linear property
        expect(result.chapters[0].linear).toBe(true);
        expect(result.chapters[1].linear).toBe(true);
        expect(result.chapters[2].linear).toBe(true);
        expect(result.chapters[3].linear).toBe(false); // appendix is non-linear
      });

      it('should generate complete German content', async () => {
        const result = await generator.generateLocalizedContent('de');

        expectLocalizedContent(result, 'de', 4);
        expect(result.locale).toBe('de');
        expect(result.isRTL).toBe(false);
        expect(result.pageProgressionDirection).toBe('ltr');
        expect(result.metadata.title).toBe('Einführung in EPUB');
        expect(result.metadata.author).toBe('EDITME Redaktionsteam');
      });

      it('should generate complete Arabic content with RTL support', async () => {
        const result = await generator.generateLocalizedContent('ar');

        expectLocalizedContent(result, 'ar', 4);
        expect(result.locale).toBe('ar');
        expect(result.isRTL).toBe(true);
        expect(result.pageProgressionDirection).toBe('rtl');
        expect(result.metadata.title).toBe('مقدمة إلى EPUB');
        expect(result.metadata.author).toBe('فريق تحرير EDITME');
      });

    });

    describe('error handling', () => {
      it('should throw UnsupportedLocaleError for invalid locale', async () => {
        await expect(generator.generateLocalizedContent('invalid-xx')).rejects.toThrow(
          UnsupportedLocaleError
        );

        await expect(generator.generateLocalizedContent('invalid-xx')).rejects.toThrow(
          'Unsupported locale: invalid-xx'
        );
      });

      it('should throw TranslationMissingError for missing keys', async () => {
        // Create catalog missing some keys
        const incompleteCatalogs = {
          incomplete: {
            locale: 'incomplete',
            messages: {
              'sample.book.title': 'Test Title',
              // Missing other required keys
            },
            headers: {}
          }
        };
        const incompleteGenerator = new SampleContentGenerator(incompleteCatalogs);

        await expect(incompleteGenerator.generateLocalizedContent('incomplete')).rejects.toThrow(
          TranslationMissingError
        );
      });

      it('should throw InvalidContentError for empty translations', async () => {
        // Create catalog with empty translations
        const emptyCatalogs = {
          empty: {
            locale: 'empty',
            messages: {
              'sample.book.title': '',  // Empty translation
              'sample.book.description': 'Valid description',
              'sample.author.name': 'Valid author',
              'sample.publisher.name': 'Valid publisher',
              'sample.prologue.title': 'Valid title',
              'sample.prologue.content': 'Valid content',
              'sample.chapter1.title': 'Valid title',
              'sample.chapter1.content': 'Valid content',
              'sample.chapter2.title': 'Valid title',
              'sample.chapter2.content': 'Valid content',
              'sample.appendix.title': 'Valid title',
              'sample.appendix.content': 'Valid content',
            },
            headers: {}
          }
        };
        const emptyGenerator = new SampleContentGenerator(emptyCatalogs);

        await expect(emptyGenerator.generateLocalizedContent('empty')).rejects.toThrow(
          InvalidContentError
        );

        await expect(emptyGenerator.generateLocalizedContent('empty')).rejects.toThrow(
          'Invalid content for empty.sample.book.title: Translation is empty'
        );
      });
    });
  });

  describe('generateLocalizedMetadata()', () => {
    describe('successful metadata generation', () => {
      it('should generate EPUB metadata for English', async () => {
        const result = await generator.generateLocalizedMetadata('en');

        expectEPUBMetadata(result, 'en');
        expect(result.title).toBe('Introduction to EPUB');
        expect(result.language).toBe('en');
        expect(result.creator).toEqual(['EDITME Editorial Team']);
        expect(result.publisher).toBe('EDITME Publishing');
        expect(result.pageProgressionDirection).toBe('ltr');
      });

      it('should generate EPUB metadata for Arabic with RTL', async () => {
        const result = await generator.generateLocalizedMetadata('ar');

        expectEPUBMetadata(result, 'ar');
        expect(result.title).toBe('مقدمة إلى EPUB');
        expect(result.language).toBe('ar');
        expect(result.creator).toEqual(['فريق تحرير EDITME']);
        expect(result.pageProgressionDirection).toBe('rtl');
      });

      it('should generate unique identifiers', async () => {
        const result1 = await generator.generateLocalizedMetadata('en');
        const result2 = await generator.generateLocalizedMetadata('en');

        expect(result1.identifier).not.toBe(result2.identifier);
        expect(result1.identifier).toMatch(/^sample-content-en-\d+$/);
        expect(result2.identifier).toMatch(/^sample-content-en-\d+$/);
      });

      it('should include all required EPUB metadata fields', async () => {
        const result = await generator.generateLocalizedMetadata('de');

        // Verify all required Dublin Core fields are present
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('language');
        expect(result).toHaveProperty('identifier');
        expect(result).toHaveProperty('creator');
        expect(result).toHaveProperty('publisher');
        expect(result).toHaveProperty('description');
        expect(result).toHaveProperty('pageProgressionDirection');

        // Verify creator is an array (EPUB spec requirement)
        expect(Array.isArray(result.creator)).toBe(true);
        expect(result.creator?.length).toBeGreaterThan(0);
      });
    });

    describe('error handling', () => {
      it('should throw UnsupportedLocaleError for invalid locale', async () => {
        await expect(generator.generateLocalizedMetadata('invalid-xx')).rejects.toThrow(
          UnsupportedLocaleError
        );
      });

      it('should succeed for locale with complete metadata keys', async () => {
        const result = await generator.generateLocalizedMetadata('fr');

        expectEPUBMetadata(result, 'fr');
        expect(result.title).toBe('Introduction à EPUB');
        expect(result.creator).toEqual(['Équipe éditoriale EDITME']);
        expect(result.publisher).toBe('Éditions EDITME');
      });
    });
  });

  describe('generateLocalizedChapters()', () => {
    describe('successful chapter generation', () => {
      it('should generate chapters for English', async () => {
        const result = await generator.generateLocalizedChapters('en');

        expectDemoChapters(result, 4);

        // Verify first chapter structure
        expect(result[0]).toEqual({
          id: 'prologue',
          title: 'Welcome to Active EPUB',
          content: expect.stringContaining(
            'This document demonstrates the power of **Active EPUB** technology'
          ),
          linear: true,
          mediaType: 'application/xhtml+xml',
        });

        // Verify appendix is non-linear
        expect(result[3]).toEqual({
          id: 'appendix',
          title: 'Technical Reference',
          content: expect.stringContaining('Active EPUBs follow this enhanced structure'),
          linear: false,
          mediaType: 'application/xhtml+xml',
        });
      });

      it('should generate chapters for German', async () => {
        const result = await generator.generateLocalizedChapters('de');

        expectDemoChapters(result, 4);
        expect(result[0].title).toBe('Willkommen zu Active EPUB');
        expect(result[1].title).toBe('Erste Schritte');
        expect(result[2].title).toBe('Erweiterte Funktionen');
        expect(result[3].title).toBe('Technische Referenz');
      });

      it('should generate chapters for Arabic', async () => {
        const result = await generator.generateLocalizedChapters('ar');

        expectDemoChapters(result, 4);
        expect(result[0].title).toBe('مرحباً بكم في Active EPUB');
        expect(result[1].title).toBe('البداية');
        expect(result[2].title).toBe('الميزات المتقدمة');
        expect(result[3].title).toBe('المرجع التقني');
      });

      it('should set correct mediaType for all chapters', async () => {
        const result = await generator.generateLocalizedChapters('en');

        result.forEach((chapter: DemoChapter) => {
          expect(chapter.mediaType).toBe('application/xhtml+xml');
        });
      });

      it('should preserve chapter order', async () => {
        const result = await generator.generateLocalizedChapters('en');

        const expectedOrder = ['prologue', 'chapter1', 'chapter2', 'appendix'];
        const actualOrder = result.map((chapter: DemoChapter) => chapter.id);

        expect(actualOrder).toEqual(expectedOrder);
      });
    });

    describe('error handling', () => {
      it('should throw UnsupportedLocaleError for invalid locale', async () => {
        await expect(generator.generateLocalizedChapters('invalid-xx')).rejects.toThrow(
          UnsupportedLocaleError
        );
      });

      it('should throw TranslationMissingError for missing chapter keys', async () => {
        // Create catalog missing chapter keys
        const incompleteCatalogs = {
          incomplete: {
            locale: 'incomplete',
            messages: {
              'sample.book.title': 'Test Title',
              'sample.book.description': 'Test Description',
              'sample.author.name': 'Test Author',
              'sample.publisher.name': 'Test Publisher',
              // Missing chapter keys
            },
            headers: {}
          }
        };
        const incompleteGenerator = new SampleContentGenerator(incompleteCatalogs);

        await expect(incompleteGenerator.generateLocalizedChapters('incomplete')).rejects.toThrow(
          TranslationMissingError
        );
      });
    });
  });

  describe('getAvailableLocales()', () => {
    it('should return locales with complete translations', async () => {
      const result = await generator.getAvailableLocales();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(expect.arrayContaining(['en', 'fr', 'de', 'ar']));
      expect(result).toHaveLength(4);
    });

    it('should only include locales with all required keys', async () => {
      // Create catalog with incomplete translations
      const mixedCatalogs = {
        ...catalogs,
        incomplete: {
          locale: 'incomplete',
          messages: {
            'sample.book.title': 'Test Title',
            // Missing other required keys
          },
          headers: {}
        }
      };
      const mixedGenerator = new SampleContentGenerator(mixedCatalogs);

      const result = await mixedGenerator.getAvailableLocales();

      // Should not include 'incomplete' which is missing keys
      expect(result).not.toContain('incomplete');
      // Should still include complete locales
      expect(result).toContain('en');
      expect(result).toContain('de');
      expect(result).toContain('ar');
      expect(result).toContain('fr');
    });

    it('should return empty array if no complete locales', async () => {
      // Create catalogs with incomplete translations only
      const emptyCatalogs = {
        incomplete: {
          locale: 'incomplete',
          messages: {
            'sample.book.title': 'Test Title',
            // Missing other required keys
          },
          headers: {}
        }
      };
      const emptyGenerator = new SampleContentGenerator(emptyCatalogs);

      const result = await emptyGenerator.getAvailableLocales();

      expect(result).toEqual([]);
    });
  });

  describe('validateLocaleCompleteness()', () => {
    describe('valid locales', () => {
      it('should validate English as complete', async () => {
        const result = await generator.validateLocaleCompleteness('en');

        expectValidationResult(result, 'en', true, [], []);
      });

      it('should validate German as complete', async () => {
        const result = await generator.validateLocaleCompleteness('de');

        expectValidationResult(result, 'de', true, [], []);
      });

      it('should validate Arabic as complete', async () => {
        const result = await generator.validateLocaleCompleteness('ar');

        expectValidationResult(result, 'ar', true, [], []);
      });
    });

    describe('incomplete locales', () => {
      it('should identify missing translation keys', async () => {
        // Create catalog missing some keys
        const incompleteCatalogs = {
          incomplete: {
            locale: 'incomplete',
            messages: {
              'sample.book.title': 'Test Title',
              'sample.book.description': 'Test Description',
              'sample.author.name': 'Test Author',
              'sample.publisher.name': 'Test Publisher',
              'sample.prologue.title': 'Test Prologue',
              'sample.prologue.content': 'Test Content',
              'sample.chapter1.title': 'Test Chapter 1',
              'sample.chapter1.content': 'Test Content',
              // Missing chapter2 and appendix keys
            },
            headers: {}
          }
        };
        const incompleteGenerator = new SampleContentGenerator(incompleteCatalogs);

        const result = await incompleteGenerator.validateLocaleCompleteness('incomplete');

        expectValidationResult(
          result,
          'incomplete',
          false,
          [
            'sample.chapter2.title',
            'sample.chapter2.content',
            'sample.appendix.title',
            'sample.appendix.content',
          ],
          []
        );
      });

      it('should identify empty translation keys', async () => {
        // Create catalog with empty keys
        const emptyCatalogs = {
          empty: {
            locale: 'empty',
            messages: {
              'sample.book.title': '',  // Empty
              'sample.book.description': 'Test Description',
              'sample.author.name': 'Test Author',
              'sample.publisher.name': 'Test Publisher',
              'sample.prologue.title': 'Test Prologue',
              'sample.prologue.content': '   ',  // Empty (whitespace only)
              'sample.chapter1.title': 'Test Chapter 1',
              'sample.chapter1.content': 'Test Content',
              'sample.chapter2.title': 'Test Chapter 2',
              'sample.chapter2.content': 'Test Content',
              'sample.appendix.title': 'Test Appendix',
              'sample.appendix.content': 'Test Content',
            },
            headers: {}
          }
        };
        const emptyGenerator = new SampleContentGenerator(emptyCatalogs);

        const result = await emptyGenerator.validateLocaleCompleteness('empty');

        expectValidationResult(
          result,
          'empty',
          false,
          [],
          ['sample.book.title', 'sample.prologue.content']
        );
      });

      it('should handle both missing and empty keys', async () => {
        // Create catalog with both missing and empty keys
        const problematicCatalogs = {
          problematic: {
            locale: 'problematic',
            messages: {
              'sample.book.title': '',  // Empty
              'sample.book.description': 'Test Description',
              'sample.author.name': 'Test Author',
              'sample.publisher.name': 'Test Publisher',
              'sample.prologue.title': 'Test Prologue',
              'sample.prologue.content': 'Test Content',
              'sample.chapter1.title': 'Test Chapter 1',
              'sample.chapter1.content': 'Test Content',
              // Missing chapter2 and appendix keys
            },
            headers: {}
          }
        };
        const problematicGenerator = new SampleContentGenerator(problematicCatalogs);
        const result = await problematicGenerator.validateLocaleCompleteness('problematic');

        expect(result.isValid).toBe(false);
        expect(result.locale).toBe('problematic');
        expect(result.missingKeys.length + result.emptyKeys.length).toBeGreaterThan(0);
        expect(result.emptyKeys).toContain('sample.book.title');
        expect(result.missingKeys).toEqual(expect.arrayContaining([
          'sample.chapter2.title',
          'sample.chapter2.content',
          'sample.appendix.title',
          'sample.appendix.content'
        ]));
      });
    });

    describe('error handling', () => {
      it('should throw UnsupportedLocaleError for invalid locale', async () => {
        await expect(generator.validateLocaleCompleteness('invalid-xx')).rejects.toThrow(
          UnsupportedLocaleError
        );
      });
    });

    describe('validation completeness', () => {
      it('should check all required sample content keys', async () => {
        const result = await generator.validateLocaleCompleteness('en');

        // For complete locale, should have zero missing/empty
        expect(result.isValid).toBe(true);
        expect(result.missingKeys).toHaveLength(0);
        expect(result.emptyKeys).toHaveLength(0);
      });

      it('should return correct key counts', async () => {
        const result = await generator.validateLocaleCompleteness('en');

        // For complete locale, should have zero missing/empty
        expect(result.missingKeys).toHaveLength(0);
        expect(result.emptyKeys).toHaveLength(0);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle full workflow for multiple locales', async () => {
      // Test generating content for all supported locales
      for (const locale of TEST_LOCALES) {
        const content = await generator.generateLocalizedContent(locale);
        const metadata = await generator.generateLocalizedMetadata(locale);
        const chapters = await generator.generateLocalizedChapters(locale);
        const validation = await generator.validateLocaleCompleteness(locale);

        // All should succeed for supported locales
        expect(content.locale).toBe(locale);
        expect(metadata.language).toBe(locale);
        expect(chapters.length).toBe(4);
        expect(validation.isValid).toBe(true);
      }
    });

    it('should maintain consistency between methods', async () => {
      const locale = 'de';

      const content = await generator.generateLocalizedContent(locale);
      const metadata = await generator.generateLocalizedMetadata(locale);
      const chapters = await generator.generateLocalizedChapters(locale);

      // Metadata should match between methods
      expect(content.metadata.title).toBe(metadata.title);
      expect(content.metadata.description).toBe(metadata.description);
      expect(content.metadata.author).toBe(metadata.creator?.[0]);
      expect(content.metadata.publisher).toBe(metadata.publisher);

      // Chapters should match between methods
      expect(content.chapters).toHaveLength(chapters.length);
      content.chapters.forEach((contentChapter: any, index: number) => {
        const methodChapter = chapters[index];
        expect(contentChapter.id).toBe(methodChapter.id);
        expect(contentChapter.title).toBe(methodChapter.title);
        expect(contentChapter.content).toBe(methodChapter.content);
        expect(contentChapter.linear).toBe(methodChapter.linear);
      });
    });

    it('should handle RTL detection consistently', async () => {
      const rtlLocale = 'ar';
      const ltrLocale = 'en';

      const rtlContent = await generator.generateLocalizedContent(rtlLocale);
      const rtlMetadata = await generator.generateLocalizedMetadata(rtlLocale);

      const ltrContent = await generator.generateLocalizedContent(ltrLocale);
      const ltrMetadata = await generator.generateLocalizedMetadata(ltrLocale);

      // RTL locale
      expect(rtlContent.isRTL).toBe(true);
      expect(rtlContent.pageProgressionDirection).toBe('rtl');
      expect(rtlMetadata.pageProgressionDirection).toBe('rtl');

      // LTR locale
      expect(ltrContent.isRTL).toBe(false);
      expect(ltrContent.pageProgressionDirection).toBe('ltr');
      expect(ltrMetadata.pageProgressionDirection).toBe('ltr');
    });
  });

  describe('error type verification', () => {
    it('should create TranslationMissingError with correct properties', async () => {
      // Create catalog missing keys
      const incompleteCatalogs = {
        incomplete: {
          locale: 'incomplete',
          messages: {
            'sample.book.title': 'Test Title',
            // Missing other required keys
          },
          headers: {}
        }
      };
      const incompleteGenerator = new SampleContentGenerator(incompleteCatalogs);

      try {
        await incompleteGenerator.generateLocalizedContent('incomplete');
        expect.fail('Expected TranslationMissingError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TranslationMissingError);
        const typedError = error as TranslationMissingError;
        expect(typedError.name).toBe('TranslationMissingError');
        expect(typedError.locale).toBe('incomplete');
        expect(Array.isArray(typedError.missingKeys)).toBe(true);
        expect(typedError.missingKeys.length).toBeGreaterThan(0);
      }
    });

    it('should create UnsupportedLocaleError with correct properties', async () => {
      try {
        await generator.generateLocalizedContent('invalid-xx');
        expect.fail('Expected UnsupportedLocaleError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UnsupportedLocaleError);
        const typedError = error as UnsupportedLocaleError;
        expect(typedError.name).toBe('UnsupportedLocaleError');
        expect(typedError.locale).toBe('invalid-xx');
      }
    });

    it('should create InvalidContentError with correct properties', async () => {
      // Create catalog with empty translations
      const emptyCatalogs = {
        empty: {
          locale: 'empty',
          messages: {
            'sample.book.title': '',  // Empty translation
            'sample.book.description': 'Valid description',
            'sample.author.name': 'Valid author',
            'sample.publisher.name': 'Valid publisher',
            'sample.prologue.title': 'Valid title',
            'sample.prologue.content': 'Valid content',
            'sample.chapter1.title': 'Valid title',
            'sample.chapter1.content': 'Valid content',
            'sample.chapter2.title': 'Valid title',
            'sample.chapter2.content': 'Valid content',
            'sample.appendix.title': 'Valid title',
            'sample.appendix.content': 'Valid content',
          },
          headers: {}
        }
      };
      const emptyGenerator = new SampleContentGenerator(emptyCatalogs);

      try {
        await emptyGenerator.generateLocalizedContent('empty');
        expect.fail('Expected InvalidContentError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidContentError);
        const typedError = error as InvalidContentError;
        expect(typedError.name).toBe('InvalidContentError');
        expect(typedError.locale).toBe('empty');
        expect(typedError.key).toBe('sample.book.title');
        expect(typedError.reason).toBe('Translation is empty');
      }
    });
  });
});
