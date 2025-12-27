#!/usr/bin/env node

/**
 * Webpage Analyzer Tool
 * Downloads HTML from URLs and provides analysis for manga extractor development
 *
 * Usage:
 *   node tools/webpage_analyzer.js download <url> [output-file]
 *   node tools/webpage_analyzer.js download-browser <url> [output-file]  (Uses browser for Cloudflare/anti-bot sites)
 *   node tools/webpage_analyzer.js analyze <html-file>
 *   node tools/webpage_analyzer.js selectors <html-file> <pattern>
 *   node tools/webpage_analyzer.js images <html-file>
 *   node tools/webpage_analyzer.js links <html-file>
 *   node tools/webpage_analyzer.js structure <html-file>
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { spawn } = require('child_process');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Download HTML from a URL
 */
async function downloadHtml(url, outputFile = null) {
    console.log(colorize(`\n📥 Downloading: ${url}`, 'cyan'));
    
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0',
                'DNT': '1',
                'Referer': parsedUrl.origin,
            }
        };
        
        const req = protocol.request(options, (res) => {
            let data = '';
            
            // Handle redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                console.log(colorize(`↪️  Redirecting to: ${res.headers.location}`, 'yellow'));
                downloadHtml(res.headers.location, outputFile).then(resolve).catch(reject);
                return;
            }
            
            if (res.statusCode === 403) {
                console.log(colorize(`⚠️  403 Forbidden - Site may be using Cloudflare or anti-bot protection`, 'yellow'));
                console.log(colorize(`💡 Try using 'download-browser' command instead:`, 'cyan'));
                console.log(colorize(`   node tools/webpage_analyzer.js download-browser ${url}`, 'cyan'));
                reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage} - Site may require browser-based download`));
                return;
            }
            
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                return;
            }
            
            // Handle gzip/deflate encoding
            let stream = res;
            if (res.headers['content-encoding'] === 'gzip') {
                const zlib = require('zlib');
                stream = res.pipe(zlib.createGunzip());
            } else if (res.headers['content-encoding'] === 'deflate') {
                const zlib = require('zlib');
                stream = res.pipe(zlib.createInflate());
            }
            
            stream.on('data', (chunk) => {
                data += chunk;
            });
            
            stream.on('end', () => {
                console.log(colorize(`✅ Downloaded ${data.length} bytes`, 'green'));
                
                if (outputFile) {
                    const dir = path.dirname(outputFile);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    fs.writeFileSync(outputFile, data, 'utf8');
                    console.log(colorize(`💾 Saved to: ${outputFile}`, 'green'));
                }
                
                resolve(data);
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Request timeout (30s)'));
        });
        
        req.end();
    });
}

/**
 * Download HTML using browser (for Cloudflare/anti-bot protected sites)
 * This function uses the browser_action tool to download HTML
 */
async function downloadHtmlBrowser(url, outputFile = null) {
    console.log(colorize(`\n🌐 Downloading via browser: ${url}`, 'cyan'));
    console.log(colorize(`⚠️  Note: This requires browser_action tool to be available`, 'yellow'));
    
    // Create a temporary script that will use browser_action
    const tempScript = `
// Browser-based HTML downloader
const url = "${url}";
const outputFile = ${outputFile ? `"${outputFile}"` : 'null'};

// Navigate to the URL
await browser_action({
    action: "launch",
    url: url,
    coordinate: null,
    size: null,
    text: null,
    path: null
});

// Wait for page to load
await new Promise(resolve => setTimeout(resolve, 5000));

// Get page HTML
const html = await page.evaluate(() => document.documentElement.outerHTML);

// Save to file if specified
if (outputFile) {
    const fs = require('fs');
    const path = require('path');
    const dir = path.dirname(outputFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputFile, html, 'utf8');
    console.log('Saved to: ' + outputFile);
}

// Close browser
await browser_action({
    action: "close",
    url: null,
    coordinate: null,
    size: null,
    text: null,
    path: null
});

console.log(html);
`;
    
    // For now, provide instructions since browser_action is not directly available in Node.js
    console.log(colorize(`\n📋 Browser-based download instructions:`, 'cyan'));
    console.log(colorize(`\nFor Cloudflare/anti-bot protected sites, you can:`, 'yellow'));
    console.log(colorize(`1. Open the URL in your browser`, 'white'));
    console.log(colorize(`2. Right-click and "Save Page As..."`, 'white'));
    console.log(colorize(`3. Or use browser DevTools to copy the HTML`, 'white'));
    console.log(colorize(`4. Save it to your sources/ directory`, 'white'));
    console.log(colorize(`\nAlternative: Use curl with browser headers:`, 'yellow'));
    console.log(`curl -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \\`);
    console.log(`     -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \\`);
    console.log(`     -L "${url}" > ${outputFile || 'output.html'}`);
    
    throw new Error('Browser-based download requires manual action or browser automation tools');
}

/**
 * Parse HTML and extract basic information
 */
function analyzeHtml(html) {
    console.log(colorize('\n🔍 HTML Analysis', 'cyan'));
    
    const result = {
        size: html.length,
        title: '',
        charset: '',
        hasDoctype: html.startsWith('<!DOCTYPE'),
        encoding: 'utf-8',
    };
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    if (titleMatch) {
        result.title = titleMatch[1].trim();
    }
    
    // Extract charset
    const charsetMatch = html.match(/charset=["']?([^"'\s>]+)/i);
    if (charsetMatch) {
        result.charset = charsetMatch[1];
    }
    
    // Count elements
    result.elementCounts = {
        div: (html.match(/<div\b/gi) || []).length,
        a: (html.match(/<a\b/gi) || []).length,
        img: (html.match(/<img\b/gi) || []).length,
        span: (html.match(/<span\b/gi) || []).length,
        li: (html.match(/<li\b/gi) || []).length,
        script: (html.match(/<script\b/gi) || []).length,
        link: (html.match(/<link\b/gi) || []).length,
    };
    
    // Check for common manga site patterns
    result.patterns = {
        hasLazyLoading: /data-src|data-original|data-lazy/i.test(html),
        hasDataAttributes: /data-[a-z-]+=/i.test(html),
        hasJsonLd: /application\/ld\+json/i.test(html),
        hasJsonData: /<script[^>]*type=["']text\/javascript["'][^>]*>.*?{.*?}/is.test(html),
        hasPagination: /page|next|prev/i.test(html),
    };
    
    return result;
}

/**
 * Find CSS selectors matching a pattern
 */
function findSelectors(html, pattern) {
    console.log(colorize(`\n🔎 Finding selectors matching: ${pattern}`, 'cyan'));
    
    const selectors = [];
    const regex = new RegExp(`class=["']([^"']*${pattern}[^"']*)["']`, 'gi');
    let match;
    
    while ((match = regex.exec(html)) !== null) {
        const classes = match[1].split(/\s+/).filter(c => c.toLowerCase().includes(pattern.toLowerCase()));
        selectors.push(...classes);
    }
    
    // Also check id attributes
    const idRegex = new RegExp(`id=["']([^"']*${pattern}[^"']*)["']`, 'gi');
    while ((match = idRegex.exec(html)) !== null) {
        selectors.push(`#${match[1]}`);
    }
    
    // Unique selectors
    const unique = [...new Set(selectors)].sort();
    
    return {
        pattern,
        count: unique.length,
        selectors: unique,
    };
}

/**
 * Extract all image URLs from HTML
 */
function extractImages(html) {
    console.log(colorize('\n🖼️  Image Analysis', 'cyan'));
    
    const images = [];
    const imgRegex = /<img[^>]+>/gi;
    let match;
    
    while ((match = imgRegex.exec(html)) !== null) {
        const imgTag = match[0];
        const url = extractImageUrl(imgTag);
        if (url) {
            images.push({
                url,
                tag: imgTag.substring(0, 100) + (imgTag.length > 100 ? '...' : ''),
                attributes: extractAttributes(imgTag),
            });
        }
    }
    
    // Also check for background images in style attributes
    const bgRegex = /background-image:\s*url\(["']?([^"')\s]+)["']?\)/gi;
    while ((match = bgRegex.exec(html)) !== null) {
        images.push({
            url: match[1],
            type: 'background',
        });
    }
    
    return {
        total: images.length,
        unique: [...new Set(images.map(i => i.url))].length,
        images: images.slice(0, 20), // First 20
    };
}

/**
 * Extract image URL from img tag
 */
function extractImageUrl(imgTag) {
    const attributes = ['data-src', 'data-original', 'data-lazy-src', 'src', 'data-url'];
    for (const attr of attributes) {
        const match = imgTag.match(new RegExp(`${attr}=["']([^"']+)["']`, 'i'));
        if (match) {
            return match[1];
        }
    }
    return null;
}

/**
 * Extract all attributes from a tag
 */
function extractAttributes(tag) {
    const attrs = {};
    const attrRegex = /([a-z-]+)=["']([^"']*)["']/gi;
    let match;
    while ((match = attrRegex.exec(tag)) !== null) {
        attrs[match[1]] = match[2];
    }
    return attrs;
}

/**
 * Extract all links from HTML
 */
function extractLinks(html) {
    console.log(colorize('\n🔗 Link Analysis', 'cyan'));
    
    const links = [];
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
        const url = match[1];
        const text = match[2].replace(/<[^>]+>/g, '').trim();
        links.push({
            url,
            text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        });
    }
    
    return {
        total: links.length,
        links: links.slice(0, 30), // First 30
    };
}

/**
 * Analyze HTML structure
 */
function analyzeStructure(html) {
    console.log(colorize('\n🏗️  Structure Analysis', 'cyan'));
    
    const structure = {
        containers: [],
        lists: [],
        pagination: null,
        navigation: null,
    };
    
    // Find common container classes
    const containerPatterns = [
        'container', 'wrapper', 'content', 'main', 'body', 'page',
        'manga', 'chapter', 'item', 'card', 'list', 'grid', 'row',
        'col', 'section', 'article', 'post', 'entry'
    ];
    
    for (const pattern of containerPatterns) {
        const result = findSelectors(html, pattern);
        if (result.count > 0) {
            structure.containers.push({
                pattern,
                count: result.count,
                sample: result.selectors.slice(0, 5),
            });
        }
    }
    
    // Find list structures
    const listPatterns = ['list', 'item', 'chapter', 'manga'];
    for (const pattern of listPatterns) {
        const result = findSelectors(html, pattern);
        if (result.count > 0) {
            structure.lists.push({
                pattern,
                count: result.count,
                sample: result.selectors.slice(0, 5),
            });
        }
    }
    
    // Find pagination
    const paginationPatterns = ['pagination', 'page', 'pager', 'nav', 'next', 'prev'];
    for (const pattern of paginationPatterns) {
        const result = findSelectors(html, pattern);
        if (result.count > 0) {
            structure.pagination = {
                pattern,
                selectors: result.selectors.slice(0, 10),
            };
            break;
        }
    }
    
    // Find navigation
    const navPatterns = ['nav', 'menu', 'header', 'navbar'];
    for (const pattern of navPatterns) {
        const result = findSelectors(html, pattern);
        if (result.count > 0) {
            structure.navigation = {
                pattern,
                selectors: result.selectors.slice(0, 10),
            };
            break;
        }
    }
    
    return structure;
}

/**
 * Print analysis results
 */
function printAnalysis(analysis) {
    console.log(colorize('\n📊 Analysis Results', 'bright'));
    
    console.log(`\n${colorize('File Info:', 'yellow')}`);
    console.log(`  Size: ${(analysis.size / 1024).toFixed(2)} KB`);
    console.log(`  Title: ${analysis.title || 'N/A'}`);
    console.log(`  Charset: ${analysis.charset || 'N/A'}`);
    console.log(`  Has DOCTYPE: ${analysis.hasDoctype ? 'Yes' : 'No'}`);
    
    console.log(`\n${colorize('Element Counts:', 'yellow')}`);
    for (const [elem, count] of Object.entries(analysis.elementCounts)) {
        console.log(`  <${elem}>: ${count}`);
    }
    
    console.log(`\n${colorize('Patterns Detected:', 'yellow')}`);
    for (const [pattern, detected] of Object.entries(analysis.patterns)) {
        console.log(`  ${pattern}: ${detected ? '✓' : '✗'}`);
    }
}

/**
 * Print selector results
 */
function printSelectors(result) {
    console.log(colorize(`\n📊 Found ${result.count} unique selectors`, 'bright'));
    if (result.selectors.length > 0) {
        console.log(colorize('\nSelectors:', 'yellow'));
        result.selectors.forEach(sel => console.log(`  ${sel}`));
    } else {
        console.log(colorize('\nNo selectors found matching the pattern.', 'red'));
    }
}

/**
 * Print image results
 */
function printImages(result) {
    console.log(colorize(`\n📊 Found ${result.total} images (${result.unique} unique)`, 'bright'));
    if (result.images.length > 0) {
        console.log(colorize('\nSample Images:', 'yellow'));
        result.images.forEach((img, i) => {
            console.log(`  ${i + 1}. ${img.url}`);
            if (img.attributes && img.attributes.class) {
                console.log(`     class="${img.attributes.class}"`);
            }
        });
    }
}

/**
 * Print link results
 */
function printLinks(result) {
    console.log(colorize(`\n📊 Found ${result.total} links`, 'bright'));
    if (result.links.length > 0) {
        console.log(colorize('\nSample Links:', 'yellow'));
        result.links.forEach((link, i) => {
            console.log(`  ${i + 1}. ${link.url}`);
            console.log(`     "${link.text}"`);
        });
    }
}

/**
 * Print structure results
 */
function printStructure(structure) {
    console.log(colorize('\n📊 Structure Analysis', 'bright'));
    
    if (structure.containers.length > 0) {
        console.log(colorize('\nContainer Classes:', 'yellow'));
        structure.containers.forEach(c => {
            console.log(`  ${c.pattern}: ${c.count} matches`);
            c.sample.forEach(s => console.log(`    - ${s}`));
        });
    }
    
    if (structure.lists.length > 0) {
        console.log(colorize('\nList Structures:', 'yellow'));
        structure.lists.forEach(l => {
            console.log(`  ${l.pattern}: ${l.count} matches`);
            l.sample.forEach(s => console.log(`    - ${s}`));
        });
    }
    
    if (structure.pagination) {
        console.log(colorize('\nPagination:', 'yellow'));
        console.log(`  Pattern: ${structure.pagination.pattern}`);
        structure.pagination.selectors.forEach(s => console.log(`    - ${s}`));
    }
    
    if (structure.navigation) {
        console.log(colorize('\nNavigation:', 'yellow'));
        console.log(`  Pattern: ${structure.navigation.pattern}`);
        structure.navigation.selectors.forEach(s => console.log(`    - ${s}`));
    }
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(colorize('Webpage Analyzer Tool', 'bright'));
        console.log(colorize('\nUsage:', 'cyan'));
        console.log('  node tools/webpage_analyzer.js download <url> [output-file]');
        console.log('  node tools/webpage_analyzer.js download-browser <url> [output-file]  (For Cloudflare/anti-bot protected sites)');
        console.log('  node tools/webpage_analyzer.js analyze <html-file>');
        console.log('  node tools/webpage_analyzer.js selectors <html-file> <pattern>');
        console.log('  node tools/webpage_analyzer.js images <html-file>');
        console.log('  node tools/webpage_analyzer.js links <html-file>');
        console.log('  node tools/webpage_analyzer.js structure <html-file>');
        console.log(colorize('\nExamples:', 'cyan'));
        console.log('  node tools/webpage_analyzer.js download https://example.com sources/example/homepage.html');
        console.log('  node tools/webpage_analyzer.js download-browser https://example.com sources/example/homepage.html');
        console.log('  node tools/webpage_analyzer.js analyze sources/example/homepage.html');
        console.log('  node tools/webpage_analyzer.js selectors sources/example/homepage.html manga');
        console.log('  node tools/webpage_analyzer.js images sources/example/homepage.html');
        console.log('  node tools/webpage_analyzer.js structure sources/example/homepage.html');
        process.exit(0);
    }
    
    const command = args[0];
    
    try {
        switch (command) {
            case 'download': {
                const url = args[1];
                if (!url) {
                    throw new Error('URL is required for download command');
                }
                const outputFile = args[2] || null;
                await downloadHtml(url, outputFile);
                break;
            }
            
            case 'download-browser': {
                const url = args[1];
                if (!url) {
                    throw new Error('URL is required for download-browser command');
                }
                const outputFile = args[2] || null;
                await downloadHtmlBrowser(url, outputFile);
                break;
            }
            
            case 'analyze': {
                const file = args[1];
                if (!file) {
                    throw new Error('HTML file is required for analyze command');
                }
                const html = fs.readFileSync(file, 'utf8');
                const analysis = analyzeHtml(html);
                printAnalysis(analysis);
                break;
            }
            
            case 'selectors': {
                const file = args[1];
                const pattern = args[2];
                if (!file || !pattern) {
                    throw new Error('HTML file and pattern are required for selectors command');
                }
                const html = fs.readFileSync(file, 'utf8');
                const result = findSelectors(html, pattern);
                printSelectors(result);
                break;
            }
            
            case 'images': {
                const file = args[1];
                if (!file) {
                    throw new Error('HTML file is required for images command');
                }
                const html = fs.readFileSync(file, 'utf8');
                const result = extractImages(html);
                printImages(result);
                break;
            }
            
            case 'links': {
                const file = args[1];
                if (!file) {
                    throw new Error('HTML file is required for links command');
                }
                const html = fs.readFileSync(file, 'utf8');
                const result = extractLinks(html);
                printLinks(result);
                break;
            }
            
            case 'structure': {
                const file = args[1];
                if (!file) {
                    throw new Error('HTML file is required for structure command');
                }
                const html = fs.readFileSync(file, 'utf8');
                const structure = analyzeStructure(html);
                printStructure(structure);
                break;
            }
            
            default:
                throw new Error(`Unknown command: ${command}`);
        }
        
        console.log(colorize('\n✅ Done!', 'green'));
    } catch (error) {
        console.error(colorize(`\n❌ Error: ${error.message}`, 'red'));
        process.exit(1);
    }
}

main();
