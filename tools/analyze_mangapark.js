// Tool to analyze mangapark HTML structure
const fs = require('fs');
const path = require('path');

const listHtml = fs.readFileSync(path.join(__dirname, '../sources/mangapark/example-manga-list.html'), 'utf8');
const chapterHtml = fs.readFileSync(path.join(__dirname, '../sources/mangapark/example-chapter-pages.html'), 'utf8');

console.log('=== MANGA LIST ANALYSIS ===');
console.log('File length:', listHtml.length);

// Find title links
const titlePattern = /href="\/title\/([^"]+)"/g;
let titles = [];
let m;
while ((m = titlePattern.exec(listHtml)) !== null) {
  if (!titles.includes(m[1])) titles.push(m[1]);
}
console.log('\nTitle links found:', titles.length);
titles.slice(0, 10).forEach(t => console.log('  /title/' + t));

// Find cover images
const coverPattern = /src="([^"]*thumb[^"]*)"/g;
let covers = [];
while ((m = coverPattern.exec(listHtml)) !== null) {
  if (!covers.includes(m[1])) covers.push(m[1]);
}
console.log('\nCover images found:', covers.length);
covers.slice(0, 5).forEach(c => console.log('  ' + c.substring(0, 100)));

// Search for manga item containers
const containerPatterns = [
  'class="flex',
  'data-comic',
  'data-manga',
  'comic-item',
  'manga-item'
];

console.log('\nContainer patterns:');
containerPatterns.forEach(p => {
  const count = (listHtml.match(new RegExp(p, 'g')) || []).length;
  console.log('  ' + p + ': ' + count);
});

console.log('\n=== CHAPTER PAGES ANALYSIS ===');
console.log('File length:', chapterHtml.length);

// Find image URLs
const imgPattern = /https?:\/\/[^"'\s<>]+\.(jpg|jpeg|png|webp)/gi;
let imgs = new Set();
while ((m = imgPattern.exec(chapterHtml)) !== null) {
  imgs.add(m[0]);
}
console.log('\nImage URLs found:', imgs.size);
[...imgs].slice(0, 10).forEach(i => console.log('  ' + i.substring(0, 100)));

// Look for JSON data patterns
const jsonPatterns = [
  'imgList',
  'pageList',
  'images:',
  'urls:',
  '"url":',
  'data-images'
];

console.log('\nJSON data patterns:');
jsonPatterns.forEach(p => {
  const idx = chapterHtml.indexOf(p);
  if (idx !== -1) {
    console.log('  ' + p + ' found at index ' + idx);
    console.log('    context: ' + chapterHtml.substring(idx, idx + 200).replace(/\n/g, ' ').substring(0, 100));
  }
});

// Look for specific script blocks
const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let scripts = [];
while ((m = scriptPattern.exec(chapterHtml)) !== null) {
  if (m[1].includes('img') || m[1].includes('page') || m[1].includes('image')) {
    scripts.push(m[1].substring(0, 200));
  }
}
console.log('\nRelevant scripts:', scripts.length);
scripts.slice(0, 3).forEach((s, i) => console.log('  Script ' + (i+1) + ': ' + s.replace(/\n/g, ' ').substring(0, 100)));
