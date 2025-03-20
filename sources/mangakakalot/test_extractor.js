// Test script for MangaKakalot extractor with sample HTML
const fs = require('fs');
const path = require('path');

// Load the extractor
const extractorPath = path.join(__dirname, 'extract.js');
const extractorCode = fs.readFileSync(extractorPath, 'utf8');
const extractor = eval(extractorCode);

// Sample HTML from a real chapter page

const htmlpath = path.join(__dirname, 'example-chapter-pages.html');
const sampleHtml =  fs.readFileSync(htmlpath, 'utf8');


// Function to test the chapter image extraction
function testChapterImageExtraction() {
  console.log('Testing MangaKakalot chapter image extraction with sample HTML...');
  
  // Parse chapter images
  const result = extractor.parseChapterImages(sampleHtml);
  
  // Display the results
  console.log('Success:', result.success);
  console.log('Total images found:', result.images.length);
  
  if (result.images.length > 0) {
    console.log('\nFirst 5 image URLs:');
    for (let i = 0; i < Math.min(5, result.images.length); i++) {
      console.log(`${i + 1}. ${result.images[i]}`);
    }
    
    console.log('\nLast 5 image URLs:');
    for (let i = Math.max(0, result.images.length - 5); i < result.images.length; i++) {
      console.log(`${i + 1}. ${result.images[i]}`);
    }
  } else {
    console.log('No images found!');
  }
  
  return result.success && result.images.length > 0;
}

// Run the test
const success = testChapterImageExtraction();
console.log('\nTest result:', success ? 'PASSED ✅' : 'FAILED ❌');

// Export the processed image URLs
if (success) {
  // Create a hardcoded fallback file for the app to use
  const imageUrls = extractor.parseChapterImages(sampleHtml).images;
  fs.writeFileSync(path.join(__dirname, 'fallback_images.json'), JSON.stringify({
    images: imageUrls
  }, null, 2));
  console.log('Created fallback_images.json with', imageUrls.length, 'images');
}