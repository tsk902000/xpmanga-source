// MangaPark Extractor v1.0.0
var extractor = {
  id: "mangapark",
  name: "MangaPark",
  version: "1.0.0",
  baseUrl: "https://mangapark.io",
  icon: "https://mangapark.io/favicon.ico",
  imageproxy: "",
  imageReferer: "https://mangapark.io/",
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
    { id: "trending", name: "Trending" },
    { id: "newest", name: "Newest" }
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
    return text.replace(/<[^>]*>/g, "").replace(/<!--[^>]*-->/g, "").trim();
  },

  /**
   * Helper: Extract text between markers
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
   * Get URLs for different manga lists
   */
  getListUrl: function(type, page) {
    if (page === undefined) page = 1;
    switch (type) {
      case 'latest':
        return this.baseUrl + "/latest?page=" + page;
      default:
        return this.baseUrl + "/latest?page=" + page;
    }
  },

  /**
   * Get URL for search
   */
  getSearchUrl: function(query, page) {
    if (page === undefined) page = 1;
    return this.baseUrl + "/search?word=" + encodeURIComponent(query) + "&page=" + page;
  },

  /**
   * Get URL for genre
   */
  getGenreUrl: function(genre, page) {
    if (page === undefined) page = 1;
    return this.baseUrl + "/browse?genres=" + encodeURIComponent(genre) + "&page=" + page;
  },

  /**
   * Parse manga list from HTML
   * Structure: <div class="flex border-b border-b-base-200 pb-3">
   *   - Title in <h3 class="font-bold"><a href="/title/{id}-en-{slug}">{title}</a></h3>
   *   - Cover in <img src="/thumb/W600/...">
   *   - Chapter in <a href="/title/.../chapter-X">Chapter X</a>
   */
  parseMangaList: function(html) {
    try {
      if (this.debug) console.log("Starting to parse manga list");
      const items = [];

      // Split by manga item containers
      const mangaBlocks = html.split(/class="flex border-b border-b-base-200 pb-3"/);

      for (let i = 1; i < mangaBlocks.length; i++) {
        try {
          const block = mangaBlocks[i];
          const mangaHtml = block.substring(0, 8000);

          // Extract title and URL from h3 > a with class="link-hover link-pri"
          let title = "", url = "";
          const titleMatch = mangaHtml.match(/<h3[^>]*class="font-bold[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*class="[^"]*link-hover[^"]*"[^>]*>[\s\S]*?<span[^>]*>(?:<!--[^>]*-->)?([^<]+)/i);
          if (titleMatch) {
            url = this.ensureAbsoluteUrl(titleMatch[1]);
            title = this.cleanText(titleMatch[2]);
          }

          // Extract cover URL from img tag with /thumb/
          let coverUrl = "";
          const imgMatch = mangaHtml.match(/<img[^>]*src="([^"]*\/thumb\/[^"]*)"/i);
          if (imgMatch) {
            coverUrl = this.ensureAbsoluteUrl(imgMatch[1]);
          }

          // Extract last chapter info
          let lastChapter = "", lastChapterId = "";
          const chapterMatch = mangaHtml.match(/<a[^>]*href="([^"]*\/\d+-(?:chapter-|ch-)[^"]*)"[^>]*class="[^"]*link-hover[^"]*"[^>]*>[\s\S]*?<span[^>]*>(?:<!--[^>]*-->)?([^<]+)/i);
          if (chapterMatch) {
            const chapterUrl = chapterMatch[1];
            lastChapter = this.cleanText(chapterMatch[2]);
            // Extract chapter ID from URL (e.g., 9986018-chapter-107 -> 9986018-chapter-107)
            const idMatch = chapterUrl.match(/\/(\d+-(?:chapter-|ch-)[^\/\?]+)/i);
            if (idMatch) {
              lastChapterId = idMatch[1];
            }
          }

          // Extract manga ID from URL (e.g., /title/370724-en-insanely-talented-player -> 370724-en-insanely-talented-player)
          let id = "";
          if (url) {
            const idMatch = url.match(/\/title\/([^\/\?]+)/i);
            if (idMatch) {
              id = idMatch[1];
            }
          }

          if (title && url && id) {
            if (this.debug) console.log("Found manga: " + title);
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

      if (this.debug) console.log("Found " + items.length + " manga items");
      return { success: true, items: items };
    } catch (e) {
      console.error("Failed to extract manga list", e);
      return { success: false, error: e.toString(), items: [] };
    }
  },

  /**
   * Parse manga details from HTML
   * Structure:
   *   - Title in <h3 class="text-lg md:text-2xl font-bold"><a>{title}</a></h3>
   *   - Cover in <img src="/thumb/W600/...">
   *   - Description in <div class="limit-html prose">
   *   - Author in <a href="/search?word={author}">{author}</a>
   *   - Status in <span class="font-bold uppercase text-success">{status}</span>
   *   - Genres in <span class="whitespace-nowrap">{genre}</span>
   *   - Chapters in <a href="/title/.../chapter-X">Chapter X</a>
   */
  parseMangaDetails: function(html) {
    try {
      if (this.debug) console.log("Starting to parse manga details");

      // Extract title
      let title = "";
      const titleMatch = html.match(/<h3[^>]*class="[^"]*text-lg[^"]*font-bold[^"]*"[^>]*>[\s\S]*?<a[^>]*>(?:<!--[^>]*-->)?([^<]+)/i);
      if (titleMatch) {
        title = this.cleanText(titleMatch[1]);
      }

      // Extract cover
      let coverUrl = "";
      const coverMatch = html.match(/<img[^>]*src="([^"]*\/thumb\/W600\/[^"]*)"/i);
      if (coverMatch) {
        coverUrl = this.ensureAbsoluteUrl(coverMatch[1]);
      }

      // Extract description from limit-html prose div
      let description = "";
      const descMatch = html.match(/<div[^>]*class="[^"]*limit-html prose[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      if (descMatch) {
        description = this.cleanText(descMatch[1]);
      }

      // Extract author from search link
      let author = "";
      const authorMatch = html.match(/<a[^>]*href="\/search\?word=[^"]*"[^>]*class="[^"]*link-hover link-primary[^"]*"[^>]*>([^<]+)<\/a>/i);
      if (authorMatch) {
        author = this.cleanText(authorMatch[1]);
      }

      // Extract status
      let status = "";
      const statusMatch = html.match(/<span[^>]*class="[^"]*font-bold uppercase text-success[^"]*"[^>]*>([^<]+)<\/span>/i);
      if (statusMatch) {
        status = this.cleanText(statusMatch[1]);
      }

      // Extract genres
      const genres = [];
      const genreSection = this.findBetween(html, 'Genres:</b>', '</div>');
      if (genreSection) {
        const genreMatches = genreSection.match(/<span[^>]*class="[^"]*whitespace-nowrap[^"]*"[^>]*q:key="kd_0"[^>]*>(?:<!--[^>]*-->)?([^<]+)/gi);
        if (genreMatches) {
          genreMatches.forEach(function(match) {
            const genreText = match.match(/>(?:<!--[^>]*-->)?([^<]+)/);
            if (genreText && genreText[1]) {
              const genre = genreText[1].trim();
              if (genre && !genres.includes(genre)) {
                genres.push(genre);
              }
            }
          });
        }
      }

      // Extract chapters
      const chapters = [];
      // Match chapter links: <a href="/title/.../9985751-chapter-11"...>Chapter 11</a>
      const chapterMatches = html.match(/<a[^>]*href="(\/title\/[^"]*\/\d+-(?:chapter-|ch-)[^"]*)"[^>]*>([^<]+)<\/a>/gi);
      if (chapterMatches) {
        const seenIds = {};
        chapterMatches.forEach(function(match) {
          try {
            const urlMatch = match.match(/href="([^"]*)"/i);
            const textMatch = match.match(/>([^<]+)<\/a>/i);

            if (urlMatch && textMatch) {
              const chapterUrl = urlMatch[1];
              let chapterTitle = textMatch[1].trim();

              // Skip non-chapter links (like "Start Reading: Chapter 1")
              if (chapterTitle.includes('Start Reading')) return;

              // Extract chapter ID
              const idMatch = chapterUrl.match(/\/(\d+-(?:chapter-|ch-)[^\/\?]+)/i);
              if (idMatch && !seenIds[idMatch[1]]) {
                seenIds[idMatch[1]] = true;
                const chapterId = idMatch[1];

                // Extract chapter number from URL or title
                let chapterNumber = 0;
                const urlNumMatch = chapterUrl.match(/(?:chapter-|ch-)(\d+(?:\.\d+)?)/i);
                const titleNumMatch = chapterTitle.match(/(?:chapter|ch\.?)\s*(\d+(?:\.\d+)?)/i);
                if (urlNumMatch) {
                  chapterNumber = parseFloat(urlNumMatch[1]);
                } else if (titleNumMatch) {
                  chapterNumber = parseFloat(titleNumMatch[1]);
                }

                chapters.push({
                  id: chapterId,
                  number: chapterNumber,
                  title: chapterTitle,
                  url: extractor.ensureAbsoluteUrl(chapterUrl),
                  date: ""
                });
              }
            }
          } catch (e) {
            console.error("Error parsing chapter", e);
          }
        });
      }

      // Sort chapters by number descending
      chapters.sort(function(a, b) { return b.number - a.number; });

      if (this.debug) console.log("Found " + chapters.length + " chapters");

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
   * Structure: <div id="images">
   *   - Each image in <div data-name="image-item">
   *   - Image URL in <img src="https://sXX.mpmok.org/media/mpup/...">
   */
  parseChapterImages: function(html) {
    try {
      if (this.debug) console.log("Starting to parse chapter images");
      const images = [];

      // Find images container
      const imagesContainer = this.findBetween(html, 'id="images"', '</div></div></div>');

      if (imagesContainer) {
        // Extract all image URLs from img tags with mpmok.org or mangapark CDN
        const imgMatches = imagesContainer.match(/<img[^>]*src="(https?:\/\/[^"]*(?:mpmok\.org|mangapark)[^"]*)"/gi);

        if (imgMatches) {
          imgMatches.forEach(function(match) {
            const srcMatch = match.match(/src="([^"]*)"/i);
            if (srcMatch && srcMatch[1]) {
              const imageUrl = srcMatch[1];
              // Filter out small thumbnails and avatars
              if (!imageUrl.includes('/thumb/') &&
                  !imageUrl.includes('/mpav/') &&
                  !imageUrl.includes('_300_')) {
                if (!images.includes(imageUrl)) {
                  images.push(imageUrl);
                }
              }
            }
          });
        }
      }

      // Fallback: look for any mpmok.org images in the entire HTML
      if (images.length === 0) {
        if (this.debug) console.log("Trying fallback image extraction");
        const allImgMatches = html.match(/<img[^>]*src="(https?:\/\/s\d+\.mpmok\.org\/media\/mpup\/[^"]*)"/gi);
        if (allImgMatches) {
          allImgMatches.forEach(function(match) {
            const srcMatch = match.match(/src="([^"]*)"/i);
            if (srcMatch && srcMatch[1]) {
              const imageUrl = srcMatch[1];
              if (!images.includes(imageUrl)) {
                images.push(imageUrl);
              }
            }
          });
        }
      }

      if (this.debug) console.log("Found " + images.length + " chapter images");
      return { success: true, images: images };
    } catch (e) {
      console.error("Failed to extract chapter images", e);
      return { success: false, error: e.toString(), images: [] };
    }
  },

  /**
   * Parse available genres from HTML
   */
  parseGenres: function(html) {
    try {
      if (this.debug) console.log("Starting to parse genres");
      const genres = [];

      // MangaPark uses genre filters in browse page
      const genreMatches = html.match(/genres=([a-z_]+)/gi);
      if (genreMatches) {
        const seenGenres = {};
        genreMatches.forEach(function(match) {
          const genreId = match.replace('genres=', '');
          if (!seenGenres[genreId]) {
            seenGenres[genreId] = true;
            // Convert snake_case to Title Case
            const genreName = genreId.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
            genres.push({ id: genreId, name: genreName });
          }
        });
      }

      if (this.debug) console.log("Found " + genres.length + " genres");
      return { success: true, genres: genres };
    } catch (e) {
      console.error("Failed to extract genres", e);
      return { success: false, error: e.toString(), genres: [] };
    }
  }
};

// Return the extractor object
extractor;
