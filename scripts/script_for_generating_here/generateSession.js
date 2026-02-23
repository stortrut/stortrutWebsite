const fs = require("fs");

function parseMeta(rawText) {
  const titleMatch = rawText.match(/\[h1\]\s*([\s\S]*?)\n/);
  const pageTitle = titleMatch ? titleMatch[1].trim() : "Session";

  return {
    title: pageTitle,
    description: pageTitle + "."
  };
}

function convertContent(rawText) {
  const lines = rawText.split(/\r?\n/);
  let html = "";
  let inQuote = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (line === "[h1]") {
      const title = lines[++i].trim();
      html += `<h1 class="title">\n  ${title}\n</h1>\n\n`;
    }

    else if (line === "[h2]") {
      const subtitle = lines[++i].trim();
      html += `<h2>\n  ${subtitle}\n</h2>\n\n`;
    }

    else if (line === "[quote]") {
      inQuote = true;
      html += `<div class="quote">\n`;
    }

    else if (inQuote) {
      if (line === "") {
        html += `\n</div>\n\n`;
        inQuote = false;
      } else {
        html += `  ${line}\n`;
      }
    }

    else if (
      line !== "" &&
      !line.startsWith("Meta Details") &&
      !line.startsWith("Page ") &&
      !line.startsWith("Has ")
    ) {
      html += `<p>\n  ${line}\n</p>\n\n`;
    }
  }

  return html;
}

function generateFullHTML(rawText) {
  const meta = parseMeta(rawText);
  const content = convertContent(rawText);

  return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title>${meta.title}</title>
  <meta name="description" content="${meta.description}">

  <link rel="icon" type="image/png" href="/images/icons/magpie.png">

  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/styles/dndstyle.css">
  <link rel="stylesheet" href="/styles/timeline.css">
</head>

<body>
  <div id="top-bar"></div>
  <div id="toc-sidebar"></div>

  <script src="/scripts/scriptforall.js"></script>

  <div class="article-content">
    <div class="container">

${content}

    </div>
  </div>

  <script src="/scripts/scriptforall-last.js"></script>
</body>

</html>`;
}

// ====== RUN ======

const inputFile = "session_38.txt";
const outputFile = "output.html";

const rawText = fs.readFileSync(inputFile, "utf8");
const finalHTML = generateFullHTML(rawText);

fs.writeFileSync(outputFile, finalHTML, "utf8");

console.log("HTML file generated successfully.");