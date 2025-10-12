let allMovies = []; // store parsed movies globally
let currentSort = "title"; // default sort criteria
let currentDirection = 1; // 1 = ascending, -1 = descending

fetch("/movie-data.txt")
  .then(res => res.text())
  .then(text => {
    allMovies = parseMovies(text);

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

    // Calculate progress (0 to 1)
    let progress = current / totalWatched;
    if (progress > 1) progress = 1;

    // Scale from 0.5 (start) to 1 (end)
    const scale = 0.5 + 0.5 * progress;
    countElem.style.transform = `scale(${scale})`;

    if (current >= totalWatched) {
      countElem.textContent = totalWatched;
      countElem.style.transform = "scale(1)";
      clearInterval(counter);
    }
  }, 1000 / frameRate);
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
  const blocks = text.trim().split(/\n\s*\n/); // split movie blocks
  return blocks.map(block => {
    const lines = block.split("\n").map(l => l.trim());
    let movie = { title: "", poster: "", reviews: [], release: null, seen_date: "" };

    lines.forEach(line => {
      // Use regex to split on the first colon, ignoring spacing issues
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (!match) return;

      const field = match[1].trim().toLowerCase();
      const value = match[2].trim();

      switch (field) {
        case "movie":
          movie.title = value;
          break;
        case "poster":
          movie.poster = value;
          break;
        case "release":
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            movie.release = date;
            movie.releaseYear = date.getFullYear();
          } else {
            movie.release = null;
            movie.releaseYear = null;
            console.warn(`Invalid release date: "${value}"`);
          }
          break;
        case "seen":
          movie.seen_date = value;
          break;
        case "review":
          const [name, score] = value.split("|").map(s => s.trim());
          if (name && !isNaN(parseFloat(score))) {
            movie.reviews.push({ name, score: parseFloat(score) });
          }
          break;
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
          ${movie.title} ${movie.releaseYear ? `(${movie.releaseYear})` : ""}
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
    if (criteria === "release") {
      const aDate = a.release instanceof Date ? a.release.getTime() : 0;
      const bDate = b.release instanceof Date ? b.release.getTime() : 0;
      return (aDate - bDate) * currentDirection;
    } if (criteria === "rating") {
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
