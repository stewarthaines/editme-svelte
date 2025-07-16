/**
 * Test fixtures for Translation Content System
 * 
 * Provides realistic sample data for testing localized content generation
 * following the existing project patterns and TDD approach.
 */

import type { TranslationCatalog } from '../../i18n/types.js';
import type { 
  LocalizedSampleContent, 
  DemoChapter, 
  ValidationResult,
  SampleContentKey 
} from '../types.js';

/**
 * Mock translation catalogs with sample content keys
 */
export const mockSampleContentCatalogs = {
  en: {
    locale: 'en',
    messages: {
      // Book metadata
      'sample.book.title': 'Introduction to EPUB',
      'sample.book.description': 'A comprehensive guide to creating and editing EPUB files with Active EPUB technology.',
      'sample.author.name': 'EDITME Editorial Team',
      'sample.publisher.name': 'EDITME Publishing',

      // Chapter content
      'sample.prologue.title': 'Welcome to Active EPUB',
      'sample.prologue.content': `# Welcome to Active EPUB

This document demonstrates the power of **Active EPUB** technology. Unlike traditional EPUB files, Active EPUBs contain their own editor, making them self-editable.

## What is an Active EPUB?

An Active EPUB is a standard EPUB file that includes:
- All the regular EPUB content (text, images, styles)
- The EDITME.html editor application
- SOURCE files containing the original plain text sources
- Transform scripts for converting text to XHTML

This allows readers to not only read the book but also edit and republish it using nothing more than a web browser.

*Experience the future of publishing with Active EPUB technology.*`,

      'sample.chapter1.title': 'Getting Started',
      'sample.chapter1.content': `# Getting Started with EPUB Editing

This chapter will guide you through the basics of creating and editing EPUB files using the EDITME editor.

## Basic Structure

Every EPUB file contains:
1. **Metadata** - Information about the book (title, author, language, etc.)
2. **Manifest** - List of all files in the EPUB
3. **Spine** - Reading order of content files
4. **Content** - The actual chapters and resources

## Your First Edit

To make your first edit:
1. Select a chapter from the spine
2. Modify the text in the editor
3. See live preview updates
4. Save your changes

The editor automatically handles the conversion from plain text to properly formatted XHTML.

> **Tip**: Use markdown-style formatting for rich text features like *italics*, **bold**, and [links](http://example.com).`,

      'sample.chapter2.title': 'Advanced Features',
      'sample.chapter2.content': `# Advanced Features and Customization

Once you're comfortable with basic editing, explore these advanced features:

## Custom Transforms

Transform scripts convert your plain text into XHTML. You can:
- Modify existing transform logic
- Add new formatting rules
- Include external libraries (like Markdown processors)

## Styling and Themes

Customize the appearance of your EPUB:
- Edit CSS files in the manifest
- Add custom fonts and images
- Create responsive layouts for different devices

## Multi-language Support

The editor supports creating EPUBs in multiple languages:
- **Latin scripts**: English, German, French, Spanish
- **Right-to-left**: Arabic, Hebrew
- **Complex scripts**: Japanese, Chinese, Georgian

Each locale includes culturally appropriate content and proper text direction handling.

## Extension System

Extend functionality with:
- Custom transform scripts
- Additional formatting processors
- Third-party libraries

The modular design allows for unlimited customization while maintaining EPUB compatibility.`,

      'sample.appendix.title': 'Technical Reference',
      'sample.appendix.content': `# Technical Reference

## File Structure

Active EPUBs follow this enhanced structure:

\`\`\`
your-book.epub
├── mimetype
├── META-INF/
│   ├── container.xml
│   └── com.apple.ibooks.display-options.xml
├── OEBPS/
│   ├── content.opf          # Package document
│   ├── toc.xhtml           # Table of contents
│   ├── chapters/           # XHTML content files
│   ├── images/             # Images and media
│   ├── styles/             # CSS stylesheets
│   ├── SOURCE.zip          # Editor source files
│   ├── EDITME.html         # Editor application
│   └── EXTRACT_EDITOR.txt  # Extraction instructions
\`\`\`

## Transform Pipeline

The text processing pipeline:
1. Plain text source → Transform script → XHTML output
2. DOM post-processing for links and references  
3. Style application and responsive formatting
4. Validation and error checking

## Browser Compatibility

The editor runs in modern browsers supporting:
- ES2020+ JavaScript features
- Web Streams API for EPUB processing
- Origin Private File System (OPFS) for performance
- IndexedDB fallback for compatibility

## Standards Compliance

All generated EPUBs are fully compliant with:
- EPUB 3.3 specification
- Dublin Core metadata standards
- WCAG accessibility guidelines
- CSS3 for styling and layout

This ensures maximum compatibility across reading devices and platforms.`
    },
    headers: {
      Language: 'en',
      'Content-Type': 'text/plain; charset=UTF-8',
    },
  } satisfies TranslationCatalog,

  de: {
    locale: 'de',
    messages: {
      // Book metadata
      'sample.book.title': 'Einführung in EPUB',
      'sample.book.description': 'Ein umfassender Leitfaden zur Erstellung und Bearbeitung von EPUB-Dateien mit Active EPUB-Technologie.',
      'sample.author.name': 'EDITME Redaktionsteam',
      'sample.publisher.name': 'EDITME Verlag',

      // Chapter content
      'sample.prologue.title': 'Willkommen zu Active EPUB',
      'sample.prologue.content': `# Willkommen zu Active EPUB

Dieses Dokument demonstriert die Kraft der **Active EPUB**-Technologie. Im Gegensatz zu herkömmlichen EPUB-Dateien enthalten Active EPUBs ihren eigenen Editor und sind dadurch selbst-editierbar.

## Was ist ein Active EPUB?

Ein Active EPUB ist eine Standard-EPUB-Datei, die Folgendes enthält:
- Den gesamten regulären EPUB-Inhalt (Text, Bilder, Stile)
- Die EDITME.html-Editor-Anwendung
- SOURCE-Dateien mit den ursprünglichen Klartextquellen
- Transform-Skripte zur Konvertierung von Text zu XHTML

Dies ermöglicht es Lesern, das Buch nicht nur zu lesen, sondern auch zu bearbeiten und neu zu veröffentlichen - mit nichts weiter als einem Webbrowser.

*Erleben Sie die Zukunft des Publizierens mit Active EPUB-Technologie.*`,

      'sample.chapter1.title': 'Erste Schritte',
      'sample.chapter1.content': `# Erste Schritte mit EPUB-Bearbeitung

Dieses Kapitel führt Sie durch die Grundlagen der Erstellung und Bearbeitung von EPUB-Dateien mit dem EDITME-Editor.

## Grundstruktur

Jede EPUB-Datei enthält:
1. **Metadaten** - Informationen über das Buch (Titel, Autor, Sprache, etc.)
2. **Manifest** - Liste aller Dateien im EPUB
3. **Spine** - Lesereihenfolge der Inhaltsdateien
4. **Inhalt** - Die tatsächlichen Kapitel und Ressourcen

## Ihre erste Bearbeitung

Um Ihre erste Bearbeitung durchzuführen:
1. Wählen Sie ein Kapitel aus dem Spine
2. Ändern Sie den Text im Editor
3. Sehen Sie Live-Vorschau-Updates
4. Speichern Sie Ihre Änderungen

Der Editor übernimmt automatisch die Konvertierung von Klartext zu ordnungsgemäß formatiertem XHTML.

> **Tipp**: Verwenden Sie Markdown-ähnliche Formatierung für Rich-Text-Features wie *Kursivschrift*, **Fettschrift** und [Links](http://example.com).`,

      'sample.chapter2.title': 'Erweiterte Funktionen',
      'sample.chapter2.content': `# Erweiterte Funktionen und Anpassung

Sobald Sie sich mit der grundlegenden Bearbeitung vertraut gemacht haben, erkunden Sie diese erweiterten Funktionen:

## Benutzerdefinierte Transforms

Transform-Skripte konvertieren Ihren Klartext in XHTML. Sie können:
- Bestehende Transform-Logik modifizieren
- Neue Formatierungsregeln hinzufügen
- Externe Bibliotheken einbinden (wie Markdown-Prozessoren)

## Styling und Themes

Passen Sie das Erscheinungsbild Ihres EPUB an:
- Bearbeiten Sie CSS-Dateien im Manifest
- Fügen Sie benutzerdefinierte Schriften und Bilder hinzu
- Erstellen Sie responsive Layouts für verschiedene Geräte

## Mehrsprachige Unterstützung

Der Editor unterstützt die Erstellung von EPUBs in mehreren Sprachen:
- **Lateinische Schriften**: Englisch, Deutsch, Französisch, Spanisch
- **Rechts-nach-links**: Arabisch, Hebräisch
- **Komplexe Schriften**: Japanisch, Chinesisch, Georgisch

Jede Sprache enthält kulturell angemessene Inhalte und ordnungsgemäße Textrichtungsbehandlung.

## Erweiterungssystem

Erweitern Sie die Funktionalität mit:
- Benutzerdefinierten Transform-Skripten
- Zusätzlichen Formatierungsprozessoren
- Drittanbieter-Bibliotheken

Das modulare Design ermöglicht unbegrenzte Anpassung bei Beibehaltung der EPUB-Kompatibilität.`,

      'sample.appendix.title': 'Technische Referenz',
      'sample.appendix.content': `# Technische Referenz

## Dateistruktur

Active EPUBs folgen dieser erweiterten Struktur:

\`\`\`
ihr-buch.epub
├── mimetype
├── META-INF/
│   ├── container.xml
│   └── com.apple.ibooks.display-options.xml
├── OEBPS/
│   ├── content.opf          # Paketdokument
│   ├── toc.xhtml           # Inhaltsverzeichnis
│   ├── chapters/           # XHTML-Inhaltsdateien
│   ├── images/             # Bilder und Medien
│   ├── styles/             # CSS-Stylesheets
│   ├── SOURCE.zip          # Editor-Quelldateien
│   ├── EDITME.html         # Editor-Anwendung
│   └── EXTRACT_EDITOR.txt  # Extraktionsanweisungen
\`\`\`

## Transform-Pipeline

Die Textverarbeitungs-Pipeline:
1. Klartext-Quelle → Transform-Skript → XHTML-Ausgabe
2. DOM-Nachbearbeitung für Links und Referenzen
3. Stilanwendung und responsive Formatierung
4. Validierung und Fehlerprüfung

## Browser-Kompatibilität

Der Editor läuft in modernen Browsern mit Unterstützung für:
- ES2020+ JavaScript-Features
- Web Streams API für EPUB-Verarbeitung
- Origin Private File System (OPFS) für Performance
- IndexedDB-Fallback für Kompatibilität

## Standards-Konformität

Alle generierten EPUBs sind vollständig konform mit:
- EPUB 3.3-Spezifikation
- Dublin Core-Metadaten-Standards
- WCAG-Barrierefreiheitsrichtlinien
- CSS3 für Styling und Layout

Dies gewährleistet maximale Kompatibilität auf allen Lesegeräten und Plattformen.`
    },
    headers: {
      Language: 'de',
      'Content-Type': 'text/plain; charset=UTF-8',
    },
  } satisfies TranslationCatalog,

  ar: {
    locale: 'ar',
    messages: {
      // Book metadata
      'sample.book.title': 'مقدمة إلى EPUB',
      'sample.book.description': 'دليل شامل لإنشاء وتحرير ملفات EPUB باستخدام تقنية Active EPUB.',
      'sample.author.name': 'فريق تحرير EDITME',
      'sample.publisher.name': 'دار نشر EDITME',

      // Chapter content (shorter content for Arabic to keep test data manageable)
      'sample.prologue.title': 'مرحباً بكم في Active EPUB',
      'sample.prologue.content': `# مرحباً بكم في Active EPUB

هذا المستند يوضح قوة تقنية **Active EPUB**. على عكس ملفات EPUB التقليدية، تحتوي ملفات Active EPUB على محرر خاص بها، مما يجعلها قابلة للتحرير الذاتي.

## ما هو Active EPUB؟

Active EPUB هو ملف EPUB قياسي يشمل:
- جميع محتويات EPUB العادية (النص، الصور، الأنماط)  
- تطبيق محرر EDITME.html
- ملفات SOURCE التي تحتوي على النصوص الأصلية
- سكريبتات التحويل لتحويل النص إلى XHTML

*اكتشف مستقبل النشر مع تقنية Active EPUB.*`,

      'sample.chapter1.title': 'البداية',
      'sample.chapter1.content': `# البداية مع تحرير EPUB

سيرشدك هذا الفصل خلال أساسيات إنشاء وتحرير ملفات EPUB باستخدام محرر EDITME.

## الهيكل الأساسي

كل ملف EPUB يحتوي على:
1. **البيانات الوصفية** - معلومات عن الكتاب
2. **الفهرس** - قائمة بجميع الملفات
3. **العمود الفقري** - ترتيب القراءة
4. **المحتوى** - الفصول والموارد الفعلية

> **نصيحة**: استخدم تنسيق يشبه Markdown للميزات النصية الغنية.`,

      'sample.chapter2.title': 'الميزات المتقدمة',
      'sample.chapter2.content': `# الميزات المتقدمة والتخصيص

بمجرد أن تصبح مرتاحاً مع التحرير الأساسي، استكشف هذه الميزات المتقدمة:

## التحويلات المخصصة

سكريبتات التحويل تحول النص الخام إلى XHTML.

## الأنماط والثيمات

خصص مظهر EPUB الخاص بك.

## الدعم متعدد اللغات

يدعم المحرر إنشاء EPUB بلغات متعددة:
- **النصوص اللاتينية**: الإنجليزية، الألمانية، الفرنسية
- **من اليمين إلى اليسار**: العربية، العبرية
- **النصوص المعقدة**: اليابانية، الصينية، الجورجية`,

      'sample.appendix.title': 'المرجع التقني',
      'sample.appendix.content': `# المرجع التقني

## هيكل الملف

تتبع ملفات Active EPUB هذا الهيكل المحسن:

\`\`\`
كتابك.epub
├── mimetype
├── META-INF/
├── OEBPS/
│   ├── content.opf          
│   ├── toc.xhtml           
│   ├── chapters/           
│   ├── images/             
│   ├── styles/             
│   ├── SOURCE.zip          
│   ├── EDITME.html         
│   └── EXTRACT_EDITOR.txt  
\`\`\`

## خط معالجة التحويل

خط معالجة النص:
1. النص الخام → سكريبت التحويل → إخراج XHTML
2. معالجة DOM للروابط والمراجع
3. تطبيق الأنماط والتنسيق المتجاوب
4. التحقق والتحقق من الأخطاء

جميع ملفات EPUB المُنتجة متوافقة تماماً مع مواصفات EPUB 3.3 ومعايير Dublin Core.`
    },
    headers: {
      Language: 'ar',
      'Content-Type': 'text/plain; charset=UTF-8',
    },
  } satisfies TranslationCatalog,
};

/**
 * Expected content patterns for validation (without using expect functions)
 */
export const expectedContentPatterns = {
  en: {
    metadata: {
      title: 'Introduction to EPUB',
      description: 'A comprehensive guide to creating and editing EPUB files with Active EPUB technology.',
      author: 'EDITME Editorial Team', 
      publisher: 'EDITME Publishing',
    },
    chapters: {
      prologue: {
        title: 'Welcome to Active EPUB',
        contentPattern: 'This document demonstrates the power of **Active EPUB** technology',
      },
      chapter1: {
        title: 'Getting Started',
        contentPattern: 'This chapter will guide you through the basics',
      },
      chapter2: {
        title: 'Advanced Features',
        contentPattern: 'Once you\'re comfortable with basic editing',
      },
      appendix: {
        title: 'Technical Reference',
        contentPattern: 'Active EPUBs follow this enhanced structure',
      },
    },
  },

  de: {
    metadata: {
      title: 'Einführung in EPUB',
      description: 'Ein umfassender Leitfaden zur Erstellung und Bearbeitung von EPUB-Dateien mit Active EPUB-Technologie.',
      author: 'EDITME Redaktionsteam',
      publisher: 'EDITME Verlag',
    },
    chapters: {
      prologue: {
        title: 'Willkommen zu Active EPUB',
        contentPattern: 'Dieses Dokument demonstriert die Kraft der **Active EPUB**-Technologie',
      },
      chapter1: {
        title: 'Erste Schritte',
        contentPattern: 'Dieses Kapitel führt Sie durch die Grundlagen',
      },
      chapter2: {
        title: 'Erweiterte Funktionen',
        contentPattern: 'Sobald Sie sich mit der grundlegenden Bearbeitung',
      },
      appendix: {
        title: 'Technische Referenz',
        contentPattern: 'Active EPUBs folgen dieser erweiterten Struktur',
      },
    },
  },

  ar: {
    metadata: {
      title: 'مقدمة إلى EPUB',
      description: 'دليل شامل لإنشاء وتحرير ملفات EPUB باستخدام تقنية Active EPUB.',
      author: 'فريق تحرير EDITME',
      publisher: 'دار نشر EDITME',
    },
    chapters: {
      prologue: {
        title: 'مرحباً بكم في Active EPUB',
        contentPattern: 'هذا المستند يوضح قوة تقنية **Active EPUB**',
      },
      chapter1: {
        title: 'البداية',
        contentPattern: 'سيرشدك هذا الفصل خلال أساسيات إنشاء وتحرير',
      },
      chapter2: {
        title: 'الميزات المتقدمة',
        contentPattern: 'بمجرد أن تصبح مرتاحاً مع التحرير الأساسي',
      },
      appendix: {
        title: 'المرجع التقني',
        contentPattern: 'تتبع ملفات Active EPUB هذا الهيكل المحسن',
      },
    },
  },
};

/**
 * Validation test cases
 */
export const validationTestCases = {
  valid: {
    en: {
      isValid: true,
      missingKeys: [],
      emptyKeys: [],
      locale: 'en',
    } satisfies ValidationResult,

    de: {
      isValid: true,
      missingKeys: [],
      emptyKeys: [],
      locale: 'de',
    } satisfies ValidationResult,

    ar: {
      isValid: true,
      missingKeys: [],
      emptyKeys: [],
      locale: 'ar',
    } satisfies ValidationResult,
  },

  missing: {
    incompleteFrench: {
      isValid: false,
      missingKeys: [
        'sample.chapter2.title',
        'sample.chapter2.content',
        'sample.appendix.title',
        'sample.appendix.content',
      ],
      emptyKeys: [],
      locale: 'fr',
    } satisfies ValidationResult,
  },

  empty: {
    emptyContent: {
      isValid: false,
      missingKeys: [],
      emptyKeys: [
        'sample.book.title',
        'sample.prologue.content',
      ],
      locale: 'es',
    } satisfies ValidationResult,
  },
};

/**
 * Error test scenarios
 */
export const errorScenarios = {
  unsupportedLocale: {
    locale: 'invalid-xx',
    expectedError: 'UnsupportedLocaleError',
    expectedMessage: 'Unsupported locale: invalid-xx',
  },

  missingTranslations: {
    locale: 'fr',
    missingKeys: ['sample.chapter2.title', 'sample.chapter2.content'],
    expectedError: 'TranslationMissingError',
    expectedMessage: 'Missing translation keys for locale fr: sample.chapter2.title, sample.chapter2.content',
  },

  invalidContent: {
    locale: 'es',
    key: 'sample.book.title',
    reason: 'Translation is empty',
    expectedError: 'InvalidContentError',
    expectedMessage: 'Invalid content for es.sample.book.title: Translation is empty',
  },
};

/**
 * Mock catalogs with missing content for error testing
 */
export const incompleteCatalogs = {
  fr: {
    locale: 'fr',
    messages: {
      // Only partial content
      'sample.book.title': 'Introduction à EPUB',
      'sample.book.description': 'Un guide complet pour créer et éditer des fichiers EPUB.',
      'sample.author.name': 'Équipe éditoriale EDITME',
      'sample.publisher.name': 'Éditions EDITME',
      'sample.prologue.title': 'Bienvenue dans Active EPUB',
      'sample.prologue.content': 'Ce document démontre la puissance de la technologie **Active EPUB**.',
      'sample.chapter1.title': 'Commencer',
      'sample.chapter1.content': 'Ce chapitre vous guidera à travers les bases de la création et de l\'édition de fichiers EPUB.',
      // Missing: chapter2 and appendix content
    },
    headers: {
      Language: 'fr',
      'Content-Type': 'text/plain; charset=UTF-8',
    },
  } satisfies TranslationCatalog,

  es: {
    locale: 'es',
    messages: {
      'sample.book.title': '', // Empty content
      'sample.book.description': 'Una guía completa para crear y editar archivos EPUB.',
      'sample.author.name': 'Equipo Editorial EDITME',
      'sample.publisher.name': 'Editorial EDITME',
      'sample.prologue.title': 'Bienvenido a Active EPUB',
      'sample.prologue.content': '', // Empty content
      'sample.chapter1.title': 'Comenzando',
      'sample.chapter1.content': 'Este capítulo te guiará a través de los conceptos básicos.',
      'sample.chapter2.title': 'Características Avanzadas',
      'sample.chapter2.content': 'Una vez que te sientas cómodo con la edición básica...',
      'sample.appendix.title': 'Referencia Técnica',
      'sample.appendix.content': 'Los EPUBs Activos siguen esta estructura mejorada...',
    },
    headers: {
      Language: 'es',
      'Content-Type': 'text/plain; charset=UTF-8',
    },
  } satisfies TranslationCatalog,
};

/**
 * List of all required sample content keys
 */
export const requiredSampleContentKeys: SampleContentKey[] = [
  'sample.book.title',
  'sample.book.description', 
  'sample.author.name',
  'sample.publisher.name',
  'sample.prologue.title',
  'sample.prologue.content',
  'sample.chapter1.title',
  'sample.chapter1.content',
  'sample.chapter2.title',
  'sample.chapter2.content',
  'sample.appendix.title',
  'sample.appendix.content',
];

/**
 * Available locales list for testing
 */
export const expectedAvailableLocales = ['en', 'de', 'ar'];

/**
 * Factory function to create fresh test data (prevents test pollution)
 */
export function createTestCatalogs() {
  return JSON.parse(JSON.stringify(mockSampleContentCatalogs));
}

/**
 * Factory function to create incomplete catalogs for error testing
 */
export function createIncompleteCatalogs() {
  return JSON.parse(JSON.stringify(incompleteCatalogs));
}