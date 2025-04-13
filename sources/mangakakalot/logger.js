// logger.js - Centralized debug logging for MangaKakalot Extractor

/**
 * Logger utility that respects a debug flag.
 * Usage: const logger = createLogger(debug);
 *        logger.log("message");
 *        logger.error("error message");
 */
function createLogger(debug) {
  return {
    log: (...args) => {
      if (debug) {
        console.log("[MangaKakalot]", ...args);
      }
    },
    error: (...args) => {
      if (debug) {
        console.error("[MangaKakalot][ERROR]", ...args);
      }
    },
    warn: (...args) => {
      if (debug) {
        console.warn("[MangaKakalot][WARN]", ...args);
      }
    }
  };
}

module.exports = {
  createLogger
};