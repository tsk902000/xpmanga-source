// Generic test script for all extractors
// Run with: node debug/test_generic_extractor.js

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Load all sources configuration
console.log('Loading sources configuration...');
const allSourcesPath = path.join(__dirname, '..', 'all_source.json');
const allSourcesConfig = JSON.parse(fs.readFileSync(allSourcesPath, 'utf8'));
console.log(`Found ${allSourcesConfig.sources.length} sources to test`);

// Function to fetch HTML content
async function fetchHtml(url, referer) {
  console.log(`Fetching HTML from: ${url}`);
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        ...(referer && { 'Referer': referer })
      }
    };

    client.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch HTML: ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`Fetched HTML: ${data.length} bytes`);
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Function to check if an image is accessible
async function checkImageAccessibility(imageUrl, referer) {
  return new Promise((resolve, reject) => {
    const client = imageUrl.startsWith('https') ? https : http;

    const options = {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        ...(referer && { 'Referer': referer })
      }
    };

    const req = client.request(imageUrl, options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

// Load a source's meta.json
function loadSourceMeta(metaUrl) {
  // Check if it's a local path or URL
  if (metaUrl.startsWith('http')) {
    // For now, we'll use local paths since we're testing locally
    // Extract source name from URL
    const match = metaUrl.match(/sources\/([^\/]+)\/meta\.json/);
    if (match) {
      const sourceName = match[1];
      const localMetaPath = path.join(__dirname, '..', 'sources', sourceName, 'meta.json');
      if (fs.existsSync(localMetaPath)) {
        return JSON.parse(fs.readFileSync(localMetaPath, 'utf8'));
      }
    }
    throw new Error(`Could not find local meta.json for ${metaUrl}`);
  } else {
    return JSON.parse(fs.readFileSync(metaUrl, 'utf8'));
  }
}

// Load a source's extractor
function loadExtractor(meta) {
  const scriptUrl = meta.script;
  let extractorPath;

  if (scriptUrl.startsWith('http')) {
    // Extract source name from URL
    const match = scriptUrl.match(/sources\/([^\/]+)\/extract\.js/);
    if (match) {
      const sourceName = match[1];
      extractorPath = path.join(__dirname, '..', 'sources', sourceName, 'extract.js');
    } else {
      throw new Error(`Could not determine extractor path from ${scriptUrl}`);
    }
  } else {
    extractorPath = scriptUrl;
  }

  if (!fs.existsSync(extractorPath)) {
    throw new Error(`Extractor not found at ${extractorPath}`);
  }

  const extractorCode = fs.readFileSync(extractorPath, 'utf8');
  eval(extractorCode);
  return extractor;
}

// Get test URLs for a source (can be customized per source)
function getTestUrls(meta) {
  const baseUrl = meta.baseUrl.replace(/\/$/, '');
  
  // Default test URLs - these can be overridden per source
  const testUrls = {
    mangakakalot: {
      list: `${baseUrl}/manga-list/latest-manga`,
      manga: `${baseUrl}/manga/the-war-of-corpses/`,
      chapter: `${baseUrl}/manga/the-war-of-corpses/chapter-7`
    },
    mangapark: {
      list: `${baseUrl}/search?q=`,
      manga: `${baseUrl}/comic/12345`, // Placeholder - will need real URL
      chapter: `${baseUrl}/comic/12345/1` // Placeholder - will need real URL
    }
  };

  // Try to match source name (case insensitive)
  const sourceName = Object.keys(testUrls).find(key => 
    meta.name.toLowerCase().includes(key.toLowerCase())
  );

  if (sourceName) {
    return testUrls[sourceName];
  }

  // Fallback to generic pattern
  return {
    list: `${baseUrl}/manga-list`,
    manga: `${baseUrl}/manga/test`,
    chapter: `${baseUrl}/manga/test/chapter-1`
  };
}

// Test manga list extraction
async function testMangaListExtraction(listUrl, extractor, referer) {
  try {
    console.log(`\n=== Testing manga list extraction for: ${listUrl} ===\n`);

    const html = await fetchHtml(listUrl, referer);
    console.log('Parsing manga list...');
    const result = extractor.parseMangaList(html);

    console.log(`\nExtraction success: ${result.success}`);
    console.log(`Found ${result.items.length} manga items`);

    if (result.items.length > 0) {
      console.log('\nFirst 5 manga items:');
      for (let i = 0; i < Math.min(5, result.items.length); i++) {
        const item = result.items[i];
        console.log(`${i + 1}. ${item.title}`);
        console.log(`   URL: ${item.url}`);
        console.log(`   Cover: ${item.cover}`);
        console.log(`   Latest Chapter: ${item.lastChapter} (${item.lastChapterId})`);
        
        if (!item.lastChapter) {
            console.warn(`   WARNING: Missing latestChapter for ${item.title}`);
        }
      }
    }

    return {
      success: result.success,
      itemCount: result.items.length,
      items: result.items
    };
  } catch (error) {
    console.error('Test failed with error:', error);
    return {
      success: false,
      itemCount: 0,
      items: [],
      error: error.message
    };
  }
}

// Test manga details extraction
async function testMangaDetailsExtraction(mangaUrl, extractor, referer) {
  try {
    console.log(`\n=== Testing manga details extraction for: ${mangaUrl} ===\n`);

    const html = await fetchHtml(mangaUrl, referer);
    console.log('Parsing manga details...');
    const result = extractor.parseMangaDetails(html);

    console.log(`\nExtraction success: ${result.success}`);
    if (result.success && result.manga) {
      console.log(`Title: ${result.manga.title}`);
      console.log(`Author: ${result.manga.author}`);
      console.log(`Status: ${result.manga.status}`);
      console.log(`Chapters: ${result.manga.chapters.length}`);

      if (result.manga.chapters.length > 0) {
        console.log('\nFirst 3 chapters:');
        for (let i = 0; i < Math.min(3, result.manga.chapters.length); i++) {
          const chapter = result.manga.chapters[i];
          console.log(`${i + 1}. ${chapter.title} (${chapter.number}) - ${chapter.url}`);
        }
      }
    }

    return {
      success: result.success,
      manga: result.manga
    };
  } catch (error) {
    console.error('Test failed with error:', error);
    return {
      success: false,
      manga: null,
      error: error.message
    };
  }
}

// Test chapter image extraction
async function testChapterImageExtraction(chapterUrl, extractor, referer) {
  try {
    console.log(`\n=== Testing image extraction for: ${chapterUrl} ===\n`);

    const html = await fetchHtml(chapterUrl, referer);
    console.log('Parsing chapter images...');
    const result = extractor.parseChapterImages(html);

    console.log(`\nExtraction success: ${result.success}`);
    console.log(`Found ${result.images.length} images`);

    if (result.images.length > 0) {
      console.log('\nFirst 5 image URLs:');
      for (let i = 0; i < Math.min(5, result.images.length); i++) {
        console.log(`${i + 1}. ${result.images[i]}`);
      }

      // Test if the images are accessible
      console.log('\nTesting image accessibility:');
      for (let i = 0; i < Math.min(3, result.images.length); i++) {
        try {
          const imageUrl = result.images[i];
          const isAccessible = await checkImageAccessibility(imageUrl, referer);
          console.log(`Image ${i + 1}: ${isAccessible ? 'Accessible' : 'Not accessible'}`);
        } catch (e) {
          console.log(`Image ${i + 1}: Error checking accessibility - ${e.message}`);
        }
      }
    }

    return {
      success: result.success,
      imageCount: result.images.length,
      images: result.images
    };
  } catch (error) {
    console.error('Test failed with error:', error);
    return {
      success: false,
      imageCount: 0,
      images: [],
      error: error.message
    };
  }
}

// Test a single source
async function testSource(metaUrl) {
  const results = {
    source: null,
    meta: null,
    tests: null,
    passed: false,
    error: null
  };

  try {
    console.log('\n' + '='.repeat(60));
    console.log(`Testing source: ${metaUrl}`);
    console.log('='.repeat(60));

    // Load meta and extractor
    const meta = loadSourceMeta(metaUrl);
    results.meta = meta;
    results.source = meta.name;

    console.log(`\nLoading ${meta.name} extractor...`);
    const extractor = loadExtractor(meta);
    console.log(`Loaded extractor version: ${extractor.version}`);
    console.log(`Base URL: ${extractor.baseUrl}`);

    // Get test URLs
    const testUrls = getTestUrls(meta);
    const referer = meta.imageReferer || meta.baseUrl;

    // Run all tests
    const listResult = await testMangaListExtraction(testUrls.list, extractor, referer);
    const detailsResult = await testMangaDetailsExtraction(testUrls.manga, extractor, referer);
    const imageResult = await testChapterImageExtraction(testUrls.chapter, extractor, referer);

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('=== Test Summary ===');
    console.log('='.repeat(50));

    const listPassed = listResult.success && listResult.itemCount > 0;
    const detailsPassed = detailsResult.success && detailsResult.manga && detailsResult.manga.chapters.length > 0;
    const imagesPassed = imageResult.success && imageResult.imageCount > 0;

    console.log(`Manga List Extraction:    ${listPassed ? 'PASSED' : 'FAILED'} (${listResult.itemCount} items)`);
    console.log(`Manga Details Extraction: ${detailsPassed ? 'PASSED' : 'FAILED'} (${detailsResult.manga ? detailsResult.manga.chapters.length : 0} chapters)`);
    console.log(`Chapter Image Extraction: ${imagesPassed ? 'PASSED' : 'FAILED'} (${imageResult.imageCount} images)`);

    const allPassed = listPassed && detailsPassed && imagesPassed;
    console.log('\n' + '='.repeat(50));
    console.log(`Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    console.log('='.repeat(50));

    results.tests = {
      list: listResult,
      details: detailsResult,
      images: imageResult,
      allPassed: allPassed
    };
    results.passed = allPassed;

  } catch (error) {
    console.error(`\nError testing source ${metaUrl}:`, error);
    results.error = error.message;
    results.passed = false;
  }

  return results;
}

// Main test function
async function runAllTests() {
  console.log('=== Generic Extractor Test Suite ===');
  console.log(`Testing ${allSourcesConfig.sources.length} sources`);
  console.log(`Started at: ${new Date().toISOString()}`);

  const allResults = [];

  // Test each source
  for (const metaUrl of allSourcesConfig.sources) {
    const result = await testSource(metaUrl);
    allResults.push(result);
  }

  // Print overall summary
  console.log('\n\n' + '='.repeat(60));
  console.log('=== OVERALL SUMMARY ===');
  console.log('='.repeat(60));

  let passedCount = 0;
  for (const result of allResults) {
    const status = result.passed ? '✓ PASSED' : '✗ FAILED';
    console.log(`${result.source}: ${status}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    if (result.passed) {
      passedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${passedCount}/${allResults.length} sources passed`);
  console.log('='.repeat(60));

  // Write results to file
  const resultsPath = path.join(__dirname, 'generic_test_results.json');
  const output = {
    timestamp: new Date().toISOString(),
    totalSources: allResults.length,
    passedSources: passedCount,
    results: allResults
  };
  fs.writeFileSync(resultsPath, JSON.stringify(output, null, 2));
  console.log(`\nTest results saved to ${resultsPath}`);

  return passedCount === allResults.length;
}

// Run the tests
runAllTests()
  .then(allPassed => {
    process.exit(allPassed ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
