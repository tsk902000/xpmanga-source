// MangaKakalot Extractor v1.7.0
var extractor = {
  id: "mangakakalot",
  name: "MangaKakalot",
  version: "1.7.0",
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
    

    // First Check Regular
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
    
    // Then check fallback
    const onerrorMatch = imgTag.match(/onerror="[^"]*this\.src='([^']+)'/);
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
        const mangaBlocks = html.split(/class=["']list-story-item(?:\s[^"']*)?["']/);

        // Skip first element as it's before the first manga item
        for (let i = 1; i < mangaBlocks.length; i++) {
          try {
            const block = mangaBlocks[i];
            // Use a large chunk of the block to ensure we get all info
            const mangaHtml = block.substring(0, 10000);

            // Extract manga URL and title from the first href with title attribute
            const urlMatch = mangaHtml.match(/href=["']([^"']*mangakakalot[^"']*\/manga\/[^"']*)["']\s+title=["']([^"']*)["']/i);
            let url = "", title = "";

            if (urlMatch) {
              url = urlMatch[1];
              title = urlMatch[2];
            } else {
              // Try h3 pattern
              const titleMatch = mangaHtml.match(/<h3>\s*<a\s+href=["']([^"']*)["'][^>]*title=["']([^"']*)["']/is);
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
            const chapterTagMatch = mangaHtml.match(/<a[^>]*class=["'][^"']*(?:list-story-item-wrap-chapter|sts)[^"']*["'][^>]*>([\s\S]*?)<\/a>/i) ||
                                    mangaHtml.match(/<a[^>]*href=["']([^"']*(?:chapter-|story\/[^"']+\/)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
            
            if (chapterTagMatch) {
              const fullTag = chapterTagMatch[0];
              // Prefer Group 2 (text content from URL-based regex) over Group 1 (text content from class-based regex)
              lastChapter = this.cleanText(chapterTagMatch[2] || chapterTagMatch[1]);
              
              const hrefMatch = fullTag.match(/href=["']([^"']*)["']/i);
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
            const mangaHtml = block.substring(0, 10000);

            let coverUrl = "";
            const imgTags = mangaHtml.match(/<img[^>]*>/g);
            if (imgTags && imgTags.length > 0) {
              coverUrl = this.extractImageUrl(imgTags[0]) || "";
            }

            const urlMatch = mangaHtml.match(/href=["']([^"']*)["']\s+title=["']([^"']*)["']/i);
            let url = "", title = "";

            if (urlMatch) {
              url = urlMatch[1];
              title = urlMatch[2];
            }

            url = this.ensureAbsoluteUrl(url);
            
            // Extract chapter info
            let lastChapter = "", lastChapterId = "";
            const chapterTagMatch = mangaHtml.match(/<a[^>]*class=["'][^"']*(?:list-story-item-wrap-chapter|sts)[^"']*["'][^>]*>([\s\S]*?)<\/a>/i) ||
                                    mangaHtml.match(/<a[^>]*href=["']([^"']*(?:chapter-|story\/[^"']+\/)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
            
            if (chapterTagMatch) {
              const fullTag = chapterTagMatch[0];
              lastChapter = this.cleanText(chapterTagMatch[2] || chapterTagMatch[1]);
              
              const hrefMatch = fullTag.match(/href=["']([^"']*)["']/i);
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
      } else if (html.includes("story_item")) {
        // Search page format: <div class="story_item">
        console.log("Detected search page format (story_item)");
        const mangaBlocks = html.split(/class=["']story_item["']/);

        for (let i = 1; i < mangaBlocks.length; i++) {
          try {
            const block = mangaBlocks[i];
            const mangaHtml = block.substring(0, 3000);

            // Extract cover from first img tag
            let coverUrl = "";
            const imgMatch = mangaHtml.match(/<img[^>]*>/i);
            if (imgMatch) {
              coverUrl = this.extractImageUrl(imgMatch[0]) || "";
            }

            // Extract title and URL from h3.story_name > a
            let url = "", title = "";
            const titleMatch = mangaHtml.match(/<h3[^>]*class=["']story_name["'][^>]*>[\s\S]*?<a[^>]*href=["']([^"']*)["'][^>]*>([^<]*)<\/a>/i);
            if (titleMatch) {
              url = titleMatch[1];
              title = this.cleanText(titleMatch[2]);
            }

            // Extract latest chapter from em.story_chapter > a
            let lastChapter = "", lastChapterId = "";
            const chapterMatch = mangaHtml.match(/<em[^>]*class=["']story_chapter["'][^>]*>[\s\S]*?<a[^>]*href=["']([^"']*)["'][^>]*title=["']([^"']*)["'][^>]*>/i);
            if (chapterMatch) {
              const chapterUrl = chapterMatch[1];
              lastChapter = chapterMatch[2];
              // Extract chapter ID from URL
              if (chapterUrl) {
                const urlParts = chapterUrl.split("/");
                lastChapterId = urlParts[urlParts.length - 1] || "";
                lastChapterId = lastChapterId.split("?")[0];
              }
            }

            // Make sure URL is absolute
            url = this.ensureAbsoluteUrl(url);

            // Extract ID from URL
            let id = "";
            if (url) {
              const urlParts = url.split("/");
              id = urlParts[urlParts.length - 1] || "";
              id = id.split("?")[0];
            }

            if (title && url && id) {
              console.log("Found manga: " + title);
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
            console.error("Error parsing search item", e);
          }
        }
      } else if (html.includes("itemupdate")) {
        console.log("Detected homepage format");
        const mangaBlocks = html.split('class="itemupdate');

        for (let i = 1; i < mangaBlocks.length; i++) {
          try {
            const block = mangaBlocks[i];
            const mangaHtml = block.substring(0, 10000);

            const titleMatch = mangaHtml.match(/<h3>\s*<a[^>]*href=\"([^\"]*)\"[^>]*title=\"([^\"]*)\"/i);
            let url = "", title = "";

            if (titleMatch) {
              url = titleMatch[1];
              title = titleMatch[2];
            }

            // Extract cover URL from img tag
            let coverUrl = "";
            const imgMatch = mangaHtml.match(/<img[^>]*>/i);
            if (imgMatch) {
              coverUrl = this.extractImageUrl(imgMatch[0]) || "";
            }

            url = this.ensureAbsoluteUrl(url);

            // Extract chapter info
            let lastChapter = "", lastChapterId = "";
            const chapterTagMatch = mangaHtml.match(/<a[^>]*class=\"sts\"[^>]*>([\s\S]*?)<\/a>/i);
            
            if (chapterTagMatch) {
              lastChapter = this.cleanText(chapterTagMatch[1]);
              const hrefMatch = chapterTagMatch[0].match(/href=["']([^"']*)["']/i);
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
      }

      console.log("Found " + items.length + " manga items");
      return { success: true, items: items };
    } catch (e) {
      console.error("Failed to extract manga list", e);
      return { success: false, error: e.toString(), items: [] };
    }
  },
  
  /**
   * Parse manga details from HTML
   */
  parseMangaDetails: function(html) {
    try {
      console.log("Starting to parse manga details");
      
      // Extract title
      let title = "";
      const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
      if (titleMatch) {
        title = this.cleanText(titleMatch[1]);
      }
      
      // Extract cover
      let coverUrl = "";
      const coverBlockMatch = html.match(/class=\"(?:manga-info-pic|story-info-left)\"[^>]*>([\s\S]*?)<\/div>/i);
      if (coverBlockMatch) {
        const coverBlock = coverBlockMatch[1];
        const imgTag = coverBlock.match(/<img[^>]*>/i);
        if (imgTag) {
          coverUrl = this.extractImageUrl(imgTag[0]) || "";
        }
      }
      
      // Extract description
      let description = "";
      const descMatch = html.match(/id=\"(?:noidungm|panel-story-info-description|summary__content)\"[^>]*>([\s\S]*?)(?:<\/div>|<\/p>)/i);
      if (descMatch) {
        description = this.cleanText(descMatch[1]);
      }
      
      // Extract author, status, and genres
      let author = "", status = "";
      const genres = [];
      
      // Find info list
      const infoListMatch = html.match(/class=\"manga-info-text\"([\s\S]*?)<\/ul>|class=\"story-info-right-extent\"([\s\S]*?)<\/div>/i);
      if (infoListMatch) {
        const infoList = infoListMatch[0];
        
        // Extract author - improved pattern matching
        console.log("Extracting author information");
        const authorMatch = infoList.match(/<li>Author\(s\)\s*:\s*/i) || infoList.match(/author|artist/i);
        if (authorMatch) {
          const authorLine = infoList.substring(authorMatch.index, infoList.indexOf('</li>', authorMatch.index));
          console.log("Author line: " + authorLine);
          const authorLinks = authorLine.match(/<a[^>]*>(.*?)<\/a>/g);
          
          if (authorLinks) {
            author = authorLinks.map(link => this.cleanText(link)).join(", ");
            console.log("Extracted author from links: " + author);
          } else {
            // Try to extract author without links
            const authorText = authorLine.replace(/<li>Author\(s\)\s*:\s*/i, "").replace(/author|artist|:/gi, "");
            author = this.cleanText(authorText);
            console.log("Extracted author from text: " + author);
          }
        } else {
          console.log("Author pattern not found in info list");
        }
        
        // Extract status - improved pattern matching
        console.log("Extracting status information");
        const statusMatch = infoList.match(/<li>Status\s*:\s*([^<]+)<\/li>/i) || infoList.match(/status/i);
        if (statusMatch && statusMatch.length > 1 && statusMatch[1]) {
          // Direct match from regex group
          status = statusMatch[1].trim();
          console.log("Extracted status directly: " + status);
        } else if (statusMatch) {
          // Fallback to old method
          const statusLine = infoList.substring(statusMatch.index, infoList.indexOf('</li>', statusMatch.index));
          status = this.cleanText(statusLine.replace(/status|:/gi, ""));
          console.log("Extracted status from line: " + status);
        } else {
          console.log("Status pattern not found in info list");
        }
        
        // Extract genres - improved pattern matching
        console.log("Extracting genres information");
        const genreMatch = infoList.match(/<li class=\"genres\"[^>]*>Genres\s*:\s*/i) || infoList.match(/genre|categories/i);
        if (genreMatch) {
          const genreLine = infoList.substring(genreMatch.index, infoList.indexOf('</li>', genreMatch.index));
          console.log("Genre line found with length: " + genreLine.length);
          const genreLinks = genreLine.match(/<a[^>]*>(.*?)<\/a>/g);
          
          if (genreLinks) {
            genreLinks.forEach(link => {
              const genre = this.cleanText(link);
              if (genre) {
                genres.push(genre);
                console.log("Added genre: " + genre);
              }
            });
          } else {
            console.log("No genre links found in genre line");
          }
        } else {
          console.log("Genres pattern not found in info list");
        }
      }
      
      // Extract chapters with improved method
      console.log("Extracting chapters with updated method");
      const chapters = [];

      // Look for the chapter-list container first
      const chapterListMatch = html.match(/<div class=\"chapter-list\">([\s\S]*?)(?:<\/div>\s*<\/div>\s*<\/div>|<div class=\"panel-story)/i);
      if (chapterListMatch) {
        const chapterListHtml = chapterListMatch[1];
        console.log("Found chapter-list container with length: " + chapterListHtml.length);

        // Updated regex pattern to handle multiline HTML with flexible whitespace
        // The actual HTML structure is:
        // <div class="row">
        //   <span><a href="URL" title="TITLE">TEXT</a></span>
        //   <span> VIEWS </span>
        //   <span title="DATE">DATE_DISPLAY</span>
        // </div>
        const chapterRowPattern = /<div\s+class=\"row\">\s*<span><a\s+href=\"([^\"]+)\"\s*title=\"([^\"]+)\">([^<]+)<\/a><\/span>\s*<span>[^<]*<\/span>\s*<span[^>]*>([^<]+)<\/span>\s*<\/div>/g;

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
        const chapterLinkPattern = /<a[^>]*href=\"([^\"]*chapter[^\"]*)\"[^>]*>(.*?)<\/a>/gi;
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
                   !imageUrl.includes("icon") &&
                   !imageUrl.includes("/bns/") &&
                   !imageUrl.endsWith(".gif")) {
                  
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
      
      // If no reader containers found, try a more generic approach
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
               !imageUrl.includes("ad_") &&
               !imageUrl.includes("/bns/") &&
               !imageUrl.endsWith(".gif")) {
              
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
          const imageUrl = this.ensureAbsoluteUrl(match[1]);
          
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
             !imageUrl.includes("/bns/") &&
             !imageUrl.endsWith(".gif") &&
             !images.includes(imageUrl)) {
            console.log("Adding last-resort image URL: " + imageUrl.substring(0, 50) + "...");
            images.push(imageUrl);
          }
        }
      }
      
      console.log("Found total of " + images.length + " chapter images");
      
      // Sort images if they contain numbered filenames
      if (images.length > 1) {
        try {
          const hasNumbers = images.some(url => {
            const filename = url.split('/').pop();
            return /\d+/.test(filename);
          });
          
          if (hasNumbers) {
            console.log("Sorting images by filename");
            images.sort((a, b) => {
              const aName = a.split('/').pop();
              const bName = b.split('/').pop();
              
              // Extract numbers from filenames
              const aMatch = aName.match(/(\d+)/);
              const bMatch = bName.match(/(\d+)/);
              
              if (aMatch && bMatch) {
                return parseInt(aMatch[1]) - parseInt(bMatch[1]);
              }
              
              return 0;
            });
          }
        } catch (sortError) {
          console.error("Error sorting images", sortError);
        }
      }
      
      return { success: true, images: images };
    } catch (e) {
      console.error("Failed to extract chapter images", e);
      return { success: false, error: e.toString(), images: [] };
    }
  },
  
  /**
   * Get all available genres
   */
  parseGenres: function(html) {
    try {
      console.log("Starting to parse genres");
      const genres = [];
      
      const genreStart = html.indexOf('class="panel-category"');
      if (genreStart !== -1) {
        const genreEnd = html.indexOf('</table>', genreStart);
        const genreContent = html.substring(genreStart, genreEnd);
        
        const genreMatches = genreContent.match(/<a[^>]*href=["'][^"']*\/genre\/([^"'\/\?]+)[^>]*>(.*?)<\/a>/g);
        
        if (genreMatches) {
          genreMatches.forEach(genreTag => {
            const hrefMatch = genreTag.match(/href=["'][^"']*\/genre\/([^"'\/\?]+)/i);
            const nameMatch = this.cleanText(genreTag);
            
            if (hrefMatch && nameMatch) {
              const id = hrefMatch[1];
              const name = nameMatch;
              
              genres.push({ id: id, name: name });
            }
          });
        }
      }
      
      console.log("Found " + genres.length + " genres");
      return { success: true, genres: genres };
    } catch (e) {
      console.error("Failed to extract genres", e);
      return { success: false, error: e.toString(), genres: [] };
    }
  }
};

// Return the extractor object
extractor;
