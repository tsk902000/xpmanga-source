// KissManga Extractor v1.0.0
var extractor = {
  id: "kissmanga",
  name: "KissManga",
  version: "1.0.0",
  baseUrl: "https://kissmanga.in",
  icon: "https://kissmanga.in/wp-content/uploads/2020/01/cropped-logo-192x192.png",
  imageproxy: "",
  imageReferer: "https://kissmanga.in/",
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
    { id: "latest", name: "Latest", url: "mangalist/page/{page}?m_orderby=latest" },
    { id: "popular", name: "Popular", url: "mangalist/page/{page}?m_orderby=views" },
    { id: "new", name: "New", url: "mangalist/page/{page}?m_orderby=new-manga" },
    { id: "az", name: "A-Z", url: "mangalist/page/{page}?m_orderby=alphabet" }
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
    return text.replace(/<[^>]*>/g, "").replace(/<!--[^>]*-->/g, "").replace(/\s+/g, " ").trim();
  },

  /**
   * Helper: Extract text between markers
   */
  findBetween: function(text, start, end) {
    var startPos = text.indexOf(start);
    if (startPos === -1) return "";
    var endPos = end ? text.indexOf(end, startPos + start.length) : text.length;
    if (endPos === -1) return "";
    return text.substring(startPos + start.length, endPos);
  },

  /**
   * Helper: Extract attribute from HTML tag
   */
  extractAttribute: function(html, attrName) {
    var regex = new RegExp(attrName + '=["\']([^"\']*)["\']', 'i');
    var match = html.match(regex);
    return match ? match[1] : "";
  },

  /**
   * Helper: Extract image URL from img tag
   */
  extractImageUrl: function(imgTag) {
    if (!imgTag) return null;

    var attributes = ["data-src", "data-original", "data-lazy-src", "srcset", "src"];

    for (var i = 0; i < attributes.length; i++) {
      var attr = attributes[i];
      var regex = new RegExp(attr + '=["\']\\s*(https?://[^"\'\\s]+)', 'i');
      var match = imgTag.match(regex);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  },

  /**
   * Helper: Extract manga ID from URL
   */
  extractMangaId: function(url) {
    if (!url) return "";
    // Pattern: https://kissmanga.in/kissmanga/{manga-slug}/
    var match = url.match(/\/kissmanga\/([^\/]+)/i);
    return match ? match[1] : "";
  },

  /**
   * Get URLs for different manga lists
   */
  getListUrl: function(type, page) {
    if (page === undefined) page = 1;

    // Find the category by ID
    var category = null;
    for (var i = 0; i < this.categories.length; i++) {
      if (this.categories[i].id === type) {
        category = this.categories[i];
        break;
      }
    }

    if (category && category.url) {
      return this.ensureAbsoluteUrl(category.url.replace("{page}", page));
    }

    // Fallback to latest
    return this.baseUrl + "/?m_orderby=latest&page=" + page;
  },

  /**
   * Get URL for search
   */
  getSearchUrl: function(query, page) {
    if (page === undefined) page = 1;
    return this.baseUrl + "/?s=" + encodeURIComponent(query) + "&post_type=wp-manga&paged=" + page;
  },

  /**
   * Get URL for genre
   */
  getGenreUrl: function(genre, page) {
    if (page === undefined) page = 1;
    return this.baseUrl + "/manga-genre/" + encodeURIComponent(genre) + "/page/" + page + "/";
  },

  /**
   * Parse manga list from HTML
   * Structure: <div class="page-item-detail manga">
   *   - Title in <h3 class="h5"><a href="...">Title</a></h3>
   *   - Cover in <img src="...">
   *   - Chapter in <a class="btn-link">Chapter X</a>
   */
  parseMangaList: function(html) {
    try {
      if (this.debug) console.log("Starting to parse manga list");
      var items = [];

      // Split by manga item containers
      var mangaBlocks = html.split(/class="page-item-detail manga/);

      for (var i = 1; i < mangaBlocks.length; i++) {
        try {
          var block = mangaBlocks[i];
          var mangaHtml = block.substring(0, 5000);

          // Extract title and URL from h3 > a
          var title = "", url = "";
          var titleMatch = mangaHtml.match(/<h3[^>]*class="h5"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/i);
          if (titleMatch) {
            url = titleMatch[1];
            title = this.cleanText(titleMatch[2]);
          }

          // Extract cover URL from img tag
          var coverUrl = "";
          var imgMatch = mangaHtml.match(/<img[^>]*(?:src|srcset)="([^"\s]+)/i);
          if (imgMatch) {
            coverUrl = imgMatch[1].trim();
          }

          // Extract last chapter info
          var lastChapter = "", lastChapterId = "";
          var chapterMatch = mangaHtml.match(/<a[^>]*href="([^"]*\/chapter-[^"]*)"[^>]*class="btn-link"[^>]*>\s*([^<]+)/i);
          if (!chapterMatch) {
            chapterMatch = mangaHtml.match(/<a[^>]*class="btn-link"[^>]*href="([^"]*\/chapter-[^"]*)"[^>]*>\s*([^<]+)/i);
          }
          if (chapterMatch) {
            var chapterUrl = chapterMatch[1];
            lastChapter = this.cleanText(chapterMatch[2]);
            // Extract chapter ID from URL
            var chIdMatch = chapterUrl.match(/\/(chapter-[^\/]+)/i);
            if (chIdMatch) {
              lastChapterId = chIdMatch[1];
            }
          }

          // Extract manga ID from URL
          var id = this.extractMangaId(url);

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
   *   - Title in <h1>Title</h1>
   *   - Cover in <div class="summary_image"><img>
   *   - Description in <div class="summary__content"><p>...</p></div>
   *   - Author in <div class="author-content"><a>...</a></div>
   *   - Status in Status section
   *   - Genres in <div class="genres-content">
   *   - Chapters in <li class="wp-manga-chapter"><a>...</a></li>
   */
  parseMangaDetails: function(html) {
    try {
      if (this.debug) console.log("Starting to parse manga details");

      // Extract title from <h1>
      var title = "";
      var titleMatch = html.match(/<div[^>]*class="post-title"[^>]*>[\s\S]*?<h1[^>]*>([^<]+)<\/h1>/i);
      if (titleMatch) {
        title = this.cleanText(titleMatch[1]);
      }

      // Extract cover from summary_image
      var coverUrl = "";
      var coverSection = this.findBetween(html, 'class="summary_image"', '</div>');
      if (coverSection) {
        var coverMatch = coverSection.match(/<img[^>]*src="([^"]+)"/i);
        if (coverMatch) {
          coverUrl = coverMatch[1];
        }
      }

      // Extract description
      var description = "";
      var descMatch = html.match(/<div[^>]*class="summary__content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      if (descMatch) {
        description = this.cleanText(descMatch[1]);
      }

      // Extract author
      var author = "";
      var authorSection = this.findBetween(html, 'class="author-content"', '</div>');
      if (authorSection) {
        var authorMatch = authorSection.match(/<a[^>]*>([^<]+)<\/a>/i);
        if (authorMatch) {
          author = this.cleanText(authorMatch[1]);
        }
      }

      // Extract status
      var status = "";
      var statusSection = this.findBetween(html, '<h5>\n\t\t\tStatus', '</div>');
      if (statusSection) {
        var statusMatch = statusSection.match(/<div[^>]*class="summary-content"[^>]*>([^<]+)/i);
        if (statusMatch) {
          status = this.cleanText(statusMatch[1]);
        }
      }
      if (!status) {
        var statusMatch2 = html.match(/Status[\s\S]*?<div[^>]*class="summary-content"[^>]*>\s*([^<]+)/i);
        if (statusMatch2) {
          status = this.cleanText(statusMatch2[1]);
        }
      }

      // Extract genres
      var genres = [];
      var genreSection = this.findBetween(html, 'class="genres-content"', '</div>');
      if (genreSection) {
        var genreMatches = genreSection.match(/<a[^>]*>([^<]+)<\/a>/gi);
        if (genreMatches) {
          for (var i = 0; i < genreMatches.length; i++) {
            var gMatch = genreMatches[i].match(/>([^<]+)</);
            if (gMatch && gMatch[1]) {
              var genre = this.cleanText(gMatch[1]);
              if (genre && genres.indexOf(genre) === -1) {
                genres.push(genre);
              }
            }
          }
        }
      }

      // Extract chapters from <li class="wp-manga-chapter">
      var chapters = [];
      var chapterMatches = html.match(/<li[^>]*class="wp-manga-chapter[^"]*"[^>]*>[\s\S]*?<\/li>/gi);
      if (chapterMatches) {
        var seenIds = {};
        for (var j = 0; j < chapterMatches.length; j++) {
          try {
            var chapterHtml = chapterMatches[j];

            // Extract URL and title
            var urlMatch = chapterHtml.match(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/i);
            if (urlMatch) {
              var chapterUrl = urlMatch[1];
              var chapterTitle = this.cleanText(urlMatch[2]);

              // Extract chapter ID from URL
              var idMatch = chapterUrl.match(/\/(chapter-[^\/]+)/i);
              if (idMatch && !seenIds[idMatch[1]]) {
                seenIds[idMatch[1]] = true;
                var chapterId = idMatch[1];

                // Extract chapter number
                var chapterNumber = 0;
                var numMatch = chapterTitle.match(/Chapter\s*(\d+(?:\.\d+)?)/i);
                if (numMatch) {
                  chapterNumber = parseFloat(numMatch[1]);
                } else {
                  var urlNumMatch = chapterId.match(/chapter-(\d+(?:[.-]\d+)?)/i);
                  if (urlNumMatch) {
                    chapterNumber = parseFloat(urlNumMatch[1].replace('-', '.'));
                  }
                }

                // Extract date
                var date = "";
                var dateMatch = chapterHtml.match(/<span[^>]*class="chapter-release-date"[^>]*>[\s\S]*?<i>([^<]+)<\/i>/i);
                if (dateMatch) {
                  date = this.cleanText(dateMatch[1]);
                }

                chapters.push({
                  id: chapterId,
                  number: chapterNumber,
                  title: chapterTitle,
                  url: chapterUrl,
                  date: date
                });
              }
            }
          } catch (e) {
            console.error("Error parsing chapter", e);
          }
        }
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
   * Structure: <div class="reading-content">
   *   - Each image in <div class="page-break"><img src="..." class="wp-manga-chapter-img"></div>
   */
  parseChapterImages: function(html) {
    try {
      if (this.debug) console.log("Starting to parse chapter images");
      var images = [];

      // Find reading-content section
      var readingContent = this.findBetween(html, 'class="reading-content"', '</div>\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t</div>');
      if (!readingContent) {
        readingContent = this.findBetween(html, 'class="reading-content"', 'class="entry-header header"');
      }
      if (!readingContent) {
        readingContent = html;
      }

      // Extract all images with class wp-manga-chapter-img
      var imgMatches = readingContent.match(/<img[^>]*class="wp-manga-chapter-img"[^>]*>/gi);
      if (!imgMatches) {
        // Fallback: look for images in page-break divs
        imgMatches = readingContent.match(/<div[^>]*class="page-break[^"]*"[^>]*>[\s\S]*?<img[^>]*>/gi);
      }

      if (imgMatches) {
        for (var i = 0; i < imgMatches.length; i++) {
          var imgTag = imgMatches[i];
          // Extract src (note: kissmanga has leading space in src)
          var srcMatch = imgTag.match(/src="\s*(https?:\/\/[^"]+)"/i);
          if (srcMatch && srcMatch[1]) {
            var imageUrl = srcMatch[1].trim();
            // Filter out thumbnails and small images
            if (imageUrl.indexOf('/thumb') === -1 &&
                imageUrl.indexOf('-75x') === -1 &&
                imageUrl.indexOf('-110x') === -1 &&
                imageUrl.indexOf('-175x') === -1 &&
                imageUrl.indexOf('-193x') === -1) {
              if (images.indexOf(imageUrl) === -1) {
                images.push(imageUrl);
              }
            }
          }
        }
      }

      // Fallback: look for any imgcdn.co images in reading-content
      if (images.length === 0) {
        if (this.debug) console.log("Trying fallback image extraction");
        var allImgMatches = readingContent.match(/src="\s*(https?:\/\/[^"]*imgcdn\.co[^"]*)"/gi);
        if (allImgMatches) {
          for (var j = 0; j < allImgMatches.length; j++) {
            var match = allImgMatches[j].match(/src="\s*(https?:\/\/[^"]+)"/i);
            if (match && match[1]) {
              var url = match[1].trim();
              // Only include manga chapter images
              if (url.indexOf('/WP-manga/data/') !== -1 && images.indexOf(url) === -1) {
                images.push(url);
              }
            }
          }
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
      var genres = [];
      var seenGenres = {};

      // KissManga genre links: /manga-genre/{genre}/
      var genreMatches = html.match(/<a[^>]*href="[^"]*\/manga-genre\/([^\/]+)\/"[^>]*>([^<]+)<\/a>/gi);
      if (genreMatches) {
        for (var i = 0; i < genreMatches.length; i++) {
          var match = genreMatches[i].match(/\/manga-genre\/([^\/]+)\/"[^>]*>([^<]+)<\/a>/i);
          if (match && match[1] && match[2]) {
            var genreId = match[1];
            var genreName = this.cleanText(match[2]);
            if (!seenGenres[genreId] && genreName) {
              seenGenres[genreId] = true;
              genres.push({ id: genreId, name: genreName });
            }
          }
        }
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
