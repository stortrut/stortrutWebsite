const articleHolder = document.createElement('div');
const textHolder = document.createElement('div');

async function readFile(filePath) {

    //Creating the neccecities
    articleHolder.classList.add('article-content');
    document.body.appendChild(articleHolder);

    textHolder.classList.add('container');
    articleHolder.appendChild(textHolder);



    //Adding the text
    const response = await fetch(filePath);
    const text = await response.text(); //Converts it into a JS string

    const lines = text.split(/\r?\n/); //Converts each line into a new element

    let shouldBeH1 = false;
    let shouldBeH2 = false;

    //Display all lines
    for (const line of lines) 
    {
        //Check if line is a modifier
        if(line == "[h1]") {
            shouldBeH1 = true;
            continue;
        }
        if(line == "[h2]") {
            shouldBeH2 = true;
            continue;
        }

        //Type out text
        if(shouldBeH1){
            createAndAddH1Element(line);
            shouldBeH1 = false;
        }
        else if(shouldBeH2){
            createAndAddH2Element(line);
            shouldBeH2 = false;
        }
        else{
            createAndAddTextElement(line);
        }

    }
}



//Create text functions
async function createAndAddTextElement(text) {
    const element = document.createElement("p");
    element.textContent = text;

    textHolder.appendChild(element);
}

async function createAndAddH1Element(text) {
    const element = document.createElement("h1");
    element.textContent = text;
    element.classList.add('title');

    textHolder.appendChild(element);
}
async function createAndAddH2Element(text) {
    const element = document.createElement("h2");
    element.textContent = text;

    textHolder.appendChild(element);
}