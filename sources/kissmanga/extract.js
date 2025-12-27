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
          return this.baseUrl + "/manga-list/latest-manga/page/" + page;
        case 'popular':
          return this.baseUrl + "/manga-list/hot-manga/page/" + page;
        case 'completed':
          return this.baseUrl + "/manga-list/completed-manga/page/" + page;
        case 'new':
          return this.baseUrl + "/manga-list/new-manga/page/" + page;
        default:
          return this.baseUrl + "/manga-list/latest-manga/page/" + page;
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
     * Parse manga list from HTML
     */
    parseMangaList: function(html) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const items = [];
        
        // First try item-specific selectors
        let mangaElements = Array.from(doc.querySelectorAll(".list-truyen-item-wrap, .item, .story_item"));
        
        if (mangaElements.length === 0) {
          // Try with the selectors from the HTML we can see in the example
          mangaElements = Array.from(doc.querySelectorAll(".itemupdate"));
        }
        
        for (const element of mangaElements) {
          try {
            const link = element.querySelector("a");
            const img = element.querySelector("img");
            
            let title = "";
            const titleElement = element.querySelector(".title") || link;
            
            if (titleElement) {
              title = titleElement.textContent.trim() || titleElement.title || "";
            }
            
            const url = link ? (link.href || "") : "";
            
            let cover = "";
            if (img) {
              cover = img.getAttribute("data-src") || img.src || "";
            }
            
            let lastChapter = "", lastChapterId = "";
            const chapterElement = element.querySelector(".chapter, .list-story-item-wrap-chapter, .latest-chapter");
            if (chapterElement) {
              lastChapter = chapterElement.textContent.trim();
              const chapterLink = chapterElement.tagName === 'A' ? chapterElement : chapterElement.querySelector('a');
              if (chapterLink) {
                const chapterUrl = chapterLink.getAttribute("href") || "";
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
              id = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || "";
              id = id.split("?")[0]; // Remove query params
            }
            
            if (title && url) {
              items.push({
                id: id,
                title: title,
                cover: cover,
                url: url,
                lastChapter: lastChapter,
                lastChapterId: lastChapterId
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
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
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
          cover = coverElement.getAttribute("data-src") || coverElement.src || "";
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
        
        const infoItems = Array.from(doc.querySelectorAll(".manga-info-text li, .story-info-right-extent p"));
        
        for (const item of infoItems) {
          const text = item.textContent.trim().toLowerCase();
          
          if (text.includes("author") || text.includes("artist")) {
            const authorLinks = item.querySelectorAll("a");
            if (authorLinks && authorLinks.length > 0) {
              author = Array.from(authorLinks)
                .map(function(a) { return a.textContent.trim(); })
                .join(", ");
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
              for (const link of genreLinks) {
                const genre = link.textContent.trim();
                if (genre) {
                  genres.push(genre);
                }
              }
            }
          }
        }
        
        // Chapters
        const chapters = [];
        
        let chapterElements = Array.from(doc.querySelectorAll(".chapter-list .row, .row-content-chapter li"));
        
        for (let i = 0; i < chapterElements.length; i++) {
          try {
            const element = chapterElements[i];
            const link = element.querySelector("a");
            
            if (link) {
              const chapterUrl = link.href || "";
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
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        let imageElements = Array.from(doc.querySelectorAll(".container-chapter-reader img, .reading-content img"));
        
        const images = [];
        
        for (const img of imageElements) {
          const src = img.getAttribute("data-src") || img.src || "";
          
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
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        let genreElements = Array.from(doc.querySelectorAll(".panel_category a"));
        
        const genres = [];
        
        for (const element of genreElements) {
          const name = element.textContent.trim();
          const url = element.href || "";
          
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