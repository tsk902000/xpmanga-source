// MangaPark Extractor v1.0.0
var extractor = {
  id: "mangapark",
  name: "MangaPark",
  version: "1.0.0",
  baseUrl: "https://mangapark.net",
  icon: "https://mangapark.net/favicon.ico",
  imageproxy: "",
  imageReferer: "https://mangapark.net/",
  debug: true,

  // Rate limiting configuration
  rateLimit: {
    requestsPerMinute: 30,
    minIntervalMs: 2000,
    maxRetries: 3,
    retryDelayMs: 3000
  },

  // Image loading configuration
  imageLoading: {
    maxConcurrent: 3,
    preloadAhead: 2,
    timeout: 30000
  },

  // Available categories
  categories: [
    { id: "latest", name: "Latest" },
    { id: "popular", name: "Popular" },
    { id: "completed", name: "Completed" },
    { id: "new", name: "New Series" }
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
   * Helper: Clean text content
   */
  cleanText: function(text) {
    if (!text) return "";
    return text.replace(/<[^>]*>/g, "").trim();
  },

  /**
   * Helper: Extract image URL from img tag
   */
  extractImageUrl: function(imgTag) {
    if (!imgTag) return null;

    const attributes = ["data-src", "data-original", "data-lazy-src", "src"];

    for (let attr of attributes) {
      const regex = new RegExp(attr + '=["\'](https?://[^"\']+)["\']', 'i');
      const match = imgTag.match(regex);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    const onerrorMatch = imgTag.match(/onerror="[^"]*this\.src='([^']+)'/);
    if (onerrorMatch && onerrorMatch[1]) {
      return this.ensureAbsoluteUrl(onerrorMatch[1]);
    }

    return null;
  },

  /**
   * Get URLs for different manga lists
   */
  getListUrl: function(type, page) {
    if (page === undefined) page = 1;

    switch (type) {
      case 'latest':
        return this.baseUrl + "/browse/latest?page=" + page;
      case 'popular':
        return this.baseUrl + "/browse/popular?page=" + page;
      case 'completed':
        return this.baseUrl + "/browse/completed?page=" + page;
      case 'new':
        return this.baseUrl + "/browse/new?page=" + page;
      default:
        return this.baseUrl + "/browse/latest?page=" + page;
    }
  },

  /**
   * Get URL for search
   */
  getSearchUrl: function(query, page) {
    if (page === undefined) page = 1;
    return this.baseUrl + "/search?q=" + encodeURIComponent(query) + "&page=" + page;
  },

  /**
   * Get URL for genre
   */
  getGenreUrl: function(genre, page) {
    if (page === undefined) page = 1;
    return this.baseUrl + "/genre/" + encodeURIComponent(genre) + "?page=" + page;
  },

  /**
   * Parse manga list from HTML
   */
  parseMangaList: function(html) {
    try {
      console.log("Starting to parse manga list");
      const items = [];

      // MangaPark uses .item class for manga cards
      const mangaBlocks = html.split(/class=["']item[^"']*["']/);

      // Skip first element as it's before the first manga item
      for (let i = 1; i < mangaBlocks.length; i++) {
        try {
          const block = mangaBlocks[i];
          const mangaHtml = block.substring(0, 10000);

          // Extract manga URL and title
          const urlMatch = mangaHtml.match(/href=["']([^"']*comic\/[^"']*)["']\s+title=["']([^"']*)["']/i);
          let url = "", title = "";

          if (urlMatch) {
            url = urlMatch[1];
            title = urlMatch[2];
          } else {
            // Try alternative pattern
            const altMatch = mangaHtml.match(/href=["']([^"']*comic\/[^"']*)["'][^>]*>([^<]+)<\/a>/i);
            if (altMatch) {
              url = altMatch[1];
              title = this.cleanText(altMatch[2]);
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
          const chapterMatch = mangaHtml.match(/class=["'][^"']*chapter[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
          if (chapterMatch) {
            const chapterLinkMatch = chapterMatch[1].match(/<a[^>]*href=["']([^"']*)["'][^>]*>([^<]+)<\/a>/i);
            if (chapterLinkMatch) {
              lastChapter = this.cleanText(chapterLinkMatch[2]);
              const chapterUrl = this.ensureAbsoluteUrl(chapterLinkMatch[1]);
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
      const coverMatch = html.match(/class=["'][^"']*cover[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      if (coverMatch) {
        const imgTag = coverMatch[1].match(/<img[^>]*>/i);
        if (imgTag) {
          coverUrl = this.extractImageUrl(imgTag[0]) || "";
        }
      }

      // Extract description
      let description = "";
      const descMatch = html.match(/class=["'][^"']*summary[^"']*["'][^>]*>([\s\S]*?)(?:<\/div>|<\/p>)/i);
      if (descMatch) {
        description = this.cleanText(descMatch[1]);
      }

      // Extract author, status, and genres
      let author = "", status = "";
      const genres = [];

      // Find info list
      const infoListMatch = html.match(/class=["'][^"']*info[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i);
      if (infoListMatch) {
        const infoList = infoListMatch[0];

        // Extract author
        const authorMatch = infoList.match(/<li[^>]*>Author[\s\S]*?<\/li>/i);
        if (authorMatch) {
          const authorLinks = authorMatch[0].match(/<a[^>]*>(.*?)<\/a>/g);
          if (authorLinks) {
            author = authorLinks.map(link => this.cleanText(link)).join(", ");
          }
        }

        // Extract status
        const statusMatch = infoList.match(/<li[^>]*>Status[\s\S]*?<\/li>/i);
        if (statusMatch) {
          status = this.cleanText(statusMatch[0].replace(/<[^>]*>/g, "").replace(/status|:/gi, "").trim());
        }

        // Extract genres
        const genreMatch = infoList.match(/<li[^>]*>Genre[\s\S]*?<\/li>/i);
        if (genreMatch) {
          const genreLinks = genreMatch[0].match(/<a[^>]*>(.*?)<\/a>/g);
          if (genreLinks) {
            genreLinks.forEach(link => {
              const genre = this.cleanText(link);
              if (genre) {
                genres.push(genre);
              }
            });
          }
        }
      }

      // Extract chapters
      console.log("Extracting chapters");
      const chapters = [];

      // Look for chapter list
      const chapterListMatch = html.match(/class=["'][^"']*chapter-list[^"']*["'][^>]*>([\s\S]*?)(?:<\/div>\s*<\/div>|<div class=["'][^"']*panel)/i);
      if (chapterListMatch) {
        const chapterListHtml = chapterListMatch[1];

        // Pattern to match chapter rows
        const chapterRowPattern = /<a[^>]*href=["']([^"']*chapter[^"']*)["'][^>]*>([^<]+)<\/a>/gi;
        const matches = [...chapterListHtml.matchAll(chapterRowPattern)];

        for (const match of matches) {
          try {
            const chapterUrl = this.ensureAbsoluteUrl(match[1]);
            const displayTitle = this.cleanText(match[2]);

            // Extract chapter ID from URL
            let chapterId = "";
            if (chapterUrl) {
              const urlParts = chapterUrl.split("/");
              chapterId = urlParts[urlParts.length - 1] || "";
              chapterId = chapterId.split("?")[0];
            }

            // Extract chapter number from title
            let chapterNumber = 0;
            const numberMatch = displayTitle.match(/chapter\s+(\d+(\.\d+)?)/i);
            if (numberMatch) {
              chapterNumber = parseFloat(numberMatch[1]);
            } else {
              const altMatch = displayTitle.match(/ch\.\s*(\d+(\.\d+)?)/i) ||
                              displayTitle.match(/(\d+(\.\d+)?)/);
              if (altMatch) {
                chapterNumber = parseFloat(altMatch[1]);
              } else {
                chapterNumber = chapters.length + 1;
              }
            }

            console.log(`Found chapter: ${displayTitle} (${chapterNumber})`);

            chapters.push({
              id: chapterId,
              number: chapterNumber,
              title: displayTitle,
              url: chapterUrl,
              date: ""
            });
          } catch (e) {
            console.error("Error parsing chapter:", e);
          }
        }
      }

      // If no chapters found, add debug chapter
      if (chapters.length === 0) {
        console.warn("No chapters found. Adding debug chapter.");
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

      const images = [];

      // MangaPark uses .viewer-container or .chapter-reader for image container
      const possibleContainers = [
        'class="viewer-container"',
        'class="chapter-reader"',
        'class="chapter-images"',
        'id="viewer"',
        'class="image-container"'
      ];

      let foundReader = false;

      for (const container of possibleContainers) {
        if (html.includes(container)) {
          console.log("Found reader container: " + container);
          foundReader = true;

          let searchStart = 0;
          let containerStartIndex;

          while ((containerStartIndex = html.indexOf(container, searchStart)) !== -1) {
            const readerStart = containerStartIndex;
            let readerEnd = containerStartIndex;
            let divCount = 1;

            for (let i = readerStart + container.length; i < html.length; i++) {
              if (html.substr(i, 4) === '<div') {
                divCount++;
              } else if (html.substr(i, 6) === '</div>') {
                divCount--;
                if (divCount === 0) {
                  readerEnd = i + 6;
                  break;
                }
              }
            }

            const readerContent = html.substring(readerStart, readerEnd);
            console.log("Found reader content block: " + readerContent.length + " characters");

            const imgMatches = readerContent.match(/<img[^>]*>/g);

            if (imgMatches && imgMatches.length > 0) {
              console.log("Found " + imgMatches.length + " image tags in this container");

              imgMatches.forEach(imgTag => {
                const imageUrl = this.extractImageUrl(imgTag);

                if (imageUrl &&
                   !imageUrl.includes("logo") &&
                   !imageUrl.includes("banner") &&
                   !imageUrl.includes("ad_") &&
                   !imageUrl.includes("ads_") &&
                   !imageUrl.includes("icon") &&
                   !imageUrl.endsWith(".gif")) {

                  if (!images.includes(imageUrl)) {
                    console.log("Adding image URL: " + imageUrl.substring(0, 50) + "...");
                    images.push(imageUrl);
                  }
                }
              });
            }

            searchStart = readerEnd;
          }
        }
      }

      // Fallback: Look for JSON data with image URLs
      if (!foundReader || images.length === 0) {
        console.log("No standard reader containers found, looking for JSON data");

        const jsonMatch = html.match(/var\s+images\s*=\s*(\[[\s\S]*?\]);/i);
        if (jsonMatch) {
          try {
            const imageUrls = JSON.parse(jsonMatch[1]);
            if (Array.isArray(imageUrls)) {
              imageUrls.forEach(url => {
                if (url && !images.includes(url)) {
                  console.log("Adding JSON image URL: " + url.substring(0, 50) + "...");
                  images.push(this.ensureAbsoluteUrl(url));
                }
              });
            }
          } catch (e) {
            console.error("Error parsing JSON images", e);
          }
        }
      }

      // Final fallback: Get all image tags
      if (images.length === 0) {
        console.log("No images found with standard methods, trying fallback");

        const allImgTags = html.match(/<img[^>]*>/g) || [];
        console.log("Found " + allImgTags.length + " total image tags");

        allImgTags.forEach(imgTag => {
          if (imgTag.includes('data-src') ||
              imgTag.includes('loading="lazy"') ||
              imgTag.includes('class="chapter-img"') ||
              imgTag.includes('class="page"')) {

            const imageUrl = this.extractImageUrl(imgTag);

            if (imageUrl &&
               !imageUrl.includes("logo") &&
               !imageUrl.includes("banner") &&
               !imageUrl.includes("ad_") &&
               !imageUrl.endsWith(".gif")) {

              if (!images.includes(imageUrl)) {
                console.log("Adding fallback image URL: " + imageUrl.substring(0, 50) + "...");
                images.push(imageUrl);
              }
            }
          }
        });
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
   * Parse genres from HTML
   */
  parseGenres: function(html) {
    try {
      console.log("Starting to parse genres");
      const genres = [];

      // Look for genre links
      const genreMatches = html.match(/<a[^>]*href=["'][^"']*\/genre\/[^"']*["'][^>]*>([^<]+)<\/a>/gi);

      if (genreMatches) {
        const uniqueGenres = new Set();
        genreMatches.forEach(genreTag => {
          const hrefMatch = genreTag.match(/href=["'][^"']*\/genre\/([^"'\/\?]+)/i);
          const name = this.cleanText(genreTag);

          if (hrefMatch && name && !uniqueGenres.has(name)) {
            uniqueGenres.add(name);
            genres.push({ id: hrefMatch[1], name: name });
          }
        });
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
