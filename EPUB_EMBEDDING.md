# EPUB Embedding Guide

This guide explains how to create Active EPUBs by embedding EDITME.html within EPUB files, enabling self-editing capabilities.

## Table of Contents

1. [Active EPUB Format](#active-epub-format)
3. [Extraction Instructions](#extraction-instructions)

## Active EPUB Format

### Overview

An Active EPUB is a standard EPUB that includes EDITME.html, allowing readers to extract and use the editor to modify the book. This creates a self-contained, editable publication.

### Structure

```
ActiveEPUB/
├── mimetype
├── META-INF/
│   └── container.xml
└── OEBPS/
    ├── content.opf          # EPUB manifest
    ├── nav.xhtml            # Navigation
    ├── EDITME.html          # The editor application
    ├── SOURCE.zip           # Editor source files
    └── [book content files]
```

### Key Components

1. **EDITME.html** - The complete editor application
2. **SOURCE.zip** - Contains:
   - Plain text source files
   - Transform scripts
   - Editor settings
   - Custom extensions

The SOURCE.zip should contain:

```
SOURCE/
├── settings.json        # Editor configuration
├── text/               # Plain text sources
│   ├── chapter1.txt
│   ├── chapter2.txt
│   └── ...
├── scripts/            # Transform scripts
│   ├── transformText.js
│   └── transformDom.js
└── extensions/         # Optional extensions
```

### 3: Create Extraction Instructions

Create a new Spine Item with instructions like this;

```text
EXTRACTING THE EDITME EDITOR
============================

This EPUB contains EDITME.html, a browser-based editor that can modify this book.

To extract and use the editor:

METHOD 1 - Manual Extraction
----------------------------
1. Make a copy of this EPUB file
2. Change the file extension from .epub to .zip
3. Extract the ZIP file to a folder
4. Navigate to OEBPS/EDITME.html
5. Copy EDITME.html to your preferred location

USING THE EDITOR
----------------
1. Open EDITME.html in a modern web browser
2. The editor works completely offline
3. Import this EPUB to begin editing
4. Export your changes as a new EPUB

SYSTEM REQUIREMENTS
-------------------
- Chrome/Edge 119+, Firefox 119+, or Safari 17+
- No installation required
- All editing happens in your browser

LICENSE
-------
EDITME.html is freeware for personal use.
Commercial use requires a separate license.
(c) 2025 Stewart Haines
```
