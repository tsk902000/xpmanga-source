# Extractor For Manga Sources

This is a javascript extractor tool that extracts manga from sources for xpmanga.

`all_source.json` has all source list meta data path.

## Testing Extractors

The extractor is something to test the javascript that extracts the correct format

```
node debug/test_generic_extractor.js
```

The correct output should look like:
```
debug/correct_output_test_results.json
```

## Webpage Analyzer Tool

A command-line utility for downloading and analyzing HTML from manga websites. This tool helps developers understand the structure of manga websites when creating new extractors.

### Features

- **Download HTML**: Fetch and save HTML from any URL
- **Basic Analysis**: Get file info, element counts, and detect common patterns
- **Selector Search**: Find CSS selectors matching specific patterns
- **Image Extraction**: Extract all image URLs with their attributes
- **Link Extraction**: Extract all links with their anchor text
- **Structure Analysis**: Identify containers, lists, pagination, and navigation elements

### Usage

```bash
# Download HTML from a URL
node tools/webpage_analyzer.js download <url> [output-file]

# Download HTML from Cloudflare/anti-bot protected sites
node tools/webpage_analyzer.js download-browser <url> [output-file]

# Analyze an HTML file
node tools/webpage_analyzer.js analyze <html-file>

# Find CSS selectors matching a pattern
node tools/webpage_analyzer.js selectors <html-file> <pattern>

# Extract all images from HTML
node tools/webpage_analyzer.js images <html-file>

# Extract all links from HTML
node tools/webpage_analyzer.js links <html-file>

# Analyze HTML structure
node tools/webpage_analyzer.js structure <html-file>
```

### Examples

```bash
# Download a manga homepage
node tools/webpage_analyzer.js download https://example.com sources/example/homepage.html

# Download from Cloudflare/anti-bot protected sites
node tools/webpage_analyzer.js download-browser https://example.com sources/example/homepage.html

# Analyze the downloaded file
node tools/webpage_analyzer.js analyze sources/example/homepage.html

# Find selectors containing "manga"
node tools/webpage_analyzer.js selectors sources/example/homepage.html manga

# Extract all images
node tools/webpage_analyzer.js images sources/example/homepage.html

# Analyze structure for containers, lists, pagination
node tools/webpage_analyzer.js structure sources/example/homepage.html
```

### Handling Cloudflare/Anti-Bot Protection

Some manga websites use Cloudflare or other anti-bot protection that blocks simple HTTP requests. When you encounter a **403 Forbidden** error:

1. **Use the `download-browser` command** - This provides instructions for manually downloading the HTML using your browser.
2. **Manual Browser Download** - Open the URL in your browser, wait for the page to load, and save the HTML.
3. **Alternative: Use curl with browser headers** - See [`tools/README.md`](tools/README.md) for details.

For more detailed documentation, see [`tools/README.md`](tools/README.md).


# Test Cases to add
1. Load Next page.
2. Search feature.


# Supported Sites

```
listed in `support_manga_source.md`
```
