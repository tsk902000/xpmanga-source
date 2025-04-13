<<<<<<< HEAD
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
=======
// MangaKakalot Extractor v1.4.0
const extractor = {
    id: "mangakakalot",
    name: "MangaKakalot",
    version: "1.4.0",
    baseUrl: "https://www.mangakakalot.gg",
    icon: "https://www.mangakakalot.gg/favicon.ico",
    imageproxy: "",  // Disabled image proxy to use direct connections
    imageReferer: "https://www.mangakakalot.gg/",
    debug: true, // Enable debug mode
    
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
      const regex = new RegExp(attrName + '=["\']([^"\']*)["\']', 'i');
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
      
      // First check for onerror attribute which might contain the fallback URL
      const onerrorMatch = imgTag.match(/onerror="[^"]*this\.src='([^']+)'/);
      if (onerrorMatch && onerrorMatch[1]) {
        const url = onerrorMatch[1].trim();
        console.log("Found fallback URL in onerror: " + url);
        return this.ensureAbsoluteUrl(url);
      }
      
      // Then check regular attributes
      for (let attr of attributes) {
        const regex = new RegExp(attr + '=["\'](https?://[^"\']+)["\']', 'i');
        const match = imgTag.match(regex);
        if (match && match[1]) {
          // Found a valid URL
          const url = match[1].trim();
          console.log("Found image URL in " + attr + ": " + url);
          return url;
        }
      }
      
      // For relative URLs
      for (let attr of attributes) {
        const regex = new RegExp(attr + '=["\'](/[^"\']+)["\']', 'i');
        const match = imgTag.match(regex);
        if (match && match[1]) {
          // Convert relative URL to absolute
          const url = this.baseUrl + match[1].trim();
          console.log("Found relative image URL in " + attr + ", converted to: " + url);
          return `https://image-proxy.kai902000.workers.dev/?url=` + url + `&referrer=${this.imageReferer}`;
        }
      }
      
      console.log("No image URL found in tag");
      return null;
    },
    
    /**
     * Parse manga list from HTML
     */
    parseMangaList: function(html) {
      try {
        console.log("Starting to parse manga list");
        const items = [];
        
        // Check page type and extract accordingly
        if (html.includes("list-truyen-item-wrap")) {
          console.log("Detected listing page format");
          // Category/listing page format
          const mangaBlocks = html.split('class="list-truyen-item-wrap"');
          
          // Skip first element as it's before the first manga item
          for (let i = 1; i < mangaBlocks.length; i++) {
            try {
              const block = mangaBlocks[i];
              const endBlock = block.indexOf('</div>');
              const mangaHtml = block.substring(0, endBlock + 6);
              
              // Extract cover URL - more specific to target the cover image
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
                // Try again with different pattern
                const titleMatch = mangaHtml.match(/<h3>\s*<a\s+href=["']([^"']*)["'][^>]*>(.*?)<\/a>/is);
                if (titleMatch) {
                  url = titleMatch[1];
                  title = this.cleanText(titleMatch[2]);
                }
              }
              
              // Make sure URL is absolute
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
                console.log("Found manga: " + title + " with cover: " + (coverUrl || "none"));
                items.push({
                  id: id,
                  title: title,
                  cover: coverUrl,
                  url: url,
                  lastChapter: lastChapter
                });
              }
            } catch (e) {
              console.error("Error parsing manga item", e);
>>>>>>> parent of 1249653 (Update extract.js)
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
<<<<<<< HEAD
      } else if (html.includes("itemupdate")) {
        this.logger.log("Detected homepage or alternative format");
        const mangaBlocks = html.split('class="itemupdate');
        for (let i = 1; i < mangaBlocks.length; i++) {
=======
        
        // Extract chapters with improved method
        console.log("Extracting chapters with updated method");
        const chapters = [];
        
        // Look for the chapter-list container first
        const chapterListMatch = html.match(/<div class="chapter-list">([\s\S]*?)<\/div>\s*(?:<\/div>|$)/i);
        if (chapterListMatch) {
          const chapterListHtml = chapterListMatch[1];
          console.log("Found chapter-list container with length: " + chapterListHtml.length);
          
          // Define a more precise regex pattern to match all chapter rows
          const chapterRowPattern = /<div class="row">\s*<span><a href="([^"]+)" title="([^"]+)">([^<]+)<\/a><\/span>\s*<span>[^<]*<\/span>\s*<span[^>]*>([^<]+)<\/span>\s*<\/div>/g;
          
          // Find all matches in the chapter list HTML
          const matches = [...chapterListHtml.matchAll(chapterRowPattern)];
          console.log(`Found ${matches.length} chapters with updated regex`);
          
          // Process each match
          for (const match of matches) {
            try {
              const chapterUrl = this.ensureAbsoluteUrl(match[1]);
              const fullTitle = match[2]; // From title attribute
              const displayTitle = match[3]; // From inner text
              const date = match[4].trim();
              
              // Extract chapter ID from URL
              let chapterId = "";
              if (chapterUrl) {
                const urlParts = chapterUrl.split("/");
                chapterId = urlParts[urlParts.length - 1] || "";
                chapterId = chapterId.split("?")[0];
              }
              
              // Extract chapter number from title with improved regex
              let chapterNumber = 0; // Default
              const numberMatch = displayTitle.match(/Chapter\s+(\d+(\.\d+)?)/i);
              if (numberMatch) {
                chapterNumber = parseFloat(numberMatch[1]);
              } else {
                // Try alternative formats like "Ch.X" or just a number
                const altMatch = displayTitle.match(/Ch\.\s*(\d+(\.\d+)?)/i) ||
                                displayTitle.match(/(\d+(\.\d+)?)/);
                if (altMatch) {
                  chapterNumber = parseFloat(altMatch[1]);
                } else {
                  chapterNumber = chapters.length + 1; // Fallback to position
                }
              }
            
              console.log(`Found chapter: ${displayTitle} (${chapterNumber}) - ${date}`);
              
              chapters.push({
                id: chapterId,
                number: chapterNumber,
                title: displayTitle,
                url: chapterUrl,
                date: date
              });
            } catch (e) {
              console.error("Error parsing chapter:", e);
            }
          }
        }
        
        // If no chapters found with direct method, try fallback
        if (chapters.length === 0) {
          console.log("No chapters found with direct method, trying fallback...");
          
          // Fallback: Look for any links containing "chapter" in the URL or text
          const chapterLinkPattern = /<a[^>]*href="([^"]*chapter[^"]*)"[^>]*>(.*?)<\/a>/gi;
          const linkMatches = [...html.matchAll(chapterLinkPattern)];
          
          for (const match of linkMatches) {
            try {
              const chapterUrl = this.ensureAbsoluteUrl(match[1]);
              const chapterTitle = this.cleanText(match[2]);
              
              // Extract ID from URL
              let chapterId = "";
              if (chapterUrl) {
                const urlParts = chapterUrl.split("/");
                chapterId = urlParts[urlParts.length - 1] || "";
                chapterId = chapterId.split("?")[0];
              }
              
              // Extract chapter number from title
              let chapterNumber = 0;
              const numberMatch = chapterTitle.match(/chapter\s+(\d+(\.\d+)?)/i);
              if (numberMatch) {
                chapterNumber = parseFloat(numberMatch[1]);
              } else {
                chapterNumber = linkMatches.indexOf(match) + 1; // Fallback to position
              }
              
              console.log(`Found fallback chapter: ${chapterTitle} (${chapterNumber})`);
              
              chapters.push({
                id: chapterId,
                number: chapterNumber,
                title: chapterTitle,
                url: chapterUrl,
                date: ""
              });
            } catch (e) {
              console.error("Error parsing fallback chapter:", e);
            }
          }
        }
        
        // If still no chapters, add a debug chapter
        if (chapters.length === 0) {
          console.warn("No chapters found with any method. Adding debug chapter.");
          chapters.push({
            id: "debug-chapter",
            number: 1,
            title: "Debug Chapter (No chapters found)",
            url: this.baseUrl + "/debug-chapter",
            date: new Date().toISOString()
          });
        }
        
        // Sort chapters by number, descending (newest first)
        chapters.sort((a, b) => b.number - a.number);
        console.log(`Processed ${chapters.length} total chapters`);
        
        console.log("Successfully extracted manga details");
        return {
          success: true,
          manga: {
            title: title,
            cover: coverUrl,
            description: description,
            author: author,
            status: status,
            genres: genres,
            chapters: chapters
          }
        };
      } catch (e) {
        console.error("Failed to extract manga details", e);
        return { success: false, error: e.toString(), manga: null };
      }
    },
    /**
     * Parse chapter images from HTML
     */
    parseChapterImages: function(html) {
      try {
        console.log("Starting to parse chapter images");
        console.log("HTML length: " + html.length);
        
        // Log a sample of the HTML for debugging
        console.log("HTML sample: " + html.substring(0, 500) + "...");
        
        const images = [];
        
        // Updated container patterns based on current MangaKakalot HTML structure
        const possibleContainers = [
          'class="container-chapter-reader"',
          'class="reading-content"',
          'id="vung-doc"',
          'class="page-break"',
          'class="show-full-text"',
          'class="chapter-content"',  // Added new potential container
          'class="chapter-images"'    // Added new potential container
        ];
        
        // Log which containers we're looking for
        console.log("Searching for containers: " + JSON.stringify(possibleContainers));
        
        let foundReader = false;
        
        // Try each possible container
        for (const container of possibleContainers) {
          if (html.includes(container)) {
            console.log("Found reader container: " + container);
            foundReader = true;
            
            // Find the start of the container
            let searchStart = 0;
            let containerStartIndex;
            
            // Look for all instances of this container (some sites have multiple containers)
            while ((containerStartIndex = html.indexOf(container, searchStart)) !== -1) {
              const readerStart = containerStartIndex;
              // Find the end of the div - be more careful about possible nested divs
              let readerEnd = containerStartIndex;
              let divCount = 1;  // Start with 1 for the opening div
              
              // Scan forward to find the matching closing div
              for (let i = readerStart + container.length; i < html.length; i++) {
                // Count opening divs
                if (html.substr(i, 4) === '<div') {
                  divCount++;
                }
                // Count closing divs
                else if (html.substr(i, 6) === '</div>') {
                  divCount--;
                  // Found matching div
                  if (divCount === 0) {
                    readerEnd = i + 6;
                    break;
                  }
                }
              }
              
              // Extract the content of this container
              const readerContent = html.substring(readerStart, readerEnd);
              console.log("Found reader content block: " + readerContent.length + " characters");
              console.log("Reader content sample: " + readerContent.substring(0, 200) + "...");
              
              // Find all image tags
              const imgMatches = readerContent.match(/<img[^>]*>/g);
              
              if (imgMatches && imgMatches.length > 0) {
                console.log("Found " + imgMatches.length + " image tags in this container");
                console.log("First image tag: " + imgMatches[0]);
                
                imgMatches.forEach(imgTag => {
                  const imageUrl = this.extractImageUrl(imgTag);
                  
                  // Filter out logos, ads, and other non-manga images
                  if (imageUrl &&
                     !imageUrl.includes("logo") &&
                     !imageUrl.includes("banner") &&
                     !imageUrl.includes("ad_") &&
                     !imageUrl.includes("ads_") &&
                     !imageUrl.includes("icon")) {
                    
                    // Skip duplicates
                    if (!images.includes(imageUrl)) {
                      console.log("Adding image URL: " + imageUrl.substring(0, 50) + "...");
                      images.push(imageUrl);
                    }
                  }
                });
              } else {
                console.log("No image tags found in this container");
              }
              
              // Move to the next possible container instance
              searchStart = readerEnd;
            }
          }
        }
        
        // If no reader containers found, try a more generic approach to find all images
        if (!foundReader || images.length === 0) {
          console.log("No standard reader containers found, trying alternative approach");
          
          // Find all image tags in the document that look like manga pages
          const allImgTags = html.match(/<img[^>]*>/g) || [];
          console.log("Found " + allImgTags.length + " total image tags");
          
          // Look for images that are likely manga pages
          allImgTags.forEach(imgTag => {
            // Check for common manga image indicators
            if (imgTag.includes('data-src') ||
                imgTag.includes('loading="lazy"') ||
                imgTag.includes('class="chapter-img"') ||
                imgTag.includes('class="page"') ||
                imgTag.includes('alt="page"') ||  // Added new indicator
                imgTag.includes('onerror="this.onerror=null;this.src=')) {  // Added new indicator for fallback images
              
              const imageUrl = this.extractImageUrl(imgTag);
              
              if (imageUrl &&
                 !imageUrl.includes("logo") &&
                 !imageUrl.includes("banner") &&
                 !imageUrl.includes("ad_")) {
                
                // Skip duplicates
                if (!images.includes(imageUrl)) {
                  console.log("Adding fallback image URL: " + imageUrl.substring(0, 50) + "...");
                  images.push(imageUrl);
                }
              }
            }
          });
        }
        
        // Check specifically for the onerror pattern which is common in MangaKakalot
        if (images.length === 0) {
          console.log("Checking specifically for onerror pattern");
          const onerrorRegex = /onerror="this\.onerror=null;this\.src='([^']+)';"/g;
          let match;
          
          while ((match = onerrorRegex.exec(html)) !== null) {
            const imageUrl =   `https://image-proxy.kai902000.workers.dev/?url=` + this.ensureAbsoluteUrl(match[1]) + `&referrer=${this.imageReferer}`;
            
            if (imageUrl && !images.includes(imageUrl)) {
              console.log("Adding onerror fallback URL: " + imageUrl.substring(0, 50) + "...");
              images.push(imageUrl);
            }
          }
        }
        
        // Final check - if we still have no images, try a very generic approach
        if (images.length === 0) {
          console.log("No images found with standard methods, trying last-resort approach");
          
          // Just get all image tags that have a src or data-src attribute
          const lastResortRegex = /<img[^>]+(?:src|data-src)=['"]([^'"]+\.(?:jpg|jpeg|png|webp))['"]/gi;
          let match;
          
          while ((match = lastResortRegex.exec(html)) !== null) {
            const imageUrl = this.ensureAbsoluteUrl(match[1]);
            
            if (imageUrl &&
               !imageUrl.includes("logo") &&
               !images.includes(imageUrl)) {
              console.log("Adding last-resort image URL: " + imageUrl.substring(0, 50) + "...");
              images.push(imageUrl);
            }
          }
        }
        
        console.log("Found total of " + images.length + " chapter images");
        
        // Sort images if they contain numbered filenames
        if (images.length > 1) {
>>>>>>> parent of 1249653 (Update extract.js)
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