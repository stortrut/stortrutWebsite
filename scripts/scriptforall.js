//Link inserter
fetch('/articles/pages.json')
  .then(res => res.json())
  .then(pages => {
    const pageMap = {};

    // Map full names and shorthands to URLs
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

    // Match various @() link patterns
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

    // ====== Tooltip Functions ======
    function showTooltip(link, preview) {
      let tooltip = document.getElementById('link-preview-tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'link-preview-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.padding = '8px 12px';
        tooltip.style.background = 'rgba(0,0,0,0.75)';
        tooltip.style.color = '#fff';
        tooltip.style.borderRadius = '4px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.transition = 'opacity 0.2s ease';
        tooltip.style.opacity = '0';
        tooltip.style.maxWidth = '300px';
        tooltip.style.whiteSpace = 'normal';
        tooltip.style.zIndex = '9999';
        document.body.appendChild(tooltip);
      }

      tooltip.textContent = preview;

      // Positioning
      const rect = link.getBoundingClientRect();
      const tooltipWidth = 300;
      const padding = 10;
      const top = rect.bottom + window.scrollY + 8;

      let left = rect.left + window.scrollX;

      const viewportWidth = document.documentElement.clientWidth;
      if (left + tooltipWidth + padding > viewportWidth) {
        left = viewportWidth - tooltipWidth - padding;
      }
      if (left < padding) {
        left = padding;
      }

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      tooltip.style.opacity = '1';
    }

    function hideTooltip() {
      const tooltip = document.getElementById('link-preview-tooltip');
      if (tooltip) {
        tooltip.style.opacity = '0';
      }
    }

    // ====== Add Hover Listeners to All Links ======
    document.querySelectorAll('a').forEach(link => {
      link.addEventListener('mouseenter', async () => {
        if (!link.dataset.preview) {
          try {
            const res = await fetch(link.href);
            const text = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const metaDesc = doc.querySelector('meta[name="description"]');
            const preview = metaDesc ? metaDesc.getAttribute('content') : 'No preview available';
            link.dataset.preview = preview;
          } catch {
            link.dataset.preview = 'Failed to load preview';
          }
        }
        showTooltip(link, link.dataset.preview);
      });

      link.addEventListener('mouseleave', () => {
        hideTooltip();
      });
    });
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
