function initTimeline(containerId = 'timeline', dataId = 'eventData') {
    console.log("✅ Timeline script loaded!");

    // --- Tooltip function ---
    function addEventAgeTooltips(timeline) {
        const minYear = parseInt(timeline.dataset.minYear, 10);
        if (isNaN(minYear)) return;

        let tooltip = document.getElementById('timeline-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'timeline-tooltip';
            Object.assign(tooltip.style, {
                position: 'absolute',
                padding: '6px 10px',
                background: '#000',
                color: '#fff',
                borderRadius: '4px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: '9999',
                opacity: '0',
                transition: 'opacity 0.2s ease'
            });
            document.body.appendChild(tooltip);
        }

        const events = timeline.querySelectorAll('.event');
        events.forEach(eventEl => {
            const year = parseInt(eventEl.dataset.year, 10);
            if (isNaN(year)) return;
            const age = year - minYear;

            eventEl.addEventListener('mouseenter', () => {
                tooltip.textContent = `Age: ${age} years`;
                requestAnimationFrame(() => {
                    const rect = eventEl.getBoundingClientRect();
                    tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2 - tooltip.offsetWidth / 2}px`;
                    tooltip.style.top = `${rect.top + window.scrollY - 30}px`;
                    tooltip.style.opacity = '1';
                });
            });

            eventEl.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
            });
        });
    }

    // --- Font size adjustment ---
    function adjustEventLabelFontSize(timeline) {
        const events = timeline.querySelectorAll('.event');
        if (events.length < 2) return;

        const containerWidth = timeline.offsetWidth;
        const baseFontSize = 20;

        events.forEach(ev => {
            const label = ev.querySelector('.event-label');
            if (label) {
                label.style.fontSize = `${baseFontSize}px`;
                label.style.whiteSpace = 'nowrap';
                label.querySelectorAll('*').forEach(el => el.style.fontSize = `${baseFontSize}px`);
            }
        });

        let minGap = containerWidth;
        for (let i = 1; i < events.length; i++) {
            const gap = events[i].offsetLeft - events[i-1].offsetLeft;
            if (gap < minGap) minGap = gap;
        }
        const maxLabelWidth = minGap * 0.9;

        let bestFontSize = baseFontSize;
        while (bestFontSize > 8) {
            let allFit = true;
            for (const ev of events) {
                const label = ev.querySelector('.event-label');
                if (!label) continue;
                label.style.fontSize = `${bestFontSize}px`;
                label.querySelectorAll('*').forEach(el => el.style.fontSize = `${bestFontSize}px`);
                if (label.scrollWidth > maxLabelWidth) { allFit = false; break; }
            }
            if (allFit) break;
            bestFontSize -= 0.5;
        }

        events.forEach(ev => {
            const label = ev.querySelector('.event-label');
            if (label) {
                label.style.fontSize = `${bestFontSize}px`;
                label.style.whiteSpace = '';
                label.querySelectorAll('*').forEach(el => el.style.fontSize = `${bestFontSize}px`);
            }
        });
    }

    // --- Event positioning ---
    function repositionTimelineEvents(timeline) {
        const events = timeline.querySelectorAll('.event');
        if (events.length === 0) return;

        const spacing = timeline.offsetWidth / (events.length - 1);
        events.forEach((el, idx) => el.style.left = `${spacing * idx}px`);
    }

    // --- Render timeline ---
    function renderTimeline() {
        const timeline = document.getElementById(containerId);
        const template = document.getElementById(dataId);
        if (!timeline || !template) return;

        const dataContainer = template.content.cloneNode(true);
        const rawEvents = dataContainer.querySelectorAll('[data-year]');
        const events = Array.from(rawEvents).map(el => ({
            year: parseInt(el.getAttribute('data-year')),
            modifier: el.getAttribute('data-year-modifier') || '',
            description: el.innerHTML.trim()
        })).filter(e => !isNaN(e.year));

        if (events.length < 2) return;
        events.sort((a,b) => a.year - b.year);

        timeline.innerHTML = '';
        timeline.dataset.minYear = events[0].year;
        timeline.dataset.maxYear = events[events.length-1].year;

        events.forEach(ev => {
            const eventEl = document.createElement('div');
            eventEl.className = 'event';
            eventEl.dataset.year = ev.year;
            eventEl.innerHTML = `
                <div class="event-marker"></div>
                <div class="event-label">${ev.year}${ev.modifier ? ' ' + ev.modifier : ''}<br>${ev.description}</div>
            `;
            timeline.appendChild(eventEl);
        });

        repositionTimelineEvents(timeline);
        adjustEventLabelFontSize(timeline);
        addEventAgeTooltips(timeline);

        if (typeof replaceWordsWithLinks === 'function') replaceWordsWithLinks(timeline);
    }

    // --- Initial render ---
    renderTimeline();

    // --- Resize handling ---
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const timeline = document.getElementById(containerId);
            repositionTimelineEvents(timeline);
            adjustEventLabelFontSize(timeline);
        }, 100);
    });

    // --- Optional external script loader ---
    async function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load ${url}`));
            document.head.appendChild(script);
        });
    }

    // Load optional link-inserter
    (async () => {
        try {
            await loadScript('/scripts/scripts-for-all/link-inserter.js');
            if (typeof replaceWordsWithLinks === 'function') replaceWordsWithLinks();
        } catch(e) { console.error(e); }
    })();
}
