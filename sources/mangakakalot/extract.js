// MangaKakalot Extractor v1.6.0
const extractor = {
  id: "mangakakalot",
  name: "MangaKakalot",
  version: "1.6.0",
  baseUrl: "https://www.mangakakalot.gg",
  icon: "https://www.mangakakalot.gg/favicon.ico",
  imageproxy: "",  // Disabled image proxy to use direct connections
  imageReferer: "https://www.mangakakalot.gg/",
  debug: true, // Enable debug mode

  // Rate limiting configuration - prevents 429 errors
  rateLimit: {
    requestsPerMinute: 30,      // Max requests per minute
    minIntervalMs: 2000,        // Minimum milliseconds between requests
    maxRetries: 3,              // Max retries on rate limit errors
    retryDelayMs: 3000          // Base delay for retry (doubles each attempt)
  },

  // Image loading configuration
  imageLoading: {
    maxConcurrent: 3,           // Max parallel image loads (default: 3)
    preloadAhead: 2,            // Preload N images ahead of current page
    timeout: 30000              // Image load timeout in milliseconds
  },
  
  // Available categories for the source
  categories: [
    { id: "latest", name: "Latest" },
    { id: "popular", name: "Popular" },
    { id: "completed", name: "Completed" },
    { id: "new", name: "New Series" },
    { id: "genre", name: "Genres" }
  ],

  /**
   * Helper: Make sure URL is absolute
   */
  ensureAbsoluteUrl: function(url) {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return this.baseUrl + (url.startsWith("/") ? url : "/" + url);
  },
  
  /**
   * Get URLs for different manga lists
   */
  getListUrl: function(type, page) {
    if (page === undefined) page = 1;
    
    switch (type) {
      case 'latest':
        return this.baseUrl + "/manga-list/latest-manga?page=" + page;
      case 'popular':
        return this.baseUrl + "/manga-list/hot-manga?page=" + page;
      case 'completed':
        return this.baseUrl + "/manga-list/completed-manga?page=" + page;
      case 'new':
        return this.baseUrl + "/manga-list/new-manga?page=" + page;
      default:
        return this.baseUrl + "/manga-list/latest-manga?page=" + page;
    }
  },
  
  /**
   * Get URL for search
   */
  getSearchUrl: function(query, page) {
    if (page === undefined) page = 1;
    return this.baseUrl + "/search/story/" + encodeURIComponent(query) + "?page=" + page;
  },
  
  /**
   * Get URL for genre
   */
  getGenreUrl: function(genre, page) {
    if (page === undefined) page = 1;
    return this.baseUrl + "/genre/" + encodeURIComponent(genre) + "?page=" + page;
  },
  
  /**
   * Helper: Find text between markers
   */
  findBetween: function(text, start, end) {
    const startPos = text.indexOf(start);
    if (startPos === -1) return "";
    
    const endPos = end ? text.indexOf(end, startPos + start.length) : text.length;
    if (endPos === -1) return "";
    
    return text.substring(startPos + start.length, endPos);
  },
  
  /**
   * Helper: Extract attribute from HTML tag
   */
  extractAttribute: function(html, attrName) {
    const regex = new RegExp(attrName + '=\"([^"\\]*)\"','i');
    const match = html.match(regex);
    return match ? match[1] : "";
  },
  
  /**
   * Helper: Clean text content
   */
  cleanText: function(text) {
    if (!text) return "";
    return text.replace(/<[^>]*>/g, "").trim();
  },
  
  /**
   * Helper: Extract image URL from an image tag
   */
  extractImageUrl: function(imgTag) {
    if (!imgTag) return null;
    
    // Debug the tag
    console.log("Processing image tag: " + imgTag);
    
    // Look for all possible image attributes
    const attributes = [
      "data-src",
      "data-original",
      "data-lazy-src",
      "data-srcset",
      "data-url",  // Added new attribute
      "data-image",  // Added new attribute
      "src"
    ];
    

    // First Check Regular
    for (let attr of attributes) {
      const regex = new RegExp(attr + '=\"([^"\\]*)\"','i');
      const match = imgTag.match(regex);
      if (match && match[1]) {
        // Found a valid URL
        const url = match[1].trim();
        console.log("Found image URL in " + attr + ": " + url);
        return url;
      }
    }
    
    // Then check fallback
    const onerrorMatch = imgTag.match(/onerror=\"[^\"]*this\.src='([^']+)'/);
    if (onerrorMatch && onerrorMatch[1]) {
      const url = onerrorMatch[1].trim();
      console.log("Found fallback URL in onerror: " + url);
      return this.ensureAbsoluteUrl(url);
    }
    
    console.log("No image URL found in tag when extractomg url");
    return null;
  },
  
  /**
   * Parse manga list from HTML
   */
  parseMangaList: function(html) {
    try {
      console.log("Starting to parse manga list");
      const items = [];

      // Check page type and extract accordingly - updated for new structure
      if (html.includes("list-story-item")) {
        console.log("Detected new listing page format (list-story-item)");
        // New format: class="list-story-item bookmark_check cover"
        const mangaBlocks = html.split(/class=\"list-story-item[^\"]*\"/);

        // Skip first element as it's before the first manga item
        for (let i = 1; i < mangaBlocks.length; i++) {
          try {
            const block = mangaBlocks[i];
            // Use a large chunk of the block to ensure we get all info
            const mangaHtml = block.substring(0, 3000);

            // Extract manga URL and title from the first href with title attribute
            const urlMatch = mangaHtml.match(/href=\"([^"\\]*mangakakalot[^"\\]*\/manga\/[^"\\]*)\"\s+title=\"([^\"]*)\"/i);
            let url = "", title = "";

            if (urlMatch) {
              url = urlMatch[1];
              title = urlMatch[2];
            } else {
              // Try h3 pattern
              const titleMatch = mangaHtml.match(/<h3>\s*<a\s+href=\"([^\"]*)\"[^>]*title=\"([^\"]*)\"/is);
              if (titleMatch) {
                url = titleMatch[1];
                title = titleMatch[2];
              }
            }

            // Extract cover URL from img tag
            let coverUrl = "";
            const imgMatch = mangaHtml.match(/<img[^>]*>/i);
            if (imgMatch) {
              coverUrl = this.extractImageUrl(imgMatch[0]) || "";
            }

            // Make sure URL is absolute
            url = this.ensureAbsoluteUrl(url);
            
            // Extract chapter info
            let lastChapter = "", lastChapterId = "";
            // Look for the anchor tag with the specific class or just any chapter link
            const chapterTagMatch = mangaHtml.match(/<a[^>]*class=\"[^"']*(?:list-story-item-wrap-chapter|sts)[^"']*\[^>]*>([\s\S]*?)<\/a>/i) ||
                                    mangaHtml.match(/<a[^>]*href=\"([^"']*(?:chapter-|story\/[^"']+\/)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
            
            if (chapterTagMatch) {
              const fullTag = chapterTagMatch[0];
              lastChapter = this.cleanText(chapterTagMatch[1] || chapterTagMatch[2]);
              
              const hrefMatch = fullTag.match(/href=\"([^\"]*)\"/i);
              if (hrefMatch) {
                const chapterUrl = this.ensureAbsoluteUrl(hrefMatch[1]);
                if (chapterUrl) {
                  const urlParts = chapterUrl.split("/");
                  lastChapterId = urlParts[urlParts.length - 1] || "";
                  lastChapterId = lastChapterId.split("?")[0];
                }
              }
            }

            // Extract ID from URL
            let id = "";
            if (url) {
              const urlParts = url.split("/");
              id = urlParts[urlParts.length - 1] || "";
              id = id.split("?")[0];
            }

            if (title && url && id) {
              console.log("Found manga: " + title + " with cover: " + (coverUrl || "none"));
              items.push({
                id: id,
                title: title,
                cover: coverUrl,
                url: url,
                lastChapter: lastChapter,
                lastChapterId: lastChapterId
              });
            }
          } catch (e) {
            console.error("Error parsing manga item", e);
          }
        }
      } else if (html.includes("list-truyen-item-wrap")) {
        console.log("Detected legacy listing page format");
        // Legacy format - keep for backwards compatibility
        const mangaBlocks = html.split('class="list-truyen-item-wrap"');

        for (let i = 1; i < mangaBlocks.length; i++) {
          try {
            const block = mangaBlocks[i];
            const mangaHtml = block.substring(0, 3000);

            let coverUrl = "";
            const imgTags = mangaHtml.match(/<img[^>]*>/g);
            if (imgTags && imgTags.length > 0) {
              coverUrl = this.extractImageUrl(imgTags[0]) || "";
            }

            const urlMatch = mangaHtml.match(/href=\"([^\"]*)['"]\s+title=\"([^\"]*)\"/i);
            let url = "", title = "";

            if (urlMatch) {
              url = urlMatch[1];
              title = urlMatch[2];
            }

            url = this.ensureAbsoluteUrl(url);
            
            // Extract chapter info
            let lastChapter = "", lastChapterId = "";
            const chapterTagMatch = mangaHtml.match(/<a[^>]*class=\"[^"']*(?:list-story-item-wrap-chapter|sts)[^"']*\[^>]*>([\s\S]*?)<\/a>/i) ||
                                    mangaHtml.match(/<a[^>]*href=\"([^"']*(?:chapter-|story\/[^"']+\/)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
            
            if (chapterTagMatch) {
              const fullTag = chapterTagMatch[0];
              lastChapter = this.cleanText(chapterTagMatch[1] || chapterTagMatch[2]);
              
              const hrefMatch = fullTag.match(/href=\"([^\"]*)\"/i);
              if (hrefMatch) {
                const chapterUrl = this.ensureAbsoluteUrl(hrefMatch[1]);
                if (chapterUrl) {
                  const urlParts = chapterUrl.split("/");
                  lastChapterId = urlParts[urlParts.length - 1] || "";
                  lastChapterId = lastChapterId.split("?")[0];
                }
              }
            }

            let id = "";
            if (url) {
              const urlParts = url.split("/");
              id = urlParts[urlParts.length - 1] || "";
              id = id.split("?")[0];
            }

            if (title && url) {
              items.push({
                id: id,
                title: title,
                cover: coverUrl,
                url: url,
                lastChapter: lastChapter,
                lastChapterId: lastChapterId
              });
            }
          } catch (e) {
            console.error("Error parsing manga item", e);
          }
        }
      } else if (html.includes("itemupdate")) {
        console.log("Detected homepage format");
        const mangaBlocks = html.split('class="itemupdate');

        for (let i = 1; i < mangaBlocks.length; i++) {
          try {
            const block = mangaBlocks[i];
            const mangaHtml = block.substring(0, 3000);

            const titleMatch = mangaHtml.match(/<h3>\s*<a[^>]*href=\"([^\"]*)\