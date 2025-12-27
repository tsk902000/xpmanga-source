# Tools Directory

This directory contains utility tools for the xpmanga extractor project.

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
node tools/webpage_analyzer.js download https://mangakakalot.com sources/mangakakalot/example-homepage.html

# Download from Cloudflare/anti-bot protected sites
node tools/webpage_analyzer.js download-browser https://mangapark.net sources/mangapark/example-homepage.html

# Analyze the downloaded file
node tools/webpage_analyzer.js analyze sources/mangakakalot/example-homepage.html

# Find selectors containing "manga"
node tools/webpage_analyzer.js selectors sources/mangakakalot/example-homepage.html manga

# Find selectors containing "chapter"
node tools/webpage_analyzer.js selectors sources/mangakakalot/example-homepage.html chapter

# Extract all images
node tools/webpage_analyzer.js images sources/mangakakalot/example-homepage.html

# Extract all links
node tools/webpage_analyzer.js links sources/mangakakalot/example-homepage.html

# Analyze structure for containers, lists, pagination
node tools/webpage_analyzer.js structure sources/mangakakalot/example-homepage.html
```

### Handling Cloudflare/Anti-Bot Protection

Some manga websites use Cloudflare or other anti-bot protection that blocks simple HTTP requests. When you encounter a **403 Forbidden** error:

1. **Use the `download-browser` command**:
   ```bash
   node tools/webpage_analyzer.js download-browser <url> [output-file]
   ```
   This provides instructions for manually downloading the HTML using your browser.

2. **Manual Browser Download**:
   - Open the URL in your browser
   - Wait for the page to fully load (pass any Cloudflare challenges)
   - Right-click and select "Save Page As..." or use DevTools to copy the HTML
   - Save it to your `sources/` directory

3. **Alternative: Use curl with browser headers**:
   ```bash
   curl -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
        -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
        -L "<url>" > output.html
   ```

### Workflow for Creating a New Extractor

1. **Download the HTML** from the manga source:
   ```bash
   node tools/webpage_analyzer.js download https://example.com sources/example/homepage.html
   ```

2. **Analyze the basic structure**:
   ```bash
   node tools/webpage_analyzer.js analyze sources/example/homepage.html
   ```

3. **Find relevant selectors**:
   ```bash
   node tools/webpage_analyzer.js selectors sources/example/homepage.html manga
   node tools/webpage_analyzer.js selectors sources/example/homepage.html chapter
   node tools/webpage_analyzer.js selectors sources/example/homepage.html item
   ```

4. **Check image handling**:
   ```bash
   node tools/webpage_analyzer.js images sources/example/homepage.html
   ```

5. **Analyze structure** for containers and lists:
   ```bash
   node tools/webpage_analyzer.js structure sources/example/homepage.html
   ```

6. Use the identified selectors and patterns to create the extractor in `sources/example/extract.js`

### Output Examples

#### Basic Analysis
```
🔍 HTML Analysis

📊 Analysis Results

File Info:
  Size: 45.23 KB
  Title: MangaKakalot - Read Manga Online
  Charset: utf-8
  Has DOCTYPE: Yes

Element Counts:
  <div>: 234
  <a>: 156
  <img>: 45
  <span>: 189
  <li>: 78
  <script>: 12
  <link>: 8

Patterns Detected:
  hasLazyLoading: ✓
  hasDataAttributes: ✓
  hasJsonLd: ✗
  hasJsonData: ✓
  hasPagination: ✓
```

#### Selector Search
```
🔎 Finding selectors matching: manga

📊 Found 15 unique selectors

Selectors:
  .manga-item
  .manga-list
  .manga-cover
  .manga-title
  #manga-container
  ...
```

#### Image Extraction
```
🖼️  Image Analysis

📊 Found 45 images (42 unique)

Sample Images:
  1. https://example.com/covers/manga1.jpg
     class="manga-cover lazy"
  2. https://example.com/covers/manga2.jpg
     class="manga-cover lazy"
  ...
```

### Notes

- The tool follows redirects automatically
- Supports gzip and deflate encoding
- Uses a realistic User-Agent header
- Timeout is set to 30 seconds
- Large outputs are truncated for readability
