const fs = require('fs');
const path = require('path');

const articlesFolder = path.join(__dirname, 'articles');
const outputFile = path.join(articlesFolder, 'pages.json');

// Read existing pages.json if it exists
let existingPages = [];
if (fs.existsSync(outputFile)) {
  existingPages = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
}

// Create a map for quick lookup by name
const pageMap = {};
existingPages.forEach(p => {
  pageMap[p.name] = p;
  // Ensure shorthands array exists
  if (!p.hasOwnProperty('shorthands')) {
    p.shorthands = [];
  }
});

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

walkDir(articlesFolder, (filePath) => {
  const relativePath = path.relative(articlesFolder, filePath);
  if (
    filePath.endsWith('.html') &&
    path.basename(filePath) !== 'index.html'
  ) {
    const name = path.basename(filePath, '.html')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    const url = `/articles/${relativePath.replace(/\\/g, '/')}`;

    if (pageMap[name]) {
      // Page exists: update URL, keep any existing shorthands
      pageMap[name].url = url;
    } else {
      // New page: add with empty shorthands array
      pageMap[name] = {
        name,
        url,
        shorthands: []
      };
    }
  }
});

// Convert map back to array
const pagesArray = Object.values(pageMap);

// Write updated pages.json
fs.writeFileSync(outputFile, JSON.stringify(pagesArray, null, 2), 'utf-8');
console.log(`✅ pages.json updated with ${pagesArray.length} articles.`);
