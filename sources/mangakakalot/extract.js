// MangaKakalot Extractor v1.5.0 (Refactored)

const {
  ensureAbsoluteUrl,
  findBetween,
  extractAttribute,
  cleanText,
  extractImageUrl
} = require('./helpers');
const { createLogger } = require('./logger');

const extractor = {
  id: "mangakakalot",
  name: "MangaKakalot",
  version: "1.5.0",
  baseUrl: "https://www.mangakakalot.gg",
  icon: "https://www.mangakakalot.gg/favicon.ico",
  imageproxy: "",
  imageReferer: "https://www.mangakakalot.gg/",
  debug: true,

  categories: [
    { id: "latest", name: "Latest" },
    { id: "popular", name: "Popular" },
    { id: "completed", name: "Completed" },
    { id: "new", name: "New Series" },
    { id: "genre", name: "Genres" }
  ],

  // Centralized logger
  get logger() {
    if (!this._logger) {
      this._logger = createLogger(this.debug);
    }
    return this._logger;
  },

  // Helper: Make sure URL is absolute
  ensureAbsoluteUrl(url) {
    return ensureAbsoluteUrl(url, this.baseUrl);
  },

  // Helper: Find text between markers
  findBetween(text, start, end) {
    return findBetween(text, start, end);
  },

  // Helper: Extract attribute from HTML tag
  extractAttribute(html, attrName) {
    return extractAttribute(html, attrName);
  },

  // Helper: Clean text content
  cleanText(text) {
    return cleanText(text);
  },

  // Helper: Extract image URL from an image tag
  extractImageUrl(imgTag) {
    return extractImageUrl(imgTag, this.baseUrl, this.logger.log);
  },

  // Get URLs for different manga lists
  getListUrl(type, page = 1) {
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

  // Get URL for search
  getSearchUrl(query, page = 1) {
    return this.baseUrl + "/search/story/" + encodeURIComponent(query) + "?page=" + page;
  },

  // Get URL for genre
  getGenreUrl(genre, page = 1) {
    return this.baseUrl + "/genre/" + encodeURIComponent(genre) + "?page=" + page;
  },

  // Parse manga list from HTML
  parseMangaList(html) {
    try {
      this.logger.log("Starting to parse manga list");
      const items = [];

      // Check page type and extract accordingly
      if (html.includes("list-truyen-item-wrap")) {
        this.logger.log("Detected listing page format");
        const mangaBlocks = html.split('class="list-truyen-item-wrap"');
        for (let i = 1; i < mangaBlocks.length; i++) {
          try {
            const block = mangaBlocks[i];
            const endBlock = block.indexOf('</div>');
            const mangaHtml = block.substring(0, endBlock + 6);

            // Extract cover URL
            let coverUrl = "";
            const imgTags = mangaHtml.match(/<img[^>]*>/g);
            if (imgTags && imgTags.length > 0) {
              coverUrl = this.extractImageUrl(imgTags[0]) || "";
            }

            // Extract manga URL and title
            const urlMatch = mangaHtml.match(/href=["']([^"']*)['"]\s+title=["']([^"']*)["']/i);
            let url = "", title = "";
            if (urlMatch) {
              url = urlMatch[1];
              title = urlMatch[2];
            } else {
              const titleMatch = mangaHtml.match(/<h3>\s*<a\s+href=["']([^"']*)["'][^>]*>(.*?)<\/a>/is);
              if (titleMatch) {
                url = titleMatch[1];
                title = this.cleanText(titleMatch[2]);
              }
            }

            url = this.ensureAbsoluteUrl(url);

            // Extract chapter info
            let lastChapter = "";
            const chapterMatch = mangaHtml.match(/class="list-story-item-wrap-chapter"[^>]*>(.*?)<\/a>/is);
            if (chapterMatch) {
              lastChapter = this.cleanText(chapterMatch[1]);
            }

            // Extract ID from URL
            let id = "";
            if (url) {
              const urlParts = url.split("/");
              id = urlParts[urlParts.length - 1] || "";
              id = id.split("?")[0];
            }

            if (title && url) {
              this.logger.log("Found manga:", title, "with cover:", coverUrl || "none");
              items.push({
                id, title, cover: coverUrl, url, lastChapter
              });
            }
          } catch (e) {
            this.logger.error("Error parsing manga item", e);
          }
        }
      } else if (html.includes("itemupdate")) {
        this.logger.log("Detected homepage or alternative format");
        const mangaBlocks = html.split('class="itemupdate');
        for (let i = 1; i < mangaBlocks.length; i++) {
          try {
            const block = mangaBlocks[i];
            const endBlock = block.indexOf('</div>');
            const mangaHtml = block.substring(0, endBlock + 6);

            // Extract title and URL
            const titleMatch = mangaHtml.match(/<h3>\s*<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/is);
            let title = "", url = "";
            if (titleMatch) {
              url = titleMatch[1];
              title = this.cleanText(titleMatch[2]);
            }

            url = this.ensureAbsoluteUrl(url);

            // Extract cover URL
            let coverUrl = "";
            const imgTags = mangaHtml.match(/<img[^>]*>/g);
            if (imgTags && imgTags.length > 0) {
              coverUrl = this.extractImageUrl(imgTags[0]) || "";
            }

            // Extract chapter info
            let lastChapter = "";
            const chapterMatch = mangaHtml.match(/class="sts[^>]*>(.*?)<\/a>/is);
            if (chapterMatch) {
              lastChapter = this.cleanText(chapterMatch[1]);
            }

            // Extract ID from URL
            let id = "";
            if (url) {
              const urlParts = url.split("/");
              id = urlParts[urlParts.length - 1] || "";
              id = id.split("?")[0];
            }

            if (title && url) {
              this.logger.log("Found manga:", title, "with cover:", coverUrl || "none");
              items.push({
                id, title, cover: coverUrl, url, lastChapter
              });
            }
          } catch (e) {
            this.logger.error("Error parsing manga item", e);
          }
        }
      }

      this.logger.log("Found", items.length, "manga items");
      return { success: true, items };
    } catch (e) {
      this.logger.error("Failed to extract manga list", e);
      return { success: false, error: e.toString(), items: [] };
    }
  },

  // ... (Other methods remain, refactored similarly to use helpers and logger)

};

module.exports = extractor;