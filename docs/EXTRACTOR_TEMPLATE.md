# Extractor Template

This template provides a reference for creating new manga source extractors for xpmanga.

## Directory Structure

```
sources/
└── {source-name}/
    ├── extract.js      # Main extractor logic (required)
    └── meta.json       # Source metadata (required)
```

Optional files (as needed):
- `helpers.js` - Additional helper functions
- `logger.js` - Custom logging utilities
- `fallback_images.json` - Fallback image mappings

## Extractor Object Structure

Each `extract.js` must export a global `extractor` object with the following structure:

```javascript
var extractor = {
  // Basic metadata
  id: "source-id",              // Unique identifier (lowercase, no spaces)
  name: "Source Name",          // Display name
  version: "1.0.0",             // Semantic version
  baseUrl: "https://example.com", // Base URL
  icon: "https://example.com/favicon.ico",
  imageproxy: "",               // Optional: image proxy URL (empty if disabled)
  imageReferer: "https://example.com/", // Referer for image requests
  debug: true,                  // Enable debug logging

  // Rate limiting configuration
  rateLimit: {
    requestsPerMinute: 30,      // Max requests per minute
    minIntervalMs: 2000,        // Min milliseconds between requests
    maxRetries: 3,              // Max retries on rate limit errors
    retryDelayMs: 3000          // Base delay for retry (doubles each attempt)
  },

  // Image loading configuration
  imageLoading: {
    maxConcurrent: 3,           // Max parallel image loads
    preloadAhead: 2,            // Preload N images ahead of current page
    timeout: 30000              // Image load timeout in milliseconds
  },

  // Available categories for browsing
  categories: [
    { id: "latest", name: "Latest" },
    { id: "popular", name: "Popular" },
    { id: "completed", name: "Completed" },
    { id: "new", name: "New Series" }
  ],

  // Helper functions (include as needed)
  ensureAbsoluteUrl: function(url) {
    // Convert relative URLs to absolute
  },

  cleanText: function(text) {
    // Remove HTML tags and trim whitespace
  },

  extractImageUrl: function(imgTag) {
    // Extract image URL from img tag
    // Check: data-src, data-original, data-lazy-src, src
    // Also check onerror fallback
  },

  // URL builder functions
  getListUrl: function(type, page) {
    // Return URL for manga list pages
    // type: 'latest', 'popular', 'completed', 'new'
    // page: page number (default 1)
  },

  getSearchUrl: function(query, page) {
    // Return URL for search results
  },

  getGenreUrl: function(genre, page) {
    // Return URL for genre browsing
  },

  // Parser functions (required)
  parseMangaList: function(html) {
    // Parse manga list from HTML
    // Return: { success: true, items: [...] }
  },

  parseMangaDetails: function(html) {
    // Parse manga details from HTML
    // Return: { success: true, manga: {...} }
  },

  parseChapterImages: function(html) {
    // Parse chapter images from HTML
    // Return: { success: true, images: [...] }
  },

  parseGenres: function(html) {
    // Parse available genres from HTML
    // Return: { success: true, genres: [...] }
  }
};

extractor; // Return the extractor object
```

## Required Output Formats

### parseMangaList Output

```javascript
{
  success: true,
  items: [
    {
      id: "manga-id",
      title: "Manga Title",
      cover: "https://example.com/cover.jpg",
      url: "https://example.com/manga/manga-id",
      lastChapter: "Chapter 100",
      lastChapterId: "chapter-100"
    }
  ]
}
```

### parseMangaDetails Output

```javascript
{
  success: true,
  manga: {
    title: "Manga Title",
    cover: "https://example.com/cover.jpg",
    description: "Manga description...",
    author: "Author Name",
    status: "Ongoing",
    genres: ["Action", "Adventure", "Comedy"],
    chapters: [
      {
        id: "chapter-100",
        number: 100,
        title: "Chapter 100",
        url: "https://example.com/manga/manga-id/chapter-100",
        date: "2025-12-27"
      }
    ]
  }
}
```

### parseChapterImages Output

```javascript
{
  success: true,
  images: [
    "https://example.com/images/page-1.jpg",
    "https://example.com/images/page-2.jpg",
    "https://example.com/images/page-3.jpg"
  ]
}
```

### parseGenres Output

```javascript
{
  success: true,
  genres: [
    { id: "action", name: "Action" },
    { id: "adventure", name: "Adventure" }
  ]
}
```

## Meta.json Structure

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

## Implementation Tips

### 1. HTML Parsing Strategy

- **Multiple Format Support**: Handle both new and legacy HTML layouts
- **Fallback Methods**: Always have fallback regex patterns
- **Container-based Extraction**: Look for specific container classes first, then fall back to generic patterns

### 2. Image Extraction

Check multiple attributes in order:
1. `data-src`
2. `data-original`
3. `data-lazy-src`
4. `src`
5. `onerror` fallback

### 3. Chapter Number Extraction

Parse chapter numbers from titles with regex:
```javascript
const numberMatch = title.match(/Chapter\s+(\d+(\.\d+)?)/i);
if (numberMatch) {
  chapterNumber = parseFloat(numberMatch[1]);
}
```

### 4. Error Handling

All parser functions should wrap in try-catch:
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

### 5. Debug Logging

Use `console.log()` for debug output when `debug: true`:
```javascript
if (this.debug) {
  console.log("Processing manga list...");
}
```

## Testing

Run the test script:
```bash
node debug/test_generic_extractor.js
```

The test will:
1. Load your extractor
2. Test `parseMangaList()` - validates item count > 0
3. Test `parseMangaDetails()` - validates chapter count > 0
4. Test `parseChapterImages()` - validates image count > 0
5. Check image accessibility via HEAD requests
6. Output results to `{source}_test_results.json`

## Reference Implementations

- [`sources/mangakakalot/extract.js`](../sources/mangakakalot/extract.js) - Full-featured extractor with multiple format support
- [`sources/mangapark/extract.js`](../sources/mangapark/extract.js) - Simpler extractor with JSON-based image extraction

## Common Patterns

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
  
  // Check onerror fallback
  const onerrorMatch = imgTag.match(/onerror="[^"]*this\.src='([^']+)'/);
  if (onerrorMatch && onerrorMatch[1]) {
    return this.ensureAbsoluteUrl(onerrorMatch[1]);
  }
  
  return null;
}
```
