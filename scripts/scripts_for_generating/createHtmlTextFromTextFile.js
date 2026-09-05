const articleHolder = document.createElement('div');
const textHolder = document.createElement('div');


async function readFile(filePath) {

    // ==========================================================
    // Create containers
    // ==========================================================

    articleHolder.classList.add('article-content');
    document.body.appendChild(articleHolder);

    textHolder.classList.add('container');
    articleHolder.appendChild(textHolder);


    // ==========================================================
    // Read text file
    // ==========================================================

    const response = await fetch(filePath);
    const text = await response.text();

    const lines = text.split(/\r?\n/);


    // ==========================================================
    // State
    // ==========================================================

    let shouldBeH1 = false;
    let shouldBeH2 = false;
    let shouldBeH3 = false;

    let insideQuote = false;
    let quoteLines = [];

    let insideList = false;
    let listItems = []; 


    //Process every line

    for (const line of lines) {

        //Check for list
        if (line.trim() === "[list]") {

            insideList = true;
            listItems = [];

            continue;
        }

        //Check for list end

        if (line.trim() === "[end_list]") {

            if (insideList) {

                createAndAddListElement(listItems);

                insideList = false;
                listItems = [];
            }

            continue;
        }

        // In the list

        if (insideList) {

            // Ignore empty lines
            if (line.trim() !== "") {
                listItems.push(line);
            }

            continue;
        }


        // Check for quote start

        if (line.trim() === "[quote]") {

            insideQuote = true;
            quoteLines = [];

            continue;
        }


        // ------------------------------------------------------
        // QUOTE END
        // ------------------------------------------------------

        if (line.trim() === "[end_quote]") {

            if (insideQuote) {

                createAndAddQuoteElement(
                    quoteLines
                );

                insideQuote = false;
                quoteLines = [];
            }

            continue;
        }


        // ------------------------------------------------------
        // If we're currently inside a quote,
        // store the line instead of creating a <p>
        // ------------------------------------------------------

        if (insideQuote) {

            quoteLines.push(line);

            continue;
        }


        // ------------------------------------------------------
        // H1
        // ------------------------------------------------------

        if (line.trim() === "[h1]") {

            shouldBeH1 = true;

            continue;
        }


        // ------------------------------------------------------
        // H2
        // ------------------------------------------------------

        if (line.trim() === "[h2]") {

            shouldBeH2 = true;

            continue;
        }


        // ------------------------------------------------------
        // H3
        // ------------------------------------------------------

        if (line.trim() === "[h3]") {

            shouldBeH3 = true;

            continue;
        }


        // ------------------------------------------------------
        // Create normal element
        // ------------------------------------------------------

        if (shouldBeH1) {

            createAndAddH1Element(line);

            shouldBeH1 = false;

        }

        else if (shouldBeH2) {

            createAndAddH2Element(line);

            shouldBeH2 = false;

        }

        else if (shouldBeH3) {

            createAndAddH3Element(line);

            shouldBeH3 = false;
        }

        else {

            createAndAddTextElement(line);
        }
        

    }
}



// ==========================================================
// Normal text
// ==========================================================

function createAndAddTextElement(text) {

    const element =
        document.createElement("p");

    element.textContent = text;

    textHolder.appendChild(element);
}



// ==========================================================
// H1
// ==========================================================

function createAndAddH1Element(text) {

    const element =
        document.createElement("h1");

    element.textContent = text;

    element.classList.add("title");

    textHolder.appendChild(element);
}



// ==========================================================
// H2
// ==========================================================

function createAndAddH2Element(text) {

    const element =
        document.createElement("h2");

    element.textContent = text;

    textHolder.appendChild(element);
}



// ==========================================================
// H3
// ==========================================================

function createAndAddH3Element(text) {

    const element =
        document.createElement("h3");

    element.textContent = text;

    textHolder.appendChild(element);
}



// Add quote

function createAndAddQuoteElement(lines) {

    // ------------------------------------------------------
    // Remove empty lines at beginning/end
    // ------------------------------------------------------

    while (
        lines.length > 0 &&
        lines[0].trim() === ""
    ) {
        lines.shift();
    }

    while (
        lines.length > 0 &&
        lines[lines.length - 1].trim() === ""
    ) {
        lines.pop();
    }


    // ------------------------------------------------------
    // Find author
    //
    // Last non-empty line beginning with "-"
    //
    // Example:
    //
    // -Hitachi
    // ------------------------------------------------------

    let author = "";

    if (lines.length > 0) {

        const lastLine =
            lines[lines.length - 1].trim();

        if (lastLine.startsWith("-")) {

            author =
                lastLine
                    .substring(1)
                    .trim();

            lines.pop();
        }
    }


    // ------------------------------------------------------
    // Create quote container
    // ------------------------------------------------------

    const quote =
        document.createElement("blockquote");

    quote.classList.add("custom-quote");


    // ------------------------------------------------------
    // Create quote text
    // ------------------------------------------------------

    const quoteText =
        document.createElement("div");

    quoteText.classList.add("quote-text");


    // Remove unnecessary empty lines
    while (
        lines.length > 0 &&
        lines[0].trim() === ""
    ) {
        lines.shift();
    }

    while (
        lines.length > 0 &&
        lines[lines.length - 1].trim() === ""
    ) {
        lines.pop();
    }


    // ------------------------------------------------------
    // Add each quote line
    // ------------------------------------------------------

    for (let i = 0; i < lines.length; i++) {

        quoteText.appendChild(
            document.createTextNode(
                lines[i]
            )
        );

        if (i < lines.length - 1) {

            quoteText.appendChild(
                document.createElement("br")
            );
        }
    }


    quote.appendChild(quoteText);


    // ------------------------------------------------------
    // Author
    // ------------------------------------------------------

    if (author !== "") {

        const quoteAuthor =
            document.createElement("div");

        quoteAuthor.classList.add(
            "quote-author"
        );

        quoteAuthor.textContent =
            "— " + author;

        quote.appendChild(
            quoteAuthor
        );
    }


    // ------------------------------------------------------
    // Add quote to page
    // ------------------------------------------------------

    textHolder.appendChild(quote);









}




// Add list element
function createAndAddListElement(items) {

    const list =
        document.createElement("ul");

    list.classList.add("custom-list");


    for (const item of items) {

        const listItem =
            document.createElement("li");

        listItem.textContent =
            item;

        list.appendChild(listItem);
    }


    textHolder.appendChild(list);
}