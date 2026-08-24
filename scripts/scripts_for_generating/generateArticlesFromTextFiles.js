const fs = require('fs');
const path = require('path');

const folder = path.join(__dirname, '..', '..', 'articles'); //.. is going up one level

function getAllFilePaths(dir, callback) {

    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            getAllFilePaths(fullPath, callback);
        } else {
            callback(fullPath);
        }
    });
}


deleteAllHtmlFiles(folder);

getAllFilePaths(folder, (filePath) => {
    if (!filePath.endsWith('.txt')) {
        return;
    }

    const relativePath = path.relative(folder, filePath);
    const webPath = '/articles/' + relativePath.replace(/\\/g, '/');

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">

        <title>Title</title>
        <meta name="description" content="Beskrivning.">

        <link rel="stylesheet" href="/styles/styles.css">
        <link rel="stylesheet" href="/styles/dndstyle.css">
        <link rel="stylesheet" href="/styles/timeline.css">
    </head>

    <body>
        <script 
            src="/scripts/scripts_for_generating/createHtmlTextFromTextFile.js" >
        </script>
        <script> 
            readFile("${webPath}");
        </script>

        <script 
            src="/scripts/scripts-for-all/scriptforall.js" >
        </script>
    </body>
    </html>
    `;

    const fileName = path.basename(filePath, '.txt');

    const outputPath = path.join(
        path.dirname(filePath),
        fileName + '.html'
    );

    fs.writeFileSync(outputPath, html);
    console.log('Created:', outputPath);

});



function deleteAllHtmlFiles(dir) {
    fs.readdirSync(dir).forEach(file => {

        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            //Search subfolders too
            deleteAllHtmlFiles(fullPath);
        } 
        else if (file.endsWith('.html')) {
            fs.unlinkSync(fullPath);
            console.log('Deleted:', path.basename(fullPath));
        }
    });
}