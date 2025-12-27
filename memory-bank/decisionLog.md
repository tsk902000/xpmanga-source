# Decision Log

This file records architectural and implementation decisions using a list format.
2025-12-27 12:54:03 - Log of updates made.
2025-12-27 12:55:56 - Updated with extractor architecture decisions.

*

## Decision

Memory Bank initialized for the xpmanga extractor project

## Rationale

To maintain project context across sessions and ensure consistent development workflow for building JavaScript extractors for 50+ manga sources.

## Implementation Details

Created memory-bank/ directory with five core files: productContext.md, activeContext.md, progress.md, decisionLog.md, and systemPatterns.md

---

## Decision

Standardized Extractor Architecture

## Rationale

To ensure consistency across 50+ manga source extractors and simplify maintenance, a standardized architecture is required based on analysis of existing mangakakalot and mangapark extractors.

## Implementation Details

**Extractor Object Structure:**
- Each source has its own directory under `sources/`
- Contains `extract.js` (main logic) and `meta.json` (metadata)
- Optional files: `helpers.js`, `logger.js`, `fallback_images.json`

**Core Parser Functions:**
- `parseMangaList(html)`: Extract manga items from list pages
- `parseMangaDetails(html)`: Extract manga details and chapter list
- `parseChapterImages(html)`: Extract image URLs from chapter pages

**Standard Output Format:**
- All parsers return `{success: boolean, ...}` objects
- Consistent data structures across all sources

**Testing Strategy:**
- Generic test framework (`debug/test_generic_extractor.js`)
- Tests all three parser functions
- Validates output against expected format
- Checks image accessibility

---

## Decision

Individual Extractor Architecture (No Shared Utilities)

## Rationale

Each manga source has unique HTML structure and parsing requirements. Creating shared utilities would add unnecessary complexity. Each extractor should be self-contained and independent.

## Implementation Details

**Architecture Principles:**
- Each extractor is a standalone `extract.js` file
- No shared utilities library - each extractor includes its own helper functions
- Extractors can reference existing implementations (mangakakalot, mangapark) for patterns
- Optional per-source files: `helpers.js`, `logger.js`, `fallback_images.json` (as needed)

**Benefits:**
- Simpler architecture - no dependencies between extractors
- Easier to maintain - each extractor can be updated independently
- More flexible - each source can use custom parsing logic
- Faster to implement - no need to design and maintain shared code

---

## Decision

Implementation Prioritization Strategy

## Rationale

With 50+ sources to implement, a prioritization strategy is needed to focus on the most important sources first.

## Implementation Details

**Priority Tiers:**
1. **Tier 1 (Reference)**: Already implemented (mangakakalot, mangapark) - serve as reference
2. **Tier 2 (High Priority)**: Popular English sources (mangadex-dn, mangasee, batoto, mangabuddy, mangahub)
3. **Tier 3 (Medium Priority)**: Other English sources and popular non-English sources
4. **Tier 4 (Low Priority)**: Less popular sources

**Implementation Approach:**
1. Create extractor template as reference documentation
2. Implement extractors in priority order
3. Test each extractor before moving to next
4. Update all_source.json as each is completed
5. Document any unique patterns discovered per source

---

## Decision

MangaPark Extractor Implementation Completed

## Rationale

MangaPark extractor was implemented as the second reference source for the xpmanga project. The extractor follows the standardized architecture and includes all required parsing functions for manga lists, manga details, chapter images, and genres.

## Implementation Details

**Files Created:**
- `sources/mangapark/extract.js` - Main extractor logic (v1.0.0)
- `sources/mangapark/meta.json` - Source metadata
- `sources/mangapark/example-homepage.html` - Sample HTML for testing
- `sources/mangapark/example-manga-details.html` - Sample HTML for testing
- `sources/mangapark/example-chapter-page.html` - Sample HTML for testing
- `debug/test_mangapark_extractor.js` - Live test script
- `debug/test_mangapark_local.js` - Local test script

**Features Implemented:**
- `parseMangaList()` - Extracts manga items from browse pages
- `parseMangaDetails()` - Extracts manga details including title, cover, description, author, status, genres, and chapters
- `parseChapterImages()` - Extracts image URLs from chapter pages with multiple container support
- `parseGenres()` - Extracts available genres
- URL builders for list, search, and genre pages

**Testing Results:**
- Local tests: ALL PASSED (2 items, 1 chapter, 5 images)
- Note: Live testing encounters 403 errors due to anti-bot protection on mangapark.net

**Updated Files:**
- `all_source.json` - Added mangapark source entry

**Status:** Completed and ready for use

---

## Decision

Webpage Analyzer Tool Creation

## Rationale

To streamline the process of understanding new manga website structures for extractor development, a dedicated tool was needed to download HTML from URLs and analyze it for patterns, selectors, and structure.

## Implementation Details

**Files Created:**
- `tools/webpage_analyzer.js` - Main tool script
- `tools/README.md` - Documentation and usage guide

**Features Implemented:**
- `download` command - Fetches HTML from URLs with automatic redirect handling
- `analyze` command - Provides basic analysis (file info, element counts, pattern detection)
- `selectors` command - Finds CSS selectors matching specific patterns
- `images` command - Extracts all image URLs with their attributes
- `links` command - Extracts all links with their anchor text
- `structure` command - Identifies containers, lists, pagination, and navigation elements

**Technical Details:**
- Supports HTTP and HTTPS protocols
- Handles gzip and deflate encoding
- Uses realistic User-Agent header for better compatibility
- 30-second timeout for requests
- Automatic redirect following
- Colorized terminal output for better readability

**Usage Workflow:**
1. Download HTML from manga website
2. Analyze basic structure and element counts
3. Search for relevant selectors (manga, chapter, item, etc.)
4. Extract images to understand lazy loading patterns
5. Analyze structure to identify containers and lists
6. Use findings to create the extractor

**Benefits:**
- Faster extractor development with automated analysis
- Consistent workflow for all new sources
- Reduces manual HTML inspection time
- Helps identify common patterns across sources
- Provides sample HTML files for testing

---

## Decision

Enhanced Webpage Analyzer Tool for Cloudflare/Anti-Bot Protection

## Rationale

Many manga websites use Cloudflare or other anti-bot protection that blocks simple HTTP requests with 403 Forbidden errors. The tool needed to be enhanced to provide guidance and alternatives for handling these protected sites.

## Implementation Details

**Enhancements Made:**
- Added `download-browser` command that provides instructions for manual browser-based downloads
- Enhanced HTTP headers to be more realistic (added Sec-Fetch headers, DNT, Cache-Control)
- Added specific 403 error handling with helpful suggestions
- Provided alternative download methods (curl with browser headers, manual browser save)

**Technical Details:**
- Added browser-like headers: Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site, Sec-Fetch-User
- Added DNT (Do Not Track) header
- Added Cache-Control header
- Improved error messaging for 403 responses
- Provided curl command template for alternative downloads

**User Guidance:**
When encountering 403 errors, users can:
1. Use `download-browser` command for manual download instructions
2. Manually save HTML from browser after passing Cloudflare challenges
3. Use curl with browser headers as an alternative
