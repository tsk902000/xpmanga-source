// MangaKakalot Extractor v1.0.0
const extractor = {
    id: "mangakakalot",
    name: "MangaKakalot",
    version: "1.0.0",
    baseUrl: "https://www.mangakakalot.gg",
    icon: "https://www.mangakakalot.gg/favicon.ico",
    
    // Available categories for the source
    categories: [
      { id: "latest", name: "Latest" },
      { id: "popular", name: "Popular" },
      { id: "completed", name: "Completed" },
      { id: "new", name: "New Series" },
      { id: "genre", name: "Genres" }
    ],
  
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
      return this.baseUrl + "/search/" + encodeURIComponent(query) + "?page=" + page;
    },
    
    /**
     * Get URL for genre
     */
    getGenreUrl: function(genre, page) {
      if (page === undefined) page = 1;
      return this.baseUrl + "/manga-list/genre/" + encodeURIComponent(genre) + "?page=" + page;
    },
    
    /**
     * Helper function: Simple HTML parser
     */
    parseHTML: function(html) {
      // Define a simple HTML parser object
      const parser = {
        html: html,
        
        // Query selector implementation
        querySelector: function(selector) {
          return this.querySelectorAll(selector)[0] || null;
        },
        
        // Simple querySelectorAll implementation for basic selectors
        querySelectorAll: function(selector) {
          let elements = [];
          
          // Strip out multiple spaces and trim
          selector = selector.replace(/\s+/g, ' ').trim();
          
          // Handle comma-separated selectors
          if (selector.includes(',')) {
            const selectors = selector.split(',');
            for (let i = 0; i < selectors.length; i++) {
              const results = this.querySelectorAll(selectors[i].trim());
              elements = elements.concat(results);
            }
            return elements;
          }
          
          // Parse class selectors
          if (selector.includes('.')) {
            const parts = selector.split('.');
            const className = parts[1].split(' ')[0].split(':')[0].split('[')[0];
            const classRegex = new RegExp('class=["\'](.*?)' + className + '(.*?)["\']', 'gi');
            let match;
            let position = 0;
            
            while ((match = classRegex.exec(this.html)) !== null) {
              const startPos = this.html.indexOf('<', match.index);
              const endPos = this.html.indexOf('>', match.index) + 1;
              
              // Get tag name
              const tagMatch = /<\s*([a-z]+)/i.exec(this.html.substring(startPos, endPos));
              const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
              
              // Skip if tag name doesn't match additional tag selectors
              if (parts[0] !== '' && parts[0] !== tagName) continue;
              
              // Find the end of the element
              const closeTag = '</' + tagName + '>';
              const closePos = this.findClosingTag(startPos, tagName);
              
              if (closePos !== -1) {
                elements.push({
                  outerHTML: this.html.substring(startPos, closePos + closeTag.length),
                  innerHTML: this.html.substring(endPos, closePos),
                  textContent: this.stripTags(this.html.substring(endPos, closePos)),
                  querySelector: this.querySelector,
                  querySelectorAll: this.querySelectorAll,
                  getAttribute: function(attr) {
                    const attrRegex = new RegExp(attr + '=["\'](.*?)["\']', 'i');
                    const attrMatch = attrRegex.exec(this.outerHTML);
                    return attrMatch ? attrMatch[1] : null;
                  }
                });
              }
            }
          } else {
            // Handle tag selectors
            const tagRegex = new RegExp('<\\s*(' + selector + ')(\\s|>)', 'gi');
            let match;
            
            while ((match = tagRegex.exec(this.html)) !== null) {
              const startPos = match.index;
              const endPos = this.html.indexOf('>', startPos) + 1;
              const tagName = match[1].toLowerCase();
              
              // Find the end of the element
              const closeTag = '</' + tagName + '>';
              const closePos = this.findClosingTag(startPos, tagName);
              
              if (closePos !== -1) {
                elements.push({
                  outerHTML: this.html.substring(startPos, closePos + closeTag.length),
                  innerHTML: this.html.substring(endPos, closePos),
                  textContent: this.stripTags(this.html.substring(endPos, closePos)),
                  querySelector: this.querySelector,
                  querySelectorAll: this.querySelectorAll,
                  getAttribute: function(attr) {
                    const attrRegex = new RegExp(attr + '=["\'](.*?)["\']', 'i');
                    const attrMatch = attrRegex.exec(this.outerHTML);
                    return attrMatch ? attrMatch[1] : null;
                  }
                });
              }
            }
          }
          
          return elements;
        },
        
        // Helper to find closing tag
        findClosingTag: function(start, tagName) {
          const openTag = new RegExp('<\\s*' + tagName + '(\\s|>)', 'gi');
          const closeTag = new RegExp('<\\/\\s*' + tagName + '\\s*>', 'gi');
          let depth = 1;
          let position = start + 1;
          
          while (depth > 0 && position < this.html.length) {
            const nextOpen = openTag.exec(this.html.substring(position));
            const nextClose = closeTag.exec(this.html.substring(position));
            
            const openPos = nextOpen ? position + nextOpen.index : this.html.length;
            const closePos = nextClose ? position + nextClose.index : this.html.length;
            
            if (closePos < openPos) {
              depth--;
              position = closePos + 1;
            } else {
              depth++;
              position = openPos + 1;
            }
          }
          
          return depth === 0 ? closeTag.lastIndex + position - 1 : -1;
        },
        
        // Strip HTML tags
        stripTags: function(html) {
          return html.replace(/<\/?[^>]+(>|$)/g, '').trim();
        }
      };
      
      return parser;
    },
    
    /**
     * Parse manga list from HTML
     */
    parseMangaList: function(html) {
      try {
        const doc = this.parseHTML(html);
        const items = [];
        
        // Try with the selectors from the HTML we can see in the example
        let mangaElements = doc.querySelectorAll(".itemupdate");
        
        // If nothing found, try alternative selectors
        if (mangaElements.length === 0) {
          mangaElements = doc.querySelectorAll(".list-truyen-item-wrap, .item, .story_item");
        }
        
        for (let i = 0; i < mangaElements.length; i++) {
          try {
            const element = mangaElements[i];
            const link = element.querySelector("a");
            const img = element.querySelector("img");
            
            let title = "";
            const titleElement = element.querySelector(".title") || link;
            
            if (titleElement) {
              title = titleElement.textContent.trim();
            }
            
            const url = link ? link.getAttribute("href") || "" : "";
            
            let cover = "";
            if (img) {
              cover = img.getAttribute("data-src") || img.getAttribute("src") || "";
            }
            
            let lastChapter = "";
            const chapterElement = element.querySelector(".chapter, .list-story-item-wrap-chapter, .latest-chapter");
            if (chapterElement) {
              lastChapter = chapterElement.textContent.trim();
            }
            
            // Extract ID from URL
            let id = "";
            if (url) {
              const urlParts = url.split("/");
              id = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || "";
              id = id.split("?")[0]; // Remove query params
            }
            
            if (title && url) {
              items.push({
                id: id,
                title: title,
                cover: cover,
                url: url,
                lastChapter: lastChapter
              });
            }
          } catch (e) {
            console.error("Error parsing manga item:", e);
          }
        }
        
        return { success: true, items: items };
      } catch (e) {
        return { success: false, error: e.toString(), items: [] };
      }
    },
    
    /**
     * Parse manga details from HTML
     */
    parseMangaDetails: function(html) {
      try {
        const doc = this.parseHTML(html);
        
        // Title
        let title = "";
        const titleElement = doc.querySelector(".manga-info-text h1, .story-info-right h1, .panel-story-info h1");
        
        if (titleElement) {
          title = titleElement.textContent.trim();
        }
        
        // Cover
        let cover = "";
        const coverElement = doc.querySelector(".manga-info-pic img, .story-info-left img");
        
        if (coverElement) {
          cover = coverElement.getAttribute("data-src") || coverElement.getAttribute("src") || "";
        }
        
        // Description
        let description = "";
        const descElement = doc.querySelector("#noidungm, #panel-story-info-description, .summary__content");
        
        if (descElement) {
          description = descElement.textContent.trim();
        }
        
        // Author, status, and genres
        let author = "";
        let status = "";
        const genres = [];
        
        const infoItems = doc.querySelectorAll(".manga-info-text li, .story-info-right-extent p");
        
        for (let i = 0; i < infoItems.length; i++) {
          const item = infoItems[i];
          const text = item.textContent.trim().toLowerCase();
          
          if (text.includes("author") || text.includes("artist")) {
            const authorLinks = item.querySelectorAll("a");
            if (authorLinks && authorLinks.length > 0) {
              let authorNames = [];
              for (let j = 0; j < authorLinks.length; j++) {
                authorNames.push(authorLinks[j].textContent.trim());
              }
              author = authorNames.join(", ");
            } else {
              author = text.replace(/author|artist|:/gi, "").trim();
            }
          }
          
          if (text.includes("status")) {
            status = text.replace(/status|:/gi, "").trim();
          }
          
          if (text.includes("genre") || text.includes("categories")) {
            const genreLinks = item.querySelectorAll("a");
            if (genreLinks) {
              for (let j = 0; j < genreLinks.length; j++) {
                const genre = genreLinks[j].textContent.trim();
                if (genre) {
                  genres.push(genre);
                }
              }
            }
          }
        }
        
        // Chapters
        const chapters = [];
        
        let chapterElements = doc.querySelectorAll(".chapter-list .row, .row-content-chapter li");
        
        for (let i = 0; i < chapterElements.length; i++) {
          try {
            const element = chapterElements[i];
            const link = element.querySelector("a");
            
            if (link) {
              const chapterUrl = link.getAttribute("href") || "";
              const chapterTitle = link.textContent.trim() || "";
              
              // Extract ID from chapter URL
              let chapterId = "";
              if (chapterUrl) {
                const urlParts = chapterUrl.split("/");
                chapterId = urlParts[urlParts.length - 1] || "";
                chapterId = chapterId.split("?")[0]; // Remove query params
              }
              
              // Try to extract chapter number from title
              let chapterNumber = chapterElements.length - i; // Default to position
              const match = chapterTitle.match(/chapter\s+(\d+(\.\d+)?)/i);
              if (match) {
                chapterNumber = parseFloat(match[1]);
              }
              
              // Try to extract date
              let date = "";
              const dateElement = element.querySelector(".chapter-time");
              if (dateElement) {
                date = dateElement.textContent.trim();
              }
              
              chapters.push({
                id: chapterId,
                number: chapterNumber,
                title: chapterTitle,
                url: chapterUrl,
                date: date
              });
            }
          } catch (e) {
            console.error("Error parsing chapter:", e);
          }
        }
        
        // Sort chapters by number, descending (newest first)
        chapters.sort(function(a, b) { return b.number - a.number; });
        
        return {
          success: true,
          manga: {
            title: title,
            cover: cover,
            description: description,
            author: author,
            status: status,
            genres: genres,
            chapters: chapters
          }
        };
      } catch (e) {
        return { success: false, error: e.toString(), manga: null };
      }
    },
    
    /**
     * Parse chapter images from HTML
     */
    parseChapterImages: function(html) {
      try {
        const doc = this.parseHTML(html);
        
        let imageElements = doc.querySelectorAll(".container-chapter-reader img, .reading-content img");
        
        const images = [];
        
        for (let i = 0; i < imageElements.length; i++) {
          const img = imageElements[i];
          const src = img.getAttribute("data-src") || img.getAttribute("src") || "";
          
          if (src && !src.includes("logo")) {
            images.push(src);
          }
        }
        
        return { success: true, images: images };
      } catch (e) {
        return { success: false, error: e.toString(), images: [] };
      }
    },
    
    /**
     * Get all available genres
     */
    parseGenres: function(html) {
      try {
        const doc = this.parseHTML(html);
        
        let genreElements = doc.querySelectorAll(".panel_category a");
        
        const genres = [];
        
        for (let i = 0; i < genreElements.length; i++) {
          const element = genreElements[i];
          const name = element.textContent.trim();
          const url = element.getAttribute("href") || "";
          
          let id = "";
          if (url) {
            const urlParts = url.split("/");
            id = urlParts[urlParts.length - 1] || "";
            id = id.split("?")[0]; // Remove query params
          }
          
          if (name && id) {
            genres.push({ id: id, name: name });
          }
        }
        
        return { success: true, genres: genres };
      } catch (e) {
        return { success: false, error: e.toString(), genres: [] };
      }
    }
  };
  
  // Return the extractor object
  extractor;