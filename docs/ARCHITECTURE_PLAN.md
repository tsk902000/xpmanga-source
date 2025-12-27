# Architecture Plan for xpmanga Extractors

## Overview

This document outlines the architecture and implementation plan for building JavaScript extractors for 50+ manga sources across 10 languages.

## Project Structure

```
xpmanga-source/
├── all_source.json              # Master registry of all sources
├── README.md                   # Project documentation
├── support_manga_source.md      # List of all supported sources
├── debug/                      # Testing framework
│   ├── test_generic_extractor.js # Generic test script
│   ├── correct_output_test_results.json # Expected output format
│   └── {source}_test_results.json # Test results per source
├── sources/                    # Extractor implementations
│   ├── mangakakalot/          # Example: Complete implementation
│   │   ├── extract.js         # Main extractor logic
│   │   ├── meta.json          # Source metadata
│   │   ├── helpers.js         # Optional helpers
│   │   ├── logger.js          # Optional logger
│   │   └── fallback_images.json # Optional fallbacks
│   ├── mangapark/             # Example: Complete implementation
│   │   ├── extract.js
│   │   └── meta.json
│   └── {source-name}/        # New sources to implement
│       ├── extract.js
│       └── meta.json
├── docs/                      # Documentation
│   ├── EXTRACTOR_TEMPLATE.md   # Extractor template
│   ├── SOURCE_PRIORITIZATION.md # Implementation priorities
│   └── ARCHITECTURE_PLAN.md  # This file
└── memory-bank/               # Project context management
    ├── productContext.md
    ├── activeContext.md
    ├── progress.md
    ├── decisionLog.md
    └── systemPatterns.md
```

## Architecture Principles

### 1. Individual Extractor Approach

**Decision:** Each manga source has its own self-contained extractor.

**Rationale:**
- Each source has unique HTML structure and parsing requirements
- No shared utilities library - each extractor includes its own helper functions
- Simpler architecture with no dependencies between extractors
- Easier to maintain - each extractor can be updated independently
- More flexible - each source can use custom parsing logic

### 2. Standardized Interface

All extractors must implement the same interface:

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
  rateLimit: { ... },
  imageLoading: { ... },
  categories: [ ... ],

  // URL Builders
  getListUrl(type, page),
  getSearchUrl(query, page),
  getGenreUrl(genre, page),

  // Parsers (Required)
  parseMangaList(html),
  parseMangaDetails(html),
  parseChapterImages(html),
  parseGenres(html)
};
```

### 3. Consistent Output Format

All parsers return objects with consistent structure:

- **parseMangaList**: `{success: boolean, items: [{id, title, cover, url, lastChapter, lastChapterId}]}`
- **parseMangaDetails**: `{success: boolean, manga: {title, cover, description, author, status, genres, chapters}}`
- **parseChapterImages**: `{success: boolean, images: ["url1", "url2", ...]}`
- **parseGenres**: `{success: boolean, genres: [{id, name}]}`

### 4. Robust Parsing Strategy

Each extractor should:
- Handle multiple HTML formats (new/legacy layouts)
- Have fallback regex patterns for robustness
- Use container-based extraction first, then fall back to generic patterns
- Check multiple image attributes (data-src, data-original, src, onerror)
- Parse chapter numbers from titles with regex, fallback to position

## Implementation Workflow

### For Each New Source:

1. **Create Source Directory**
   ```bash
   mkdir sources/{source-name}
   ```

2. **Create extract.js**
   - Follow template in `docs/EXTRACTOR_TEMPLATE.md`
   - Reference existing implementations (mangakakalot, mangapark)
   - Implement all required parser functions
   - Include helper functions as needed

3. **Create meta.json**
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

4. **Test Extractor**
   ```bash
   node debug/test_generic_extractor.js
   ```
   - Update test script to use your source
   - Verify all three tests pass
   - Check output format matches expected

5. **Update all_source.json**
   - Add source metadata URL to sources array

## Testing Framework

### Test Script: `debug/test_generic_extractor.js`

The test framework:
1. Loads extractor via `eval()` from file
2. Tests three main functions:
   - `parseMangaList()` - validates item count > 0
   - `parseMangaDetails()` - validates chapter count > 0
   - `parseChapterImages()` - validates image count > 0
3. Tests image accessibility via HEAD requests
4. Outputs results to `{source}_test_results.json`

### Success Criteria
- All three tests must pass
- Each test must extract at least one item/chapter/image
- Images must be accessible (HTTP 200 response)

## Source Prioritization

### Tier 1: Reference Sources (2 sources) ✅
- mangakakalot, mangapark - Already implemented

### Tier 2: High Priority English Sources (16 sources)
- mangadex-dn, mangasee, batoto, mangabuddy, mangahub, mangahere, mangafox, readmangatoday, mangahasu, comicFree, comicsonline, kissmanga, topmanhua, 9manga, muctau, mangareader

### Tier 3: Medium Priority Non-English Sources (18 sources)
- manytoon (18+), Arabic sources (5), Bahasa Indonesia (2), Espanol (5), Italiano (3), Viet (1)

### Tier 4: Low Priority Sources (14 sources)
- Portugues (9), Russia (4), France (3), Deutsch (3)

**Total: 50 sources**

## Implementation Phases

### Phase 1: High Priority English Sources
Implement 16 Tier 2 sources in priority order.

### Phase 2: Popular Non-English Sources
Implement 11 popular non-English sources (MangaDex mirrors + top sites).

### Phase 3: Remaining Sources
Implement remaining 21 sources.

## Documentation

### Created Documentation
- `docs/EXTRACTOR_TEMPLATE.md` - Complete extractor template with examples
- `docs/SOURCE_PRIORITIZATION.md` - Detailed prioritization plan
- `docs/ARCHITECTURE_PLAN.md` - This document
- `memory-bank/systemPatterns.md` - Coding and architectural patterns
- `memory-bank/decisionLog.md` - Architectural decisions

### Memory Bank
- `productContext.md` - Project goals and overview
- `activeContext.md` - Current focus and open questions
- `progress.md` - Task tracking and source status
- `decisionLog.md` - Architectural decisions
- `systemPatterns.md` - Coding patterns and standards

## Key Decisions

1. **Individual Extractor Approach**: No shared utilities - each extractor is self-contained
2. **Standardized Interface**: All extractors implement the same functions
3. **Consistent Output Format**: All parsers return objects with the same structure
4. **Robust Parsing**: Multiple format support with fallback methods
5. **Prioritized Implementation**: Focus on high-priority sources first

## Next Steps

1. **Implement First Source**: Start with mangadex-dn (highest priority)
2. **Test and Validate**: Run test framework to verify implementation
3. **Update Registry**: Add to all_source.json
4. **Continue Implementation**: Work through prioritized sources
5. **Track Progress**: Update memory-bank/progress.md as sources are completed

## Notes

- MangaDex mirrors (mangadex-dn, mangadex-ar, mangadex-es, etc.) likely share similar structure
- 9manga variants (9manga, 9manga_es, 9manga-it, etc.) likely share similar structure
- Sites with "manga" in name often have similar structures to existing implementations
- 18+ sites may have additional requirements (age verification, different content structure)
- Some sites may have anti-scraping measures requiring additional handling
