console.log("✅ Timeline script loaded!");

function renderTimeline(containerId, dataId) {
  const timeline = document.getElementById(containerId);
  const template = document.getElementById(dataId);
  const dataContainer = template.content.cloneNode(true);

  const rawEvents = dataContainer.querySelectorAll('[data-year]');
  const events = Array.from(rawEvents).map(el => ({
    year: parseInt(el.getAttribute('data-year')),
    description: el.innerHTML.trim()
  })).filter(e => !isNaN(e.year));

  if (events.length < 2) return;

  // Sort by year
  events.sort((a, b) => a.year - b.year);

  const minYear = events[0].year;
  const maxYear = events[events.length - 1].year;
  const range = maxYear - minYear;

  // Clear the timeline container once
  timeline.innerHTML = '';

  // Save range in dataset for later use
  timeline.dataset.minYear = minYear;
  timeline.dataset.maxYear = maxYear;

  // Create and insert event elements
  events.forEach(event => {
    const eventEl = document.createElement('div');
    eventEl.className = 'event';
    eventEl.dataset.year = event.year;

    eventEl.innerHTML = `
      <div class="event-marker"></div>
      <div class="event-label">${event.year}<br>${event.description}</div>
    `;

    timeline.appendChild(eventEl);
  });

  // Position all events
  repositionTimelineEvents(timeline);

  // Insert links after rendering
  if (typeof replaceWordsWithLinks === 'function') {
    replaceWordsWithLinks(timeline);
  }
}

function repositionTimelineEvents(timeline) {
  const minYear = parseInt(timeline.dataset.minYear);
  const maxYear = parseInt(timeline.dataset.maxYear);
  const range = maxYear - minYear;
  const containerWidth = timeline.offsetWidth;

  const eventElements = timeline.querySelectorAll('.event');

  eventElements.forEach(el => {
    const year = parseInt(el.dataset.year);
    if (isNaN(year)) return;

    const percent = range === 0 ? 0 : (year - minYear) / range;
    const posX = percent * containerWidth;
    el.style.left = `${posX}px`;
  });
}

// Run on load
window.addEventListener('load', () => {
  renderTimeline('timeline', 'eventData');
});

// Only reposition on resize, don't rerender
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const timeline = document.getElementById('timeline');
    repositionTimelineEvents(timeline);
  }, 100);
});

// Optional: Script loader for external dependencies
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${url}`));
    document.head.appendChild(script);
  });
}

// Load and run the link inserter once
(async () => {
  try {
    await loadScript('/scripts/scripts-for-all/link-inserter.js');
    if (typeof replaceWordsWithLinks === 'function') {
      replaceWordsWithLinks();
    }
  } catch (err) {
    console.error(err);
  }
})();