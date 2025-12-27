# xpmanga Extractor Project - Quick Start Guide

This is your comprehensive reference guide for the xpmanga JavaScript extractor project.

## Project Overview

Build JavaScript extractors for 50+ manga sources to extract manga data (manga lists, chapter pages, etc.) for the xpmanga application.

**Sources**: 50+ manga sources across 10 languages (English, Arabic, Bahasa Indonesia, Espanol, Italiano, Viet, Portugues, Russia, France, Deutsch)

**Status**: 2/50 sources completed (mangakakalot, mangapark)

## Quick Reference

### Essential Files

| File | Purpose |
|------|---------|
| [`README.md`](../README.md) | Project overview and basic info |
| [`support_manga_source.md`](../support_manga_source.md) | List of all 50+ sources |
| [`all_source.json`](../all_source.json) | Master registry of source metadata |
| [`docs/EXTRACTOR_TEMPLATE.md`](EXTRACTOR_TEMPLATE.md) | **START HERE** - Extractor template |
| [`docs/SOURCE_PRIORITIZATION.md`](SOURCE_PRIORITIZATION.md) | Implementation priorities |
| [`docs/ARCHITECTURE_PLAN.md`](ARCHITECTURE_PLAN.md) | Complete architecture plan |

### Memory Bank (Project Context)

| File | Purpose |
|------|---------|
| [`memory-bank/productContext.md`](../memory-bank/productContext.md) | Project goals and overview |
| [`memory-bank/activeContext.md`](../memory-bank/activeContext.md) | Current focus and status |
| [`memory-bank/progress.md`](../memory-bank/progress.md) | Task tracking and source status |
| [`memory-bank/decisionLog.md`](../memory-bank/decisionLog.md) | Architectural decisions |
| [`memory-bank/systemPatterns.md`](../memory-bank/systemPatterns.md) | Coding patterns and standards |

## Architecture Summary

### Key Principle: Individual Extractors

**Each manga source has its own self-contained extractor.**

- No shared utilities library
- Each `extract.js` includes its own helper functions
- Simpler architecture, easier maintenance
- Each extractor can be updated independently

### Extractor Structure

```
sources/{source-name}/
├── extract.js      # Main extractor logic (REQUIRED)
└── meta.json       # Source metadata (REQUIRED)
```

Optional files (as needed):
- `helpers.js` - Additional helper functions
- `logger.js` - Custom logging utilities
- `fallback_images.json` - Fallback image mappings

## How to Implement a New Extractor

### Step 1: Create Source Directory

```bash
mkdir sources/{source-name}
```

### Step 2: Create extract.js

Follow the template in [`docs/EXTRACTOR_TEMPLATE.md`](EXTRACTOR_TEMPLATE.md).

**Required Functions:**

```javascript
var extractor = {
  // Metadata
  id: "source-id",
  name: "Source Name",
  version: "1.0.0",
  baseUrl: "https://example.com",
  icon: "https://example.com/favicon.ico",
  imageproxy: "",
  imageReferer: "https://example.com/",
  debug: true,

  // Configuration
  rateLimit: { requestsPerMinute: 30, minIntervalMs: 2000, maxRetries: 3, retryDelayMs: 3000 },
  imageLoading: { maxConcurrent: 3, preloadAhead: 2, timeout: 30000 },
  categories: [{ id: "latest", name: "Latest" }],

  // URL Builders
  getListUrl: function(type, page) { ... },
  getSearchUrl: function(query, page) { ... },
  getGenreUrl: function(genre, page) { ... },

  // Parsers (REQUIRED)
  parseMangaList: function(html) { ... },
  parseMangaDetails: function(html) { ... },
  parseChapterImages: function(html) { ... },
  parseGenres: function(html) { ... }
};

extractor;
```

**Output Formats:**

```javascript
// parseMangaList
{ success: true, items: [{id, title, cover, url, lastChapter, lastChapterId}] }

// parseMangaDetails
{ success: true, manga: {title, cover, description, author, status, genres: [], chapters: []} }

// parseChapterImages
{ success: true, images: ["url1", "url2", ...] }
```

### Step 3: Create meta.json

```json
{
  "name": "Source Name",
  "version": "1.0.0",
  "type": "single",
  "script": "https://raw.githubusercontent.com/tsk902000/xpmanga-source/refs/heads/main/sources/{source-name}/extract.js",
  "baseUrl": "https://example.com",
  "icon": "https://example.com/favicon.ico",
  "imageproxy": "https://image-proxy.kai902000.workers.dev/?referrer=https://example.com&url=",
  "imageReferer": "https://example.com/"
}
```

### Step 4: Test Your Extractor

Edit [`debug/test_generic_extractor.js`](../debug/test_generic_extractor.js) to use your source:

```javascript
const mangaSource = 'your-source-name';
const mangaSourceURL = 'https://example.com/';
```

Run tests:
```bash
node debug/test_generic_extractor.js
```

**Success Criteria:**
- All three tests pass (manga list, manga details, chapter images)
- Each test extracts at least one item/chapter/image
- Images are accessible (HTTP 200 response)

### Step 5: Update all_source.json

Add your source to the sources array in [`all_source.json`](../all_source.json):

```json
{
  "version": "1.0.0",
  "type": "all",
  "sources": [
    "https://raw.githubusercontent.com/tsk902000/xpmanga-source/refs/heads/main/sources/your-source/meta.json"
  ]
}
```

## Common Helper Functions

### ensureAbsoluteUrl
```javascript
ensureAbsoluteUrl: function(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return this.baseUrl + (url.startsWith("/") ? url : "/" + url);
}
```

### cleanText
```javascript
cleanText: function(text) {
  if (!text) return "";
  return text.replace(/<[^>]*>/g, "").trim();
}
```

### extractImageUrl
```javascript
extractImageUrl: function(imgTag) {
  if (!imgTag) return null;
  
  const attributes = ["data-src", "data-original", "data-lazy-src", "src"];
  
  for (let attr of attributes) {
    const regex = new RegExp(attr + '=["\'](https?://[^"\']+)["\']', 'i');
    const match = imgTag.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  const onerrorMatch = imgTag.match(/onerror="[^"]*this\.src='([^']+)'/);
  if (onerrorMatch && onerrorMatch[1]) {
    return this.ensureAbsoluteUrl(onerrorMatch[1]);
  }
  
  return null;
}
```

## Reference Implementations

Study these to understand patterns:

1. **[`sources/mangakakalot/extract.js`](../sources/mangakakalot/extract.js)** - v1.6.0
   - Full-featured with multiple format support
   - Comprehensive error handling
   - Fallback parsing methods

2. **[`sources/mangapark/extract.js`](../sources/mangapark/extract.js)** - v1.0.0
   - Simpler implementation
   - JSON-based image extraction
   - Good for simpler sites

## Implementation Priorities

### Tier 1: Reference Sources ✅
- mangakakalot, mangapark (already completed)

### Tier 2: High Priority English Sources (16 sources)
1. mangadex-dn ← **RECOMMENDED FIRST**
2. mangasee
3. batoto
4. mangabuddy
5. mangahub
6. mangahere
7. mangafox
8. readmangatoday
9. mangahasu
10. comicFree
11. comicsonline
12. kissmanga
13. topmanhua
14. 9manga
15. muctau
16. mangareader

### Tier 3 & 4: Non-English Sources
See [`docs/SOURCE_PRIORITIZATION.md`](SOURCE_PRIORITIZATION.md) for complete list.

## Testing Framework

Located in [`debug/test_generic_extractor.js`](../debug/test_generic_extractor.js):

**What it tests:**
1. `parseMangaList()` - validates item count > 0
2. `parseMangaDetails()` - validates chapter count > 0
3. `parseChapterImages()` - validates image count > 0
4. Image accessibility via HEAD requests

**Output:**
- `{source}_test_results.json` - Test results
- `debug/correct_output_test_results.json` - Expected format reference

## Important Notes

### HTML Parsing Strategy
- Handle multiple HTML formats (new/legacy layouts)
- Use fallback regex patterns for robustness
- Look for specific container classes first, then fall back to generic patterns

### Image Extraction
Check multiple attributes in order:
1. `data-src`
2. `data-original`
3. `data-lazy-src`
4. `src`
5. `onerror` fallback

### Error Handling
Always wrap parser functions in try-catch:
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

### Debug Logging
Use `console.log()` when `debug: true`:
```javascript
if (this.debug) {
  console.log("Processing manga list...");
}
```

## Project Status

**Completed**: 2/50 sources (4%)
**Remaining**: 48 sources (96%)

Check [`memory-bank/progress.md`](../memory-bank/progress.md) for detailed status.

## Quick Commands

```bash
# Test an extractor
node debug/test_generic_extractor.js

# Run all tests (if available)
node debug/run_tests.sh  # Linux/Mac
debug\run_tests.bat      # Windows
```

## When You Need Help

1. **Pattern reference**: Check [`memory-bank/systemPatterns.md`](../memory-bank/systemPatterns.md)
2. **Architectural decisions**: Check [`memory-bank/decisionLog.md`](../memory-bank/decisionLog.md)
3. **Current status**: Check [`memory-bank/activeContext.md`](../memory-bank/activeContext.md)
4. **Template**: Check [`docs/EXTRACTOR_TEMPLATE.md`](EXTRACTOR_TEMPLATE.md)
5. **Priorities**: Check [`docs/SOURCE_PRIORITIZATION.md`](SOURCE_PRIORITIZATION.md)

## Getting Started

1. Read [`docs/EXTRACTOR_TEMPLATE.md`](EXTRACTOR_TEMPLATE.md) for the complete template
2. Study [`sources/mangakakalot/extract.js`](../sources/mangakakalot/extract.js) for a full-featured example
3. Implement your first extractor (start with mangadex-dn)
4. Test using [`debug/test_generic_extractor.js`](../debug/test_generic_extractor.js)
5. Update [`all_source.json`](../all_source.json) with your source

Good luck building your extractors! 🚀
