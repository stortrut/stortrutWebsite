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
  adjustEventLabelFontSize(timeline);


  // Insert links after rendering
  if (typeof replaceWordsWithLinks === 'function') {
    replaceWordsWithLinks(timeline);
  }
}

function repositionTimelineEvents(timeline) {
  const eventElements = timeline.querySelectorAll('.event');
  const containerWidth = timeline.offsetWidth;

  const count = eventElements.length;
  if (count === 0) return;

  const spacing = containerWidth / (count - 1);

  eventElements.forEach((el, index) => {
    const posX = spacing * index;
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
    adjustEventLabelFontSize(timeline);

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

function adjustEventLabelFontSize(timeline) {
  const events = timeline.querySelectorAll('.event');
  if (events.length < 2) return;

  const containerWidth = timeline.offsetWidth;

  // Reset font size first to default (inherit from CSS)
  events.forEach(ev => {
    ev.querySelector('.event-label').style.fontSize = '';
  });

  // Calculate minimum distance between adjacent event markers
  let minGap = containerWidth;
  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1];
    const curr = events[i];
    const gap = curr.offsetLeft - prev.offsetLeft;
    if (gap < minGap) minGap = gap;
  }

  // Allow label width to be ~85-90% of the min gap
  const maxLabelWidth = minGap * 0.9;

  events.forEach(ev => {
    const label = ev.querySelector('.event-label');
    if (!label) return;

    let fontSize = parseFloat(window.getComputedStyle(label).fontSize);

    // Gradually shrink font size while the label overflows and above min font size
    while (label.scrollWidth > maxLabelWidth && fontSize > 8) {
      fontSize -= 0.5;
      label.style.fontSize = fontSize + 'px';
    }
  });
}