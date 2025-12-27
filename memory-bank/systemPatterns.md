# System Patterns *Optional*

This file documents recurring patterns and standards used in the project.
It is optional, but recommended to be updated as the project evolves.
2025-12-27 12:54:03 - Log of updates made.
2025-12-27 12:55:20 - Updated with coding, architectural, and testing patterns based on existing extractors.

*

## Coding Patterns

### Extractor Object Structure
Each extractor exports a global `extractor` object with:
- `id`: Unique identifier (e.g., "mangakakalot")
- `name`: Display name (e.g., "MangaKakalot")
- `version`: Semantic version string (e.g., "1.6.0")
- `baseUrl`: Base URL of the manga source
- `icon`: URL to favicon/icon
- `imageproxy`: Optional image proxy URL (empty string if disabled)
- `imageReferer`: Referer header for image requests
- `debug`: Boolean flag for debug logging
- `rateLimit`: Configuration object (requestsPerMinute, minIntervalMs, maxRetries, retryDelayMs)
- `imageLoading`: Configuration object (maxConcurrent, preloadAhead, timeout)
- `categories`: Array of category objects (id, name)

### Helper Functions (Common Patterns)
- `ensureAbsoluteUrl(url)`: Convert relative URLs to absolute
- `cleanText(text)`: Remove HTML tags and trim whitespace
- `extractImageUrl(imgTag)`: Extract image URL from img tag, checking multiple attributes (data-src, data-original, data-lazy-src, src, onerror fallback)

### Parser Functions
- `parseMangaList(html)`: Returns `{success: boolean, items: [{id, title, cover, url, lastChapter, lastChapterId}]}`
- `parseMangaDetails(html)`: Returns `{success: boolean, manga: {title, cover, description, author, status, genres: [], chapters: []}}`
- `parseChapterImages(html)`: Returns `{success: boolean, images: ["url1", "url2", ...]}`
- `parseGenres(html)`: Returns `{success: boolean, genres: [{id, name}]}`

### URL Builder Functions
- `getListUrl(type, page)`: Build URL for manga list pages (latest, popular, completed, new)
- `getSearchUrl(query, page)`: Build URL for search results
- `getGenreUrl(genre, page)`: Build URL for genre browsing

## Architectural Patterns

### Directory Structure
```
sources/
├── {source-name}/
│   ├── extract.js      # Main extractor logic
│   ├── meta.json       # Source metadata
│   ├── helpers.js      # Optional shared utilities
│   ├── logger.js       # Optional logging utilities
│   └── fallback_images.json  # Optional fallback image mappings
```

### Meta.json Structure
```json
{
  "name": "Source Name",
  "version": "1.0.0",
  "type": "single",
  "script": "https://raw.githubusercontent.com/.../extract.js",
  "baseUrl": "https://example.com",
  "icon": "https://example.com/favicon.ico",
  "imageproxy": "https://proxy-url?referrer=...&url=",
  "imageReferer": "https://example.com/"
}
```

### All Source Registry
`all_source.json` contains:
- `version`: Registry version
- `type`: "all"
- `sources`: Array of URLs to individual meta.json files

### HTML Parsing Strategy
1. **Multiple Format Support**: Extractors should handle multiple HTML formats (new/legacy layouts)
2. **Fallback Methods**: Each parser should have fallback regex patterns for robustness
3. **Container-based Extraction**: Look for specific container classes first, then fall back to generic patterns
4. **Image Extraction**: Check multiple attributes (data-src, data-original, src) and onerror fallbacks
5. **Chapter Number Extraction**: Parse chapter numbers from titles with regex, fallback to position

## Testing Patterns

### Test Framework
Located in `debug/test_generic_extractor.js`:
- Loads extractor via `eval()` from file
- Tests three main functions sequentially:
  1. `parseMangaList()` - validates item count > 0
  2. `parseMangaDetails()` - validates chapter count > 0
  3. `parseChapterImages()` - validates image count > 0
- Tests image accessibility via HEAD requests
- Outputs results to `{source}_test_results.json`

### Expected Output Format
`debug/correct_output_test_results.json` defines the expected structure:
```json
{
  "timestamp": "ISO8601 timestamp",
  "extractorVersion": "1.6.0",
  "mangaList": {
    "success": true,
    "itemCount": number,
    "sampleItems": [...]
  },
  "mangaDetails": {
    "success": true,
    "title": "string",
    "chapterCount": number
  },
  "chapterImages": {
    "success": true,
    "imageCount": number,
    "sampleImages": [...]
  },
  "allPassed": boolean
}
```

### Test Execution
```bash
node debug/test_generic_extractor.js
```

### Success Criteria
- All three tests must pass
- Each test must extract at least one item/chapter/image
- Images must be accessible (HTTP 200 response)
