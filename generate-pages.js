const fs = require('fs');
const path = require('path');

const articlesFolder = path.join(__dirname, 'articles');
const outputFile = path.join(articlesFolder, 'pages.json');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, callback); // recursive call
    } else {
      callback(fullPath);
    }
  });
}

const pages = [];

walkDir(articlesFolder, (filePath) => {
  const relativePath = path.relative(articlesFolder, filePath);
  if (
    filePath.endsWith('.html') &&
    path.basename(filePath) !== 'index.html'
  ) {
    const name = path.basename(filePath, '.html')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    pages.push({
      name,
      url: `/stortrutWebsite/articles/${relativePath.replace(/\\/g, '/')}` // Normalize for web URLs
    });
  }
});

fs.writeFile(outputFile, JSON.stringify(pages, null, 2), (err) => {
  if (err) {
    console.error('Error writing pages.json:', err);
  } else {
    console.log('✅ pages.json created with', pages.length, 'articles.');
  }
});
