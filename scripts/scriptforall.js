fetch('/page-components/top-bar.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('top-bar').innerHTML = html;



    const topBar = document.getElementById('top-bar');  // <-- define here!

    // Add the loaded class to show it and let it size naturally
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
