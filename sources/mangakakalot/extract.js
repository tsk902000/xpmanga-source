// MangaKakalot Extractor v1.2.0
const extractor = {
    id: "mangakakalot",
    name: "MangaKakalot",
    version: "1.2.0",
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
      if (!imgTag) return "";
      
      // Check for data-src first (common for lazy-loaded images)
      const dataSrcMatch = imgTag.match(/data-src=["']([^"']*)["']/i);
      if (dataSrcMatch && dataSrcMatch[1]) {
        return this.ensureAbsoluteUrl(dataSrcMatch[1]);
      }
      
      // Then check for src
      const srcMatch = imgTag.match(/src=["']([^"']*)["']/i);
      if (srcMatch && srcMatch[1]) {
        return this.ensureAbsoluteUrl(srcMatch[1]);
      }
      
      // Then check for data-original (another lazy loading attribute)
      const dataOriginalMatch = imgTag.match(/data-original=["']([^"']*)["']/i);
      if (dataOriginalMatch && dataOriginalMatch[1]) {
        return this.ensureAbsoluteUrl(dataOriginalMatch[1]);
      }
      
      return "";
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
              let cover = "";
              const imgTags = mangaHtml.match(/<img[^>]*>/g);
              if (imgTags && imgTags.length > 0) {
                cover = this.extractImageUrl(imgTags[0]);
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
                console.log("Found manga: " + title + " with cover: " + cover);
                items.push({
                  id: id,
                  title: title,
                  cover: cover,
                  url: url,
                  lastChapter: lastChapter
                });
              }
            } catch (e) {
              console.error("Error parsing manga item", e);
            }
          }
        } else if (html.includes("itemupdate")) {
          console.log("Detected homepage or alternative format");
          // Homepage format or alternative listing
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
              
              // Make sure URL is absolute
              url = this.ensureAbsoluteUrl(url);
              
              // Extract cover URL
              let cover = "";
              const imgTags = mangaHtml.match(/<img[^>]*>/g);
              if (imgTags && imgTags.length > 0) {
                cover = this.extractImageUrl(imgTags[0]);
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
                console.log("Found manga: " + title + " with cover: " + cover);
                items.push({
                  id: id,
                  title: title,
                  cover: cover,
                  url: url,
                  lastChapter: lastChapter
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
        let cover = "";
        const coverBlockMatch = html.match(/class="(?:manga-info-pic|story-info-left)"[^>]*>([\s\S]*?)<\/div>/i);
        if (coverBlockMatch) {
          const coverBlock = coverBlockMatch[1];
          const imgTag = coverBlock.match(/<img[^>]*>/i);
          if (imgTag) {
            cover = this.extractImageUrl(imgTag[0]);
          }
        }
        
        // Extract description
        let description = "";
        const descMatch = html.match(/id="(?:noidungm|panel-story-info-description|summary__content)"[^>]*>([\s\S]*?)(?:<\/div>|<\/p>)/i);
        if (descMatch) {
          description = this.cleanText(descMatch[1]);
        }
        
        // Extract author, status, and genres
        let author = "", status = "";
        const genres = [];
        
        // Find info list
        const infoListMatch = html.match(/class="manga-info-text"([\s\S]*?)<\/ul>|class="story-info-right-extent"([\s\S]*?)<\/div>/i);
        if (infoListMatch) {
          const infoList = infoListMatch[0];
          
          // Extract author
          const authorMatch = infoList.match(/author|artist/i);
          if (authorMatch) {
            const authorLine = infoList.substring(authorMatch.index, infoList.indexOf('</li>', authorMatch.index));
            const authorLinks = authorLine.match(/<a[^>]*>(.*?)<\/a>/g);
            
            if (authorLinks) {
              author = authorLinks.map(link => this.cleanText(link)).join(", ");
            } else {
              author = this.cleanText(authorLine.replace(/author|artist|:/gi, ""));
            }
          }
          
          // Extract status
          const statusMatch = infoList.match(/status/i);
          if (statusMatch) {
            const statusLine = infoList.substring(statusMatch.index, infoList.indexOf('</li>', statusMatch.index));
            status = this.cleanText(statusLine.replace(/status|:/gi, ""));
          }
          
          // Extract genres
          const genreMatch = infoList.match(/genre|categories/i);
          if (genreMatch) {
            const genreLine = infoList.substring(genreMatch.index, infoList.indexOf('</li>', genreMatch.index));
            const genreLinks = genreLine.match(/<a[^>]*>(.*?)<\/a>/g);
            
            if (genreLinks) {
              genreLinks.forEach(link => {
                const genre = this.cleanText(link);
                if (genre) genres.push(genre);
              });
            }
          }
        }
        
        // Extract chapters
        const chapters = [];
        let chapterBlockStart = html.indexOf('class="chapter-list"') || html.indexOf('class="row-content-chapter"');
        
        if (chapterBlockStart !== -1) {
          const chapterBlockEnd = html.indexOf('</ul>', chapterBlockStart);
          const chapterBlock = html.substring(chapterBlockStart, chapterBlockEnd);
          
          const chapterMatches = chapterBlock.match(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/g);
          
          if (chapterMatches) {
            for (let i = 0; i < chapterMatches.length; i++) {
              try {
                const chapterLink = chapterMatches[i];
                const urlMatch = chapterLink.match(/href=["']([^"']*)["']/i);
                const titleMatch = this.cleanText(chapterLink);
                
                if (urlMatch && titleMatch) {
                  const chapterUrl = this.ensureAbsoluteUrl(urlMatch[1]);
                  const chapterTitle = titleMatch;
                  
                  // Extract ID from chapter URL
                  let chapterId = "";
                  if (chapterUrl) {
                    const urlParts = chapterUrl.split("/");
                    chapterId = urlParts[urlParts.length - 1] || "";
                    chapterId = chapterId.split("?")[0];
                  }
                  
                  // Try to extract chapter number from title
                  let chapterNumber = chapterMatches.length - i; // Default to position
                  const match = chapterTitle.match(/chapter\s+(\d+(\.\d+)?)/i);
                  if (match) {
                    chapterNumber = parseFloat(match[1]);
                  }
                  
                  // Extract date
                  let date = "";
                  const dateStart = html.indexOf(chapterLink) + chapterLink.length;
                  const dateEnd = html.indexOf('</li>', dateStart);
                  if (dateEnd !== -1) {
                    const dateSection = html.substring(dateStart, dateEnd);
                    const dateMatch = dateSection.match(/class="chapter-time"[^>]*>(.*?)<\/span>/i);
                    if (dateMatch) {
                      date = this.cleanText(dateMatch[1]);
                    }
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
                console.error("Error parsing chapter", e);
              }
            }
            
            // Sort chapters by number, descending (newest first)
            chapters.sort(function(a, b) { return b.number - a.number; });
          }
        }
        
        console.log("Successfully extracted manga details");
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
        const images = [];
        
        // Find all image elements in reader
        const readerStart = html.indexOf('class="container-chapter-reader"') || html.indexOf('class="reading-content"');
        
        if (readerStart !== -1) {
          const readerEnd = html.indexOf('</div>', readerStart);
          const readerContent = html.substring(readerStart, readerEnd);
          
          const imgMatches = readerContent.match(/<img[^>]*>/g);
          
          if (imgMatches) {
            imgMatches.forEach(imgTag => {
              const src = this.extractImageUrl(imgTag);
              
              if (src && !src.includes("logo")) {
                images.push(src);
              }
            });
          }
        }
        
        console.log("Found " + images.length + " chapter images");
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