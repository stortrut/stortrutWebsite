
//Function that loads scripts in html pages
function loadScript(url) {

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${url}`));
    document.head.appendChild(script);
  });
}

const script = document.querySelector('script[src="/scripts/scripts-for-all/scriptforall.js"]');
const hideDnD = script.dataset.hideDnd === "true";
console.log(hideDnD);

//Loads the scripts at start, and allows it to wait inside (like a courutine in unity I think :o )
(async () => {
  try {
    //Add magpie icon to the page top
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    favicon.href = '/images/icons/magpie.png';
    document.head.appendChild(favicon); 

    // Load the other scripts sequentially 
    await loadScript('/scripts/scripts-for-all/topbar-inserter.js');
    await loadScript('/scripts/scripts-for-all/link-inserter.js');

    // After the functions are loaded, we call them
    if (typeof replaceWordsWithLinks === 'function') {
        console.log("Calling replaceWordsWithLinks");
      replaceWordsWithLinks();
    }
    if (typeof insertTopBar === 'function') {
      insertTopBar(hideDnD);
    }
  } catch (err) {
    console.error(err);
  }
})();
