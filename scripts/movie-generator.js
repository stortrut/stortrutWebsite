let allMovies = []; // store parsed movies globally
let currentSort = "title"; // default sort criteria
let currentDirection = 1; // 1 = ascending, -1 = descending

fetch("/movie-data.txt")
  .then(res => res.text())
  .then(text => {
    allMovies = parseMovies(text);

    // Show total movies count (optional)
    const totalWatched = allMovies.length;
    const countElem = document.getElementById("movie-count");
    if (countElem) {
      countElem.textContent = `${totalWatched}`;
    }

    // Initial render
    sortMovies(currentSort);

    // Attach dropdown change event
    const sortSelect = document.getElementById("sort-select");
    sortSelect.value = currentSort; // set initial dropdown value
    sortSelect.addEventListener("change", e => {
      currentSort = e.target.value;
      sortMovies(currentSort);
    });

    // Attach toggle button event
    const toggleBtn = document.getElementById("sort-direction-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        currentDirection *= -1; // flip direction
        sortMovies(currentSort);
        updateToggleButtonLabel();
      });
      updateToggleButtonLabel();
    }

    // Attach reviewer filter events
    document.querySelectorAll('#reviewer-filters input').forEach(cb => {
      cb.addEventListener("change", () => {
        sortMovies(currentSort); // reapply sort + filters
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

function parseMovies(text) {
  const blocks = text.trim().split(/\n\s*\n/);
  return blocks.map(block => {
    const lines = block.split("\n").map(l => l.trim());
    let movie = { title: "", poster: "", reviews: [], year: "", seen_date: "" };

    lines.forEach(line => {
      if (line.startsWith("Movie:")) movie.title = line.replace("Movie:", "").trim();
      else if (line.startsWith("Poster:")) movie.poster = line.replace("Poster:", "").trim();
      else if (line.startsWith("Year:")) movie.year = parseInt(line.replace("Year:", "").trim(), 10);
      else if (line.startsWith("Seen:")) movie.seen_date = line.replace("Seen:", "").trim();
      else if (line.startsWith("Review:")) {
        const [, review] = line.split("Review:");
        const [name, score] = review.split("|").map(s => s.trim());
        movie.reviews.push({ name, score: parseFloat(score) });
      }
    });

    movie.avgRating = movie.reviews.length
      ? movie.reviews.reduce((a, r) => a + r.score, 0) / movie.reviews.length
      : 0;

    return movie;
  });
}

function renderMovies(movies) {
  const container = document.getElementById("reviews");
  container.innerHTML = "";

  const activeReviewers = Array.from(document.querySelectorAll('#reviewer-filters input:checked'))
    .map(cb => cb.value);

  movies.forEach(movie => {
    const reviewersInMovie = movie.reviews.map(r => r.name);
    const hasAll = activeReviewers.every(name => reviewersInMovie.includes(name));
    if (activeReviewers.length > 0 && !hasAll) return;

    const reviewsToShow = activeReviewers.length > 0
      ? movie.reviews.filter(r => activeReviewers.includes(r.name))
      : movie.reviews;

    if (reviewsToShow.length === 0) return;

    const movieDiv = document.createElement("div");
    movieDiv.className = "all-review-data-holder";

    movieDiv.innerHTML = `
      <div class="review-data-holder">
        <p class="movie-title">
          ${movie.title} ${movie.year ? `(${movie.year})` : ""}
        </p>
        ${movie.genre ? `<p><em>${movie.genre}</em></p>` : ""}
        <img class="movie-poster" src="${movie.poster}">
        <div class="reviews-holder">
          ${reviewsToShow.map(r => `
            <div class="review-holder">
              <p class="review-name">${r.name}:</p>
              <div class="star-rating" data-score="${r.score}"></div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    container.appendChild(movieDiv);
  });

  renderStars();
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
    if (criteria === "title") {
      return a.title.localeCompare(b.title) * currentDirection;
    }
    if (criteria === "year") {
      return ((a.year || 0) - (b.year || 0)) * currentDirection;
    }
    if (criteria === "rating") {
      return ((a.filteredAvgRating || 0) - (b.filteredAvgRating || 0)) * currentDirection;
    }
    if (criteria === "seen-date") {
      const da = a.seen_date ? new Date(a.seen_date).getTime() : 0;
      const db = b.seen_date ? new Date(b.seen_date).getTime() : 0;
      return (da - db) * currentDirection;
    }
    return 0;
  });

  renderMovies(sorted);
}
