console.log("✅ Timeline script loaded!");

function renderTimeline(containerId, dataId) {
    const timeline = document.getElementById(containerId);
    const template = document.getElementById(dataId);
    const dataContainer = template.content.cloneNode(true);

    const rawEvents = dataContainer.querySelectorAll('[data-year]');
    const events = Array.from(rawEvents).map(el => ({
        year: parseInt(el.getAttribute('data-year')),
        modifier: el.getAttribute('data-year-modifier') || '',
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
  <div class="event-label">
    ${event.year}${event.modifier ? ' ' + event.modifier : ''}<br>
    ${event.description}
  </div>
`;

        timeline.appendChild(eventEl);
    });

    // Position all events
    repositionTimelineEvents(timeline);
    adjustEventLabelFontSize(timeline);
    addEventAgeTooltips(timeline);


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

  // Reset all font sizes to a baseline first
  const baseFontSize = 20; // or whatever your default is
  events.forEach(ev => {
    const label = ev.querySelector('.event-label');
    if (label) {
      label.style.fontSize = `${baseFontSize}px`;
      label.style.whiteSpace = 'nowrap';
      label.querySelectorAll('*').forEach(el => {
        el.style.fontSize = `${baseFontSize}px`;
      });
    }
  });

  // Calculate minimum horizontal gap between adjacent events
  let minGap = containerWidth;
  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1];
    const curr = events[i];
    const gap = curr.offsetLeft - prev.offsetLeft;
    if (gap < minGap) minGap = gap;
  }

  const maxLabelWidth = minGap * 0.9;

  // Determine the smallest font size that fits all labels within maxLabelWidth
  let bestFontSize = baseFontSize;

  while (bestFontSize > 8) {
    let allFit = true;

    for (const ev of events) {
      const label = ev.querySelector('.event-label');
      if (!label) continue;

      label.style.fontSize = `${bestFontSize}px`;
      label.querySelectorAll('*').forEach(el => {
        el.style.fontSize = `${bestFontSize}px`;
      });

      if (label.scrollWidth > maxLabelWidth) {
        allFit = false;
        break;
      }
    }

    if (allFit) break;

    bestFontSize -= 0.5;
  }

  // Apply the best font size to all labels uniformly
  events.forEach(ev => {
    const label = ev.querySelector('.event-label');
    if (label) {
      label.style.fontSize = `${bestFontSize}px`;
      label.style.whiteSpace = '';
      label.querySelectorAll('*').forEach(el => {
        el.style.fontSize = `${bestFontSize}px`;
      });
    }
  });




  function addEventAgeTooltips(timeline) {
  const minYear = parseInt(timeline.dataset.minYear, 10);
  if (isNaN(minYear)) return;

  // Create or reuse the tooltip element
  let tooltip = document.getElementById('timeline-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'timeline-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.padding = '6px 10px';
    tooltip.style.background = '#000';
    tooltip.style.color = '#fff';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';
    tooltip.style.whiteSpace = 'nowrap';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '9999';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.2s ease';
    document.body.appendChild(tooltip);
  }

  const events = timeline.querySelectorAll('.event');

  events.forEach(eventEl => {
    const year = parseInt(eventEl.dataset.year, 10);
    if (isNaN(year)) return;

    const age = year - minYear;

    eventEl.addEventListener('mouseenter', e => {
      tooltip.textContent = `Ålder: ${age} år`;
      const rect = eventEl.getBoundingClientRect();
      tooltip.style.left = `${rect.left + window.scrollX + 10}px`;
      tooltip.style.top = `${rect.top + window.scrollY - 30}px`;
      tooltip.style.opacity = '1';
    });

    eventEl.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
  });
}

}