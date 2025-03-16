// Test script for MangaKakalot extractor with sample HTML
const fs = require('fs');
const path = require('path');

// Load the extractor
const extractorPath = path.join(__dirname, 'extract.js');
const extractorCode = fs.readFileSync(extractorPath, 'utf8');
const extractor = eval(extractorCode);

// Sample HTML from a real chapter page
const sampleHtml = `
<div class="container-chapter-reader">
        <input type="hidden" name="_token" value="tXm5BCu9sieSD8BoTQKhnGHK9X5qg0KUbQggZdVl">        <img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/0.webp" alt="Hero Contest Pokong Chapter 48 page 1 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 1 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/0.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/1.webp" alt="Hero Contest Pokong Chapter 48 page 2 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 2 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/1.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/2.webp" alt="Hero Contest Pokong Chapter 48 page 3 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 3 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/2.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/3.webp" alt="Hero Contest Pokong Chapter 48 page 4 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 4 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/3.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/4.webp" alt="Hero Contest Pokong Chapter 48 page 5 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 5 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/4.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/5.webp" alt="Hero Contest Pokong Chapter 48 page 6 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 6 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/5.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/6.webp" alt="Hero Contest Pokong Chapter 48 page 7 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 7 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/6.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/7.webp" alt="Hero Contest Pokong Chapter 48 page 8 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 8 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/7.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/8.webp" alt="Hero Contest Pokong Chapter 48 page 9 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 9 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/8.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/9.webp" alt="Hero Contest Pokong Chapter 48 page 10 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 10 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/9.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/10.webp" alt="Hero Contest Pokong Chapter 48 page 11 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 11 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/10.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/11.webp" alt="Hero Contest Pokong Chapter 48 page 12 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 12 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/11.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/12.webp" alt="Hero Contest Pokong Chapter 48 page 13 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 13 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/12.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/13.webp" alt="Hero Contest Pokong Chapter 48 page 14 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 14 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/13.webp';" loading="lazy"><img id="image-scroll-trigger" src="https://img-r1.2xstorage.com/hero-contest-pokong/48/14.webp" alt="Hero Contest Pokong Chapter 48 page 15 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 15 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/14.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/15.webp" alt="Hero Contest Pokong Chapter 48 page 16 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 16 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/15.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/16.webp" alt="Hero Contest Pokong Chapter 48 page 17 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 17 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/16.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/17.webp" alt="Hero Contest Pokong Chapter 48 page 18 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 18 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/17.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/18.webp" alt="Hero Contest Pokong Chapter 48 page 19 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 19 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/18.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/19.webp" alt="Hero Contest Pokong Chapter 48 page 20 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 20 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/19.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/20.webp" alt="Hero Contest Pokong Chapter 48 page 21 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 21 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/20.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/21.webp" alt="Hero Contest Pokong Chapter 48 page 22 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 22 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/21.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/22.webp" alt="Hero Contest Pokong Chapter 48 page 23 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 23 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/22.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/23.webp" alt="Hero Contest Pokong Chapter 48 page 24 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 24 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/23.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/24.webp" alt="Hero Contest Pokong Chapter 48 page 25 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 25 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/24.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/25.webp" alt="Hero Contest Pokong Chapter 48 page 26 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 26 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/25.webp';" loading="lazy"><img src="https://img-r1.2xstorage.com/hero-contest-pokong/48/26.webp" alt="Hero Contest Pokong Chapter 48 page 27 - MangaKakalot" title="Hero Contest Pokong Chapter 48 page 27 - MangaKakalot" onerror="this.onerror=null;this.src='https://imgs-2.2xstorage.com/hero-contest-pokong/48/26.webp';" loading="lazy">
    </div>
`;

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