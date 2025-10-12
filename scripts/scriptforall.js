//Link inserter
fetch('/articles/pages.json')
  .then(res => res.json())
  .then(pages => {
    const pageMap = {};

    // Map both full names and all shorthands to URLs
    for (const page of pages) {
      const url = page.url;
      pageMap[page.name.toLowerCase()] = url;

      if (Array.isArray(page.shorthands)) {
        for (const sh of page.shorthands) {
          pageMap[sh.toLowerCase()] = url;
        }
      }
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    // Regex: optional space (\s*) before @ for all patterns
    const pattern = /\(([^\)]+)\)\s*@\(([^\)]+)\)|(\b[A-Za-z0-9_\-]+)\s*@\(([^\)]+)\)|(\b[A-Za-z0-9_\-]+)\s*@([A-Za-z0-9_\-]+)|(\b[A-Za-z0-9_\-]+)@([A-Za-z0-9_\-]+)/g;

    for (const node of nodes) {
      const text = node.textContent;
      if (!text.includes('@')) continue;

      const newHtml = text.replace(pattern, (
        match,
        dispParen, targetParen1,
        dispWordMulti, targetParen2,
        dispWordSingle, targetSingle1,
        dispWordSingleNoSpace, targetSingle2
      ) => {
        // Determine the target name after @
        const targetName = (targetParen1 || targetParen2 || targetSingle1 || targetSingle2 || '').trim();
        const key = targetName.toLowerCase();
        const url = pageMap[key];
        if (!url) return match;

        const displayText = (dispParen || dispWordMulti || dispWordSingle || dispWordSingleNoSpace || '').trim();
        return `<a href="${url}">${displayText}</a>`;
      });

      if (newHtml !== text) {
        const span = document.createElement('span');
        span.innerHTML = newHtml;
        node.parentNode.replaceChild(span, node);
      }
    }
  })
  .catch(err => console.error('Error loading pages.json', err));


//Top-bar
fetch('/page-components/top-bar.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('top-bar').innerHTML = html;
    const topBar = document.getElementById('top-bar'); 
    topBar.classList.add('loaded');

    // Now that the top bar is loaded, we can safely query its elements
    const searchInput = document.getElementById('search-input');
    const dropdown = document.getElementById('dropdown');
    const randomPageButton = document.getElementById('random-page-button');

    let pages = [];

    // Fetch the pages.json
    fetch('/articles/pages.json')
      .then(response => response.json())
      .then(data => {
        pages = data;
      })
      .catch(err => console.error('Error loading pages.json:', err));

    if (searchInput && dropdown) {
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        dropdown.innerHTML = '';

        if (!query) {
          dropdown.style.display = 'none';
          return;
        }

        const filtered = pages.filter(page =>
          page.name.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
          dropdown.style.display = 'none';
          return;
        }

        filtered.forEach(page => {
          const item = document.createElement('div');
          item.classList.add('dropdown-item');
          item.textContent = page.name;
          item.onclick = () => {
            window.location.assign(page.url);
          };
          dropdown.appendChild(item);
        });

        dropdown.style.display = 'block';
      });

      // Optional: Hide dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!document.getElementById('search-container').contains(e.target)) {
          dropdown.style.display = 'none';
        }
      });
    }

    // Random page button
    if (randomPageButton) {
      randomPageButton.addEventListener('click', function () {
        fetch('/articles/pages.json')
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to fetch pages.json');
            }
            return response.json();
          })
          .then(pages => {
            if (!Array.isArray(pages) || pages.length === 0) {
              throw new Error('No pages found');
            }
            const randomPage = pages[Math.floor(Math.random() * pages.length)];
            window.location.href = randomPage.url;
          })
          .catch(error => {
            console.error('Error loading random page:', error);
            alert('Kunde inte ladda en slumpmässig sida.');
          });
      });
    }
  })
  .catch(err => console.error('Fetch error:', err));
