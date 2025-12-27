# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JavaScript manga source extractor project that builds extractors for 50+ manga websites. Each extractor provides a unified interface for the xpmanga Flutter app to fetch manga lists, details, chapters, and images.

**Architecture**: Self-contained extractors with no shared utilities. Each source has its own `extract.js` that includes all required helper functions.

## Commands

```bash
# Test an extractor
node debug/test_generic_extractor.js

# Download HTML from a manga website
node tools/webpage_analyzer.js download <url> [output-file]

# For Cloudflare-protected sites (provides manual download instructions)
node tools/webpage_analyzer.js download-browser <url> [output-file]

# Analyze HTML structure
node tools/webpage_analyzer.js analyze <html-file>

# Find CSS selectors matching a pattern
node tools/webpage_analyzer.js selectors <html-file> <pattern>

# Extract all images from HTML
node tools/webpage_analyzer.js images <html-file>

# Analyze page structure (containers, lists, pagination)
node tools/webpage_analyzer.js structure <html-file>
```

## Source Structure

```
sources/{source-name}/
├── extract.js              # Main extractor (REQUIRED)
├── meta.json               # Source metadata (REQUIRED)
├── helpers.js              # Additional helpers (optional)
├── logger.js               # Logging utilities (optional)
├── fallback_images.json    # Fallback image mappings (optional)
└── example-*.html          # Sample HTML for testing (optional)
```

## Extractor Interface

All extractors export a global `extractor` object with:

**Required Parser Functions:**
- `parseMangaList(html)` → `{success, items: [{id, title, cover, url, lastChapter, lastChapterId}]}`
- `parseMangaDetails(html)` → `{success, manga: {title, cover, description, author, status, genres[], chapters[]}}`
- `parseChapterImages(html)` → `{success, images: ["url1", "url2", ...]}`
- `parseGenres(html)` → `{success, genres: [{id, name}]}`

**Required URL Builders:**
- `getListUrl(type, page)` - Build URL for manga lists (latest, popular, etc.)
- `getSearchUrl(query, page)` - Build URL for search
- `getGenreUrl(genre, page)` - Build URL for genre browsing

## Key Files

| File | Purpose |
|------|---------|
| `all_source.json` | Master registry of all source metadata URLs |
| `docs/EXTRACTOR_TEMPLATE.md` | Template for new extractors |
| `docs/SOURCE_PRIORITIZATION.md` | Implementation priority tiers |
| `debug/test_generic_extractor.js` | Test script for extractors |
| `sources/mangakakalot/extract.js` | Reference implementation (v1.6.0) |

## Creating a New Extractor

1. Create `sources/{source-name}/` directory
2. Create `extract.js` following the template in `docs/EXTRACTOR_TEMPLATE.md`
3. Create `meta.json` with source metadata
4. Test with `node debug/test_generic_extractor.js`
5. Add meta.json URL to `all_source.json`

## Image Extraction Priority

Check these attributes in order when extracting images:
1. `data-src`
2. `data-original`
3. `data-lazy-src`
4. `data-srcset`
5. `data-url`
6. `data-image`
7. `src`
8. `onerror` fallback

## Error Handling Pattern

```javascript
parseMangaList: function(html) {
  try {
    // parsing logic
    return { success: true, items: items };
  } catch (e) {
    console.error("Failed to extract manga list", e);
    return { success: false, error: e.toString(), items: [] };
  }
}
```

## Project Status

- **Completed**: 2/50 sources (mangakakalot, mangapark)
- **Priority**: Tier 2 English sources (mangadex-dn recommended next)
- **Status tracking**: `memory-bank/progress.md`
