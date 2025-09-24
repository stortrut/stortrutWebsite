// Fetch the movie data and render everything
fetch("movies.txt")
  .then(res => res.text())
  .then(text => {
    const movies = parseMovies(text);
    renderMovies(movies);
    renderStars(); // run star renderer after DOM is ready
  })
  .catch(err => {
    document.getElementById("reviews").textContent = "Error loading movies.txt";
    console.error(err);
  });

function parseMovies(text) {
  const blocks = text.trim().split(/\n\s*\n/); // split by blank lines
  return blocks.map(block => {
    const lines = block.split("\n").map(l => l.trim());
    let movie = { title: "", poster: "", reviews: [], year: "", genre: "" };

    lines.forEach(line => {
      if (line.startsWith("Movie:")) movie.title = line.replace("Movie:", "").trim();
      else if (line.startsWith("Poster:")) movie.poster = line.replace("Poster:", "").trim();
      else if (line.startsWith("Year:")) movie.year = line.replace("Year:", "").trim();
      else if (line.startsWith("Genre:")) movie.genre = line.replace("Genre:", "").trim();
      else if (line.startsWith("Review:")) {
        const [, review] = line.split("Review:");
        const [name, score] = review.split("|").map(s => s.trim());
        movie.reviews.push({ name, score: parseFloat(score) });
      }
    });

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
}

// ★ Star rendering logic (moved here, no extra file needed)
function renderStars() {
  document.querySelectorAll('.star-rating').forEach(el => {
    const score = parseFloat(el.dataset.score) || 0;

    // Insert star layers if not already present
    if (!el.querySelector('.star-fill')) {
      el.innerHTML = `
        <span class="star-fill">★★★★★</span>
        <span class="star-base">★★★★★</span>
      `;
    }

    // Measure one star width
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
