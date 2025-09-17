const searchInput = document.getElementById('search-input');
const dropdown = document.getElementById('dropdown');

let pages = [];

// Fetch the pages.json
fetch('/articles/pages.json')
  .then(response => response.json())
  .then(data => {
    pages = data;
  })
  .catch(err => console.error('Error loading pages.json:', err));

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
      window.location.href = page.url;
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
