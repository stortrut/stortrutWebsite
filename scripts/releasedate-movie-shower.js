
document.addEventListener('DOMContentLoaded', () => {
    fetch('/movie-data.txt')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load movie data');
            return response.text();
        })
        .then(text => {
            const movies = parseMovies(text);
            const today = new Date();
            const todayMonth = today.getMonth(); // 0-11
            const todayDate = today.getDate();   // 1-31

            const exactMatches = [];
            const upcomingMatches = [];

            let soonestDiff = Infinity;

            for (const movie of movies) {
                let releaseDate;

                if (typeof movie.release === 'string' && movie.release.includes('-')) {
                    const [year, month, day] = movie.release.split('-').map(Number);
                    releaseDate = new Date(year, month - 1, day);
                } else if (movie.release instanceof Date && !isNaN(movie.release)) {
                    releaseDate = movie.release;
                } else {
                    console.warn('Invalid release date format, skipping movie:', movie);
                    continue;
                }

                const year = releaseDate.getFullYear();
                const month = releaseDate.getMonth() + 1; // 1-12
                const day = releaseDate.getDate();


                if (!year || !month || !day) continue;

                // Check for same day/month in past years
                if (month - 1 === todayMonth && day === todayDate && year < today.getFullYear()) {
                    const yearsAgo = today.getFullYear() - year;
                    exactMatches.push({
                        ...movie,
                        message: `${movie.title} released today ${yearsAgo} year${yearsAgo !== 1 ? 's' : ''} ago! 🎉`,
                    });
                } else {
                    // Calculate days until this movie’s mm-dd
                    const thisYear = new Date(today.getFullYear(), month - 1, day);
                    let dayDiff = Math.ceil((thisYear - today) / (1000 * 60 * 60 * 24));

                    if (dayDiff < 0) {
                        const nextYear = new Date(today.getFullYear() + 1, month - 1, day);
                        dayDiff = Math.ceil((nextYear - today) / (1000 * 60 * 60 * 24));
                    }

                    if (dayDiff < soonestDiff) {
                        soonestDiff = dayDiff;
                        upcomingMatches.length = 0;
                        upcomingMatches.push({
                            ...movie,
                            message: `In ${dayDiff} day${dayDiff !== 1 ? 's' : ''} ${movie.title} released ${today.getFullYear() - year} year${(today.getFullYear() - year) !== 1 ? 's' : ''} ago`,
                        });
                    } else if (dayDiff === soonestDiff) {
                        upcomingMatches.push({
                            ...movie,
                            message: `Om ${dayDiff} dag${dayDiff !== 1 ? 'ar' : ''} ${movie.title} släpptes ${today.getFullYear() - year} år${(today.getFullYear() - year) !== 1 ? 's' : ''} ago`,
                        });
                    }
                }
            }

            const displayList = exactMatches.length > 0 ? exactMatches : upcomingMatches;

            if (displayList.length > 0) {
                startRotation(displayList);
            } else {
                document.getElementById('release-message').textContent = 'No matching movie found.';
                document.getElementById('release-description').textContent = '';
                document.getElementById('release-poster').src = '';
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

// Parses valid movie entries only
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

        if (movie.title && movie.release && movie.poster) {
            movies.push(movie);
        } else {
            console.warn('Skipping movie due to missing fields:', movie);
        }
    }

    return movies;
}

function startRotation(movieList) {
    let index = 0;
    const progressBar = document.getElementById('movie-swap-bar');
    const progressBarProgress = document.getElementById('movie-swap-progress');

    // If only one movie, hide the progress bar
    if (movieList.length <= 1) {
        if (progressBar) {
            progressBar.style.display = 'none';
            progressBarProgress.style.display = 'none';
        }
    } else {
        if (progressBar) {
            progressBar.style.display = ''; // Show if hidden before
            progressBarProgress.style.display = '';
        }
    }

    function showMovie(movie) {
        document.getElementById('release-message').textContent = movie.message;
        document.getElementById('release-description').textContent = '';
        const poster = document.getElementById('release-poster');
        poster.src = movie.poster;
        poster.alt = `Poster for ${movie.title}`;

        if (progressBar && movieList.length > 1) {
            // Reset progress bar
            progressBar.style.transition = 'none';
            progressBar.style.width = '0%';

            // Force reflow to restart transition
            progressBar.offsetWidth;

            // Animate progress bar to full width over 7 seconds
            progressBar.style.transition = 'width 7s linear';
            progressBar.style.width = '100%';
        }
    }

    // Show the first movie immediately
    showMovie(movieList[index]);

    // Start rotation if more than one movie
    if (movieList.length > 1) {
        setInterval(() => {
            index = (index + 1) % movieList.length;
            showMovie(movieList[index]);
        }, 7000); // Match progress bar duration
    }
}