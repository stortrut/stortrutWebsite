let allMovies = []; // store parsed movies globally

fetch("/movie-data.txt")
  .then(res => res.text())
  .then(text => {
    allMovies = parseMovies(text);

    // get the currently selected sort option
    const sortSelect = document.getElementById("sort-select");
    sortMovies(sortSelect.value); // render sorted initially

    // attach sorting event
    sortSelect.addEventListener("change", e => {
      sortMovies(e.target.value);
    });

    // attach reviewer filter events
    document.querySelectorAll('#reviewer-filters input').forEach(cb => {
      cb.addEventListener("change", () => {
        sortMovies(sortSelect.value); // reapply sort + filter
      });
    });
  })
  .catch(err => {
    document.getElementById("reviews").textContent = "Error loading movies.txt";
    console.error(err);
  });

function parseMovies(text) {
  const blocks = text.trim().split(/\n\s*\n/); // split by blank lines
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

    // calculate average rating
    if (movie.reviews.length) {
      movie.avgRating = movie.reviews.reduce((a, r) => a + r.score, 0) / movie.reviews.length;
    } else {
      movie.avgRating = 0;
    }

    return movie;
  });
}

function renderMovies(movies) {
    const container = document.getElementById("reviews");
    container.innerHTML = "";
  
    // get active reviewers from checkboxes
    const activeReviewers = Array.from(document.querySelectorAll('#reviewer-filters input:checked'))
      .map(cb => cb.value);
  
    movies.forEach(movie => {
      // if reviewers are checked, require ALL of them to exist in this movie
      if (activeReviewers.length > 0) {
        const reviewersInMovie = movie.reviews.map(r => r.name);
        const hasAll = activeReviewers.every(name => reviewersInMovie.includes(name));
        if (!hasAll) return; // skip this movie completely
      }
  
      // filter reviews to only show the checked ones (if any)
      const reviewsToShow = activeReviewers.length > 0
        ? movie.reviews.filter(r => activeReviewers.includes(r.name))
        : movie.reviews;
  
      // skip if somehow no reviews left
      if (reviewsToShow.length === 0) return;
  
      const movieDiv = document.createElement("div");
      movieDiv.className = "all-review-data-holder";
  
      movieDiv.innerHTML = `
        <div class="review-data-holder">
          <p class="movie-title">
            ${movie.title} ${movie.date ? "(" + movie.date.toISOString().split("T")[0] + ")" : ""}
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
  
    renderStars(); // re-run star filling
  }

// 🔥 Sort logic
function sortMovies(criteria) {
  let sorted = [...allMovies]; // copy

  if (criteria === "title") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (criteria === "titlereverse") {
    sorted.sort((a, b) => b.title.localeCompare(a.title));
  } else if (criteria === "year") {
    sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
  } else if (criteria === "yearreverse") {
    sorted.sort((a, b) => (a.year || 0) - (b.year || 0));
  } else if (criteria === "rating") {
    sorted.sort((a, b) => b.avgRating - a.avgRating);
  } else if (criteria === "ratingreverse") {
    sorted.sort((a, b) => a.avgRating - b.avgRating);
  } else if (criteria === "seen-date") {
    sorted.sort((a, b) => {
      const da = a.seen_date ? new Date(a.seen_date).getTime() : 0;
      const db = b.seen_date ? new Date(b.seen_date).getTime() : 0;
      return db - da; // newest → oldest
    });
  } else if (criteria === "seen-datereverse") {
    sorted.sort((a, b) => {
      const da = a.seen_date ? new Date(a.seen_date).getTime() : 0;
      const db = b.seen_date ? new Date(b.seen_date).getTime() : 0;
      return da - db;
    });
  }

  renderMovies(sorted);
}
