let allMovies = []; // store parsed movies globally

fetch("/movie-data.txt")
  .then(res => res.text())
  .then(text => {
    allMovies = parseMovies(text);
    renderMovies(allMovies);

    // attach sorting
    document.getElementById("sort-select").addEventListener("change", e => {
      sortMovies(e.target.value);
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

  movies.forEach(movie => {
    const movieDiv = document.createElement("div");
    movieDiv.className = "all-review-data-holder";

    movieDiv.innerHTML = `
      <div class="review-data-holder">
        <p class="movie-title">${movie.title} ${movie.year ? "(" + movie.year + ")" : ""}</p>
        ${movie.genre ? `<p><em>${movie.genre}</em></p>` : ""}
        <img class="movie-poster" src="${movie.poster}">
        <div class="reviews-holder">
          ${movie.reviews.map(r => `
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

// star renderer
function renderStars() {
  document.querySelectorAll('.star-rating').forEach(el => {
    const score = parseFloat(el.dataset.score) || 0;

    if (!el.querySelector('.star-fill')) {
      el.innerHTML = `
        <span class="star-fill">★★★★★</span>
        <span class="star-base">★★★★★</span>
      `;
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

// 🔥 Sort logic
function sortMovies(criteria) {
  let sorted = [...allMovies]; // copy

  if (criteria === "title") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (criteria === "year") {
    sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
  } else if (criteria === "rating") {
    sorted.sort((a, b) => b.avgRating - a.avgRating);
  } else if (criteria === "seen-date") {
    sorted.sort((a, b) => {
      const da = a.seen_date ? a.seen_date.getTime() : 0;
      const db = b.seen_date ? b.seen_date.getTime() : 0;
      return db - da; // newest → oldest
    });

  renderMovies(sorted);
}
}
