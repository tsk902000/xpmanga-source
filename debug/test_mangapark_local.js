// Local test script for mangapark extractor using sample HTML files
// Run with: node debug/test_mangapark_local.js

const fs = require('fs');
const path = require('path');

// Load extractor
const mangaSource = 'mangapark';

console.log(`Loading ${mangaSource} extractor...`);
const extractorPath = path.join(__dirname, '..', 'sources', mangaSource, 'extract.js');
const extractorCode = fs.readFileSync(extractorPath, 'utf8');
eval(extractorCode);
console.log(`Loaded extractor version: ${extractor.version}`);

// Test manga list extraction
function testMangaListExtraction() {
  try {
    console.log(`\n=== Testing manga list extraction ===\n`);

    const htmlPath = path.join(__dirname, '..', 'sources', mangaSource, 'example-homepage.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    console.log(`Loaded HTML from file: ${html.length} bytes`);

    console.log('Parsing manga list...');
    const result = extractor.parseMangaList(html);

    console.log(`\nExtraction success: ${result.success}`);
    console.log(`Found ${result.items.length} manga items`);

    if (result.items.length > 0) {
      console.log('\nManga items:');
      for (let i = 0; i < result.items.length; i++) {
        const item = result.items[i];
        console.log(`${i + 1}. ${item.title}`);
        console.log(`   URL: ${item.url}`);
        console.log(`   Cover: ${item.cover}`);
        console.log(`   Latest Chapter: ${item.lastChapter} (${item.lastChapterId})`);
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
function testMangaDetailsExtraction() {
  try {
    console.log(`\n=== Testing manga details extraction ===\n`);

    const htmlPath = path.join(__dirname, '..', 'sources', mangaSource, 'example-manga-details.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    console.log(`Loaded HTML from file: ${html.length} bytes`);

    console.log('Parsing manga details...');
    const result = extractor.parseMangaDetails(html);

    console.log(`\nExtraction success: ${result.success}`);
    if (result.success && result.manga) {
      console.log(`Title: ${result.manga.title}`);
      console.log(`Author: ${result.manga.author}`);
      console.log(`Status: ${result.manga.status}`);
      console.log(`Genres: ${result.manga.genres.join(', ')}`);
      console.log(`Chapters: ${result.manga.chapters.length}`);

      if (result.manga.chapters.length > 0) {
        console.log('\nChapters:');
        for (let i = 0; i < result.manga.chapters.length; i++) {
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
function testChapterImageExtraction() {
  try {
    console.log(`\n=== Testing image extraction ===\n`);

    const htmlPath = path.join(__dirname, '..', 'sources', mangaSource, 'example-chapter-page.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    console.log(`Loaded HTML from file: ${html.length} bytes`);

    console.log('Parsing chapter images...');
    const result = extractor.parseChapterImages(html);

    console.log(`\nExtraction success: ${result.success}`);
    console.log(`Found ${result.images.length} images`);

    if (result.images.length > 0) {
      console.log('\nImage URLs:');
      for (let i = 0; i < result.images.length; i++) {
        console.log(`${i + 1}. ${result.images[i]}`);
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
function runTests() {
  console.log(`=== ${mangaSource} Extractor Local Test ===`);
  console.log(`Extractor version: ${extractor.version}`);
  console.log(`Base URL: ${extractor.baseUrl}`);

  // Run all tests
  const listResult = testMangaListExtraction();
  const detailsResult = testMangaDetailsExtraction();
  const imageResult = testChapterImageExtraction();

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
      sampleItems: listResult.items
    },
    mangaDetails: {
      success: detailsResult.success,
      title: detailsResult.manga ? detailsResult.manga.title : null,
      chapterCount: detailsResult.manga ? detailsResult.manga.chapters.length : 0
    },
    chapterImages: {
      success: imageResult.success,
      imageCount: imageResult.imageCount,
      sampleImages: imageResult.images
    },
    allPassed: allPassed
  };

  const resultsPath = path.join(__dirname, `${mangaSource}_local_test_results.json`);
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nTest results saved to ${resultsPath}`);

  return allPassed;
}

// Run tests
try {
  const passed = runTests();
  process.exit(passed ? 0 : 1);
} catch (error) {
  console.error('Fatal error:', error);
  process.exit(1);
}
