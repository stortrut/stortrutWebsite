// Fetch and process the movie data file
document.addEventListener('DOMContentLoaded', () => {
  fetch('movie.data.txt')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load movie data');
      return response.text();
    })
    .then(text => {
      const movies = parseMovies(text);
      const today = new Date();
      const todayMonth = today.getMonth(); // 0-11
      const todayDate = today.getDate();   // 1-31

      let exactMatch = null;
      let soonest = null;
      let minDayDiff = Infinity;

      for (const movie of movies) {
        const [year, month, day] = movie.release.split('-').map(Number);
        const releaseDate = new Date(year, month - 1, day);

        // Case 1: Released on this month/day in any past year
        if (month - 1 === todayMonth && day === todayDate && year < today.getFullYear()) {
          const yearsAgo = today.getFullYear() - year;
          exactMatch = {
            ...movie,
            yearsAgo,
            message: `${movie.title} released today ${yearsAgo} year${yearsAgo !== 1 ? 's' : ''} ago! 🎉`
          };
          break; // Highest priority
        }

        // Case 2: Find the soonest upcoming release by month/day
        const thisYearRelease = new Date(today.getFullYear(), month - 1, day);
        let diffDays = Math.ceil((thisYearRelease - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          // Release date already passed this year — calculate for next year
          const nextYearRelease = new Date(today.getFullYear() + 1, month - 1, day);
          diffDays = Math.ceil((nextYearRelease - today) / (1000 * 60 * 60 * 24));
        }

        if (diffDays < minDayDiff) {
          minDayDiff = diffDays;
          const yearsAgo = today.getFullYear() - year;
          soonest = {
            ...movie,
            daysUntil: diffDays,
            yearsAgo,
            message: `In ${diffDays} day${diffDays !== 1 ? 's' : ''} ${movie.title} released ${yearsAgo} year${yearsAgo !== 1 ? 's' : ''} ago`
          };
        }
      }

      const chosen = exactMatch || soonest;

      // Update DOM
      document.getElementById('release-poster').src = chosen.poster;
      document.getElementById('release-message').textContent = chosen.message;
      document.getElementById('release-description').textContent = '';
    })
    .catch(error => {
      console.error('Error:', error);
    });
});

// Parse the movie data from .txt
function parseMovies(data) {
  const movies = [];
  const entries = data.trim().split('\n\n');

  for (const entry of entries) {
    const movie = {};
    const lines = entry.trim().split('\n');
    for (const line of lines) {
      const [key, ...rest] = line.split(': ');
      const value = rest.join(': ').trim();
      if (key === 'Movie') movie.title = value;
      else if (key === 'Release') movie.release = value;
      else if (key === 'Poster') movie.poster = value;
    }
    movies.push(movie);
  }
  return movies;
}
