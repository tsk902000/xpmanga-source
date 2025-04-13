// helpers.js - Utility functions for MangaKakalot Extractor

/**
 * Make sure URL is absolute
 * @param {string} url
 * @param {string} baseUrl
 * @returns {string}
 */
function ensureAbsoluteUrl(url, baseUrl) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return baseUrl + (url.startsWith("/") ? url : "/" + url);
}

/**
 * Find text between markers
 * @param {string} text
 * @param {string} start
 * @param {string} end
 * @returns {string}
 */
function findBetween(text, start, end) {
  const startPos = text.indexOf(start);
  if (startPos === -1) return "";
  const endPos = end ? text.indexOf(end, startPos + start.length) : text.length;
  if (endPos === -1) return "";
  return text.substring(startPos + start.length, endPos);
}

/**
 * Extract attribute from HTML tag
 * @param {string} html
 * @param {string} attrName
 * @returns {string}
 */
function extractAttribute(html, attrName) {
  const regex = new RegExp(attrName + '=["\']([^"\']*)["\']', 'i');
  const match = html.match(regex);
  return match ? match[1] : "";
}

/**
 * Clean text content (remove HTML tags and trim)
 * @param {string} text
 * @returns {string}
 */
function cleanText(text) {
  if (!text) return "";
  return text.replace(/<[^>]*>/g, "").trim();
}

/**
 * Extract image URL from an image tag
 * @param {string} imgTag
 * @param {string} baseUrl
 * @param {function} logFn (optional)
 * @returns {string|null}
 */
function extractImageUrl(imgTag, baseUrl, logFn) {
  if (!imgTag) return null;
  if (logFn) logFn("Processing image tag: " + imgTag);

  // Look for all possible image attributes
  const attributes = [
    "data-src",
    "data-original",
    "data-lazy-src",
    "data-srcset",
    "data-url",
    "data-image",
    "src"
  ];

  // First Check Regular
  for (let attr of attributes) {
    const regex = new RegExp(attr + '=["\'](https?://[^"\']+)["\']', 'i');
    const match = imgTag.match(regex);
    if (match && match[1]) {
      const url = match[1].trim();
      if (logFn) logFn("Found image URL in " + attr + ": " + url);
      return url;
    }
  }

  // Then check fallback
  const onerrorMatch = imgTag.match(/onerror="[^"]*this\.src='([^']+)'/);
  if (onerrorMatch && onerrorMatch[1]) {
    const url = onerrorMatch[1].trim();
    if (logFn) logFn("Found fallback URL in onerror: " + url);
    return ensureAbsoluteUrl(url, baseUrl);
  }

  if (logFn) logFn("No image URL found in tag when extracting url");
  return null;
}

module.exports = {
  ensureAbsoluteUrl,
  findBetween,
  extractAttribute,
  cleanText,
  extractImageUrl
};