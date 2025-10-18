console.log("✅ Timeline script loaded!");

function renderTimeline(containerId, dataId) {
  const timeline = document.getElementById(containerId);
  const template = document.getElementById(dataId);
  const dataContainer = template.content.cloneNode(true); // Clone to access the content

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
  const containerWidth = timeline.offsetWidth;

  timeline.innerHTML = ''; // Clear existing content

  events.forEach(event => {
    const percent = range === 0 ? 0 : (event.year - minYear) / range;
    const posX = percent * containerWidth;

    const eventEl = document.createElement('div');
    eventEl.className = 'event';
    eventEl.style.left = `${posX}px`;

    eventEl.innerHTML = `
      <div class="event-marker"></div>
      <div class="event-label">${event.year}<br>${event.description}</div>
    `;

    timeline.appendChild(eventEl);

      // 👇 Insert links after re-rendering the timeline
  if (typeof replaceWordsWithLinks === 'function') {
    replaceWordsWithLinks(timeline);
  }
  });
}

window.addEventListener('load', () => {
  renderTimeline('timeline', 'eventData');
});

window.addEventListener('resize', () => {
  renderTimeline('timeline', 'eventData');
});


function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${url}`));
    document.head.appendChild(script);
  });
}

(async () => {
  try {
    // Load the other scripts sequentially (or you can do them in parallel with Promise.all)
    await loadScript('/scripts/scripts-for-all/link-inserter.js');

    // Now call the functions — they should be defined now
    if (typeof replaceWordsWithLinks === 'function') {
      replaceWordsWithLinks();
    }
  } catch (err) {
    console.error(err);
  }
})();
