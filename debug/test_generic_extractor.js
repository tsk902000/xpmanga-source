// Test script for Generic extractor
// Run with: node tests/test_generic_extractor.js

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Load the extractor
const mangaSource = 'mangakakalot';
const mangaSourceURL = 'https://www.mangakakalot.gg/';
const testListUrl = `${mangaSourceURL}manga-list/latest-manga`;
const testMangaUrl = `${mangaSourceURL}manga/the-war-of-corpses/`;
const testChapterUrl = `${mangaSourceURL}manga/the-war-of-corpses/chapter-7`;

console.log(`Loading ${mangaSource} extractor...`);
const extractorPath = path.join(__dirname, '..', 'xpmanga-source', 'sources', mangaSource, 'extract.js');
const extractorCode = fs.readFileSync(extractorPath, 'utf8');
eval(extractorCode);
console.log(`Loaded extractor version: ${extractor.version}`);

// Function to fetch HTML content
async function fetchHtml(url) {
  console.log(`Fetching HTML from: ${url}`);
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'Referer': mangaSourceURL
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
async function checkImageAccessibility(imageUrl) {
  return new Promise((resolve, reject) => {
    const client = imageUrl.startsWith('https') ? https : http;

    const options = {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'Referer': mangaSourceURL
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

// Test manga list extraction
async function testMangaListExtraction(listUrl) {
  try {
    console.log(`\n=== Testing manga list extraction for: ${listUrl} ===\n`);

    const html = await fetchHtml(listUrl);
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
async function testMangaDetailsExtraction(mangaUrl) {
  try {
    console.log(`\n=== Testing manga details extraction for: ${mangaUrl} ===\n`);

    const html = await fetchHtml(mangaUrl);
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
async function testChapterImageExtraction(chapterUrl) {
  try {
    console.log(`\n=== Testing image extraction for: ${chapterUrl} ===\n`);

    const html = await fetchHtml(chapterUrl);
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
          const isAccessible = await checkImageAccessibility(imageUrl);
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

// Main test function
async function runTests() {
  console.log(`=== ${mangaSource} Extractor Test ===`);
  console.log(`Extractor version: ${extractor.version}`);
  console.log(`Base URL: ${extractor.baseUrl}`);

  // Run all tests
  const listResult = await testMangaListExtraction(testListUrl);
  const detailsResult = await testMangaDetailsExtraction(testMangaUrl);
  const imageResult = await testChapterImageExtraction(testChapterUrl);

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

  // Write results to file for reference
  const results = {
    timestamp: new Date().toISOString(),
    extractorVersion: extractor.version,
    mangaList: {
      success: listResult.success,
      itemCount: listResult.itemCount,
      sampleItems: listResult.items.slice(0, 5)
    },
    mangaDetails: {
      success: detailsResult.success,
      title: detailsResult.manga ? detailsResult.manga.title : null,
      chapterCount: detailsResult.manga ? detailsResult.manga.chapters.length : 0
    },
    chapterImages: {
      success: imageResult.success,
      imageCount: imageResult.imageCount,
      sampleImages: imageResult.images.slice(0, 5)
    },
    allPassed: allPassed
  };

  const resultsPath = path.join(__dirname, `${mangaSource}_test_results.json`);
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nTest results saved to ${resultsPath}`);

  return allPassed;
}

// Run the tests
runTests()
  .then(passed => {
    process.exit(passed ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
