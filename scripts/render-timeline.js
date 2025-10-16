function renderTimeline(containerId, dataId) {
    const timeline = document.getElementById(containerId);
    const template = document.getElementById(dataId);
    const dataContainer = template.content;
    const rawEvents = dataContainer.querySelectorAll('[data-year]');

    const events = Array.from(rawEvents).map(el => ({
        year: parseInt(el.getAttribute('data-year')),
        description: el.innerHTML.trim() // <-- Preserve full HTML (e.g., <p>)
    })).filter(e => !isNaN(e.year));

    if (events.length < 2) return;

    // Sort events by year
    events.sort((a, b) => a.year - b.year);

    const minYear = events[0].year;
    const maxYear = events[events.length - 1].year;
    const range = maxYear - minYear;
    const containerWidth = timeline.offsetWidth;

    timeline.innerHTML = ''; // Clear previous timeline

    events.forEach(event => {
        const percent = range === 0 ? 0 : (event.year - minYear) / range;
        const posX = percent * containerWidth;

        const eventEl = document.createElement('div');
        eventEl.className = 'event';
        eventEl.style.left = `${posX}px`;

        eventEl.innerHTML = `
      <div class="event-marker"></div>
      <div class="event-label">
        ${event.year}<br>
        ${event.description}
      </div>
    `;

        timeline.appendChild(eventEl);
    });
}

// Run on page load
window.addEventListener('load', () => {
    renderTimeline('timeline', 'eventData');
});

// Optional: Re-render on window resize for responsiveness
window.addEventListener('resize', () => {
    renderTimeline('timeline', 'eventData');
});
