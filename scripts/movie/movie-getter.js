function getMovies(text) {
    const blocks = text.trim().split(/\r?\n\s*\r?\n/);

    return blocks.map(block => {

        
        const lines = block.split(/\r?\n/).map(l => l.trim());

        let movie = {
            title: "",
            poster: "",
            reviews: [],
            release: null,
            seen_date: "",
            genre: ""
        };

        lines.forEach(line => {
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
                    movie.release = value;
                    break;

                case "seen":
                    movie.seen_date = value;
                    break;

                case "genre":
                    movie.genre = value;
                    break;

                case "review":
                    const [name, score] = value.split("|").map(s => s.trim());

                    if (name && !isNaN(parseFloat(score))) {
                        movie.reviews.push({
                            name,
                            score: parseFloat(score)
                        });
                    }
                    break;
            }
        });

        if (movie.title && movie.release && movie.poster) {
            return movie;
        }

        return null;
    }).filter(movie => movie !== null);
}