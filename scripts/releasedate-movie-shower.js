document.addEventListener('DOMContentLoaded', () => {
  fetch('/movie-data.txt')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load movie data');
      return response.text();
    })
    .then(text => {
      const movies = parseMovies(text);
      const today = new Date();
      const todayMonth = today.getMonth();
      const todayDate = today.getDate();

      const exactMatches = [];
      const upcomingMatches = [];

      let soonestDiff = Infinity;

      for (const movie of movies) {
        const [year, month, day] = movie.release.split('-').map(Number);
        const releaseDate = new Date(year, month - 1, day);

        // Check for same day/month in past years
        if (month - 1 === todayMonth && day === todayDate && year < today.getFullYear()) {
          const yearsAgo = today.getFullYear() - year;
          exactMatches.push({
            ...movie,
            message: `${movie.title} released today ${yearsAgo} year${yearsAgo !== 1 ? 's' : ''} ago! 🎉`,
            poster: movie.poster
          });
        } else {
          // Calculate how many days until this movie’s mm-dd
          const thisYear = new Date(today.getFullYear(), month - 1, day);
          let dayDiff = Math.ceil((thisYear - today) / (1000 * 60 * 60 * 24));

          if (dayDiff < 0) {
            // Already passed this year, check next year
            const nextYear = new Date(today.getFullYear() + 1, month - 1, day);
            dayDiff = Math.ceil((nextYear - today) / (1000 * 60 * 60 * 24));
          }

          if (dayDiff < soonestDiff) {
            soonestDiff = dayDiff;
            upcomingMatches.length = 0; // Clear previous
            upcomingMatches.push({
              ...movie,
              daysUntil: dayDiff,
              yearsAgo: today.getFullYear() - year,
              message: `In ${dayDiff} day${dayDiff !== 1 ? 's' : ''} ${movie.title} released ${today.getFullYear() - year} year${(today.getFullYear() - year) !== 1 ? 's' : ''} ago`,
              poster: movie.poster
            });
          } else if (dayDiff === soonestDiff) {
            upcomingMatches.push({
              ...movie,
              daysUntil: dayDiff,
              yearsAgo: today.getFullYear() - year,
              message: `In ${dayDiff} day${dayDiff !== 1 ? 's' : ''} ${movie.title} released ${today.getFullYear() - year} year${(today.getFullYear() - year) !== 1 ? 's' : ''} ago`,
              poster: movie.poster
            });
          }
        }
      }

      const displayList = exactMatches.length > 0 ? exactMatches : upcomingMatches;

      if (displayList.length > 0) {
        startRotation(displayList);
      } else {
        // Optional: fallback if no matches found
        document.getElementById('release-message').textContent = 'No matching movie found.';
        document.getElementById('release-description').textContent = '';
        document.getElementById('release-poster').src = '';
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
});

// Parse movie data
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

// Rotates through a list of movies every 2 seconds
function startRotation(movieList) {
  let index = 0;

  function showMovie(movie) {
    document.getElementById('release-message').textContent = movie.message;
    document.getElementById('release-description').textContent = '';
    document.getElementById('release-poster').src = movie.poster;
    document.getElementById('release-poster').alt = `Poster for ${movie.title}`;
  }

  showMovie(movieList[index]);

  if (movieList.length > 1) {
    setInterval(() => {
      index = (index + 1) % movieList.length;
      showMovie(movieList[index]);
    }, 2000); // every 2 seconds
  }
}
