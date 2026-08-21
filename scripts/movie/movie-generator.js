let allMovies = []; // store parsed movies globally
let currentSort = "seen-date"; // default sort criteria
let currentDirection = -1; // 1 = ascending, -1 = descending

fetch("/data/movie-data.txt")

  .then(res => res.text())
  .then(text => {
    allMovies = getMovies(text);


    //Render the total movies watched stuff
    const totalWatched = allMovies.length;
    const countElem = document.getElementById("movie-count-number");
    if (countElem) {
      let current = 0;
      const duration = 1000; // ms
      const frameRate = 60;
      const totalFrames = Math.round((duration / 1000) * frameRate);
      const increment = totalWatched / totalFrames;
      let lastDisplayed = -1;

      const counter = setInterval(() => {
        current += increment;
        const displayNumber = Math.floor(current);

        if (displayNumber !== lastDisplayed) {
          countElem.textContent = displayNumber;
          lastDisplayed = displayNumber;
        }

        let progress = current / totalWatched;
        if (progress > 1) progress = 1;

        const scale = 0.5 + 0.5 * progress;
        countElem.style.transform = `scale(${scale})`;

        if (current >= totalWatched) {
          countElem.textContent = totalWatched;
          countElem.style.transform = "scale(1)";
          clearInterval(counter);
        }
      }, 1000 / frameRate);
    }


    // Extract all genres from all movies and split by commas, trim, dedupe and sort
    const genreSet = new Set();
    allMovies.forEach(movie => {
      if (movie.genre) {
        movie.genre.split(",").forEach(g => {
          const trimmed = g.trim();
          if (trimmed) genreSet.add(trimmed);
        });
      }
    });

    const genres = Array.from(genreSet).sort();

    // Populate genre filter dropdown
    const genreSelect = document.getElementById("genre-select");
    if (genreSelect) {
      // Add "All" option
      const allOption = document.createElement("option");
      allOption.value = "all";
      allOption.textContent = "All Genres";
      genreSelect.appendChild(allOption);

      genres.forEach(genre => {
        const option = document.createElement("option");
        option.value = genre;
        option.textContent = genre;
        genreSelect.appendChild(option);
      });

      genreSelect.addEventListener("change", () => {
        sortMovies(currentSort);
      });
    }

    // Initial render
    sortMovies(currentSort);

    // Attach dropdown change event
    const sortSelect = document.getElementById("sort-select");
    sortSelect.value = currentSort;
    sortSelect.addEventListener("change", e => {
      currentSort = e.target.value;
      sortMovies(currentSort);
    });

    // Attach toggle button event
    const toggleBtn = document.getElementById("sort-direction-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        currentDirection *= -1;
        sortMovies(currentSort);
        updateToggleButtonLabel();
      });
      updateToggleButtonLabel();
    }

    // Attach reviewer filter events
    document.querySelectorAll('#reviewer-filters input').forEach(cb => {
      cb.addEventListener("change", () => {
        sortMovies(currentSort);
      });
    });
  })
  .catch(err => {
    document.getElementById("reviews").textContent = "Error loading movies.txt";
    console.error(err);
  });

function updateToggleButtonLabel() {
  const toggleBtn = document.getElementById("sort-direction-toggle");
  if (!toggleBtn) return;
  toggleBtn.textContent = currentDirection === 1 ? "↑" : "↓";
}





//Renders all the movie boxes
function renderMovies(movies) {

    const container = document.getElementById("reviews");
    const template = document.getElementById("movie-template");

    container.innerHTML = "";

    const activeReviewers = Array.from(
        document.querySelectorAll('#reviewer-filters input:checked')
    ).map(cb => cb.value);

    const selectedGenre =
        document.getElementById("genre-select")?.value || "all";

    movies.forEach(movie => {

        //Skip movie if it doesn't match filters
        if (!matchesFilters(movie, activeReviewers, selectedGenre)) {
            return;
        }

        //Create movie from template
        const clone = template.content.cloneNode(true);

        const title = clone.querySelector(".movie-title");
        const poster = clone.querySelector(".movie-poster");
        const reviews = clone.querySelector(".reviews-holder");

        title.textContent =
            `${movie.title} ${movie.releaseYear ? `(${movie.releaseYear})` : ""}`;

        poster.src = movie.poster;
        poster.alt = movie.title;

        // Add reviews
        movie.reviews
            .filter(r =>
                activeReviewers.length === 0 ||
                activeReviewers.includes(r.name)
            )
            .forEach(r => {
                reviews.innerHTML += `
                    <div class="review-holder">
                        <p class="review-name">${r.name}:</p>
                        <div class="star-rating" data-score="${r.score}"></div>
                    </div>
                `;
            });

        clone.querySelector(".all-review-data-holder")
            .addEventListener("click", () => showMovieModal(movie));

        container.appendChild(clone);
    });

    renderStars();
}

function matchesFilters(movie, reviewers, genre) {

    if (reviewers.length > 0) {
        const movieReviewers = movie.reviews.map(r => r.name);

        if (!reviewers.every(name => movieReviewers.includes(name))) {
            return false;
        }
    }

    if (genre !== "all") {
        const movieGenres = movie.genre
            .split(",")
            .map(g => g.trim());

        if (!movieGenres.includes(genre)) {
            return false;
        }
    }

    return true;
}



function renderStars() {
  document.querySelectorAll('.star-rating').forEach(el => {
    const score = parseFloat(el.dataset.score) || 0;

    if (!el.querySelector('.star-fill')) {
      el.innerHTML = `
        <span class="star-fill">★★★★★</span>
        <span class="star-base">★★★★★</span>
      `;
    }

    if (!score) {
      el.classList.add('unrated');
      return;
    } else {
      el.classList.remove('unrated');
    }

    const tempSpan = document.createElement('span');
    tempSpan.style.fontFamily = getComputedStyle(el).fontFamily;
    tempSpan.style.fontSize = getComputedStyle(el).fontSize;
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.textContent = '★';
    document.body.appendChild(tempSpan);

    const singleStarWidth = tempSpan.getBoundingClientRect().width;
    document.body.removeChild(tempSpan);

    const totalWidth = singleStarWidth * 5;
    const fillWidth = (score / 5) * totalWidth;

    el.querySelector('.star-fill').style.width = fillWidth + 'px';
  });
}

function sortMovies(criteria) {
  const activeReviewers = Array.from(document.querySelectorAll('#reviewer-filters input:checked'))
    .map(cb => cb.value);

  let sorted = [...allMovies];

  if (criteria === "rating") {
    sorted = sorted.map(movie => {
      const relevantReviews = activeReviewers.length > 0
        ? movie.reviews.filter(r => activeReviewers.includes(r.name))
        : movie.reviews;

      const filteredAvg = relevantReviews.length
        ? relevantReviews.reduce((sum, r) => sum + r.score, 0) / relevantReviews.length
        : 0;

      return {
        ...movie,
        filteredAvgRating: filteredAvg
      };
    });
  }

  sorted.sort((a, b) => {
    if (criteria === "seen-date") {
      const da = a.seen_date ? new Date(a.seen_date).getTime() : 0;
      const db = b.seen_date ? new Date(b.seen_date).getTime() : 0;
      return (da - db) * currentDirection;
    }
    if (criteria === "title") {
      return a.title.localeCompare(b.title) * currentDirection;
    }
    if (criteria === "release") {
      const aDate = a.release instanceof Date ? a.release.getTime() : 0;
      const bDate = b.release instanceof Date ? b.release.getTime() : 0;
      return (aDate - bDate) * currentDirection;
    }
    if (criteria === "rating") {
      return ((a.filteredAvgRating || 0) - (b.filteredAvgRating || 0)) * currentDirection;
    }

    return 0;
  });

  renderMovies(sorted);
}


//Movie info
function showMovieModal(movie) {
  const modal = document.getElementById("movie-modal");
  const template = document.getElementById("movie-modal-template");

  // Clear previous modal content
  modal.innerHTML = "";

  // Clone template content
  const clone = template.content.cloneNode(true);

  // Fill in data
  clone.querySelector(".modal-title").textContent = `${movie.title} ${movie.releaseYear ? `(${movie.releaseYear})` : ""}`;
  clone.querySelector(".modal-poster").src = movie.poster;
  clone.querySelector(".modal-poster").alt = movie.title;
  clone.querySelector(".modal-genres").textContent = movie.genre || "N/A";
  clone.querySelector(".modal-seen-date").textContent = movie.seen_date || "N/A";
  clone.querySelector(".modal-average-rating").textContent = movie.avgRating.toFixed(1);

  const reviewsList = clone.querySelector(".modal-reviews-list");
  reviewsList.innerHTML = movie.reviews.map(r => `<li>${r.name}: ${r.score}</li>`).join("");

  // Append to modal
  modal.appendChild(clone);

  // Show modal
  modal.classList.remove("hidden");

  // Add close event to close button inside the cloned content
  const closeBtn = modal.querySelector(".close-button");
  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
}


document.querySelector(".close-button").addEventListener("click", () => {
  document.getElementById("movie-modal").classList.add("hidden");
});

// Optional: close modal when clicking outside the modal content
document.getElementById("movie-modal").addEventListener("click", (e) => {
  if (e.target.id === "movie-modal") {
    document.getElementById("movie-modal").classList.add("hidden");
  }
});