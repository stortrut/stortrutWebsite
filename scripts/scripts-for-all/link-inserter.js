//Supported formats @Jon, Jon@(Target), (Display Name)@(Target), Jon@Target

function replaceWordsWithLinks(rootNode = document.body) {
  fetch('/articles/pages.json')
    .then(res => res.json())
    .then(pages => {

      // Build lookup map
      const pageMap = {};
      for (const page of pages) {
        const url = page.url;
        pageMap[page.name.toLowerCase()] = url;

        if (Array.isArray(page.shorthands)) {
          for (const sh of page.shorthands) {
            pageMap[sh.toLowerCase()] = url;
          }
        }
      }

      console.log('✅ links inserted');

      const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      // 🔹 FIXED REGEX (uses lookbehind — does NOT consume space)
      const pattern = /(?<=^|\s)@([\p{L}\p{N}_\-]+)|\(([^\)]+)\)\s*@\(([^\)]+)\)|([\p{L}\p{N}_\-]+)\s*@\(([^\)]+)\)|([\p{L}\p{N}_\-]+)\s*@([\p{L}\p{N}_\-]+)|([\p{L}\p{N}_\-]+)@([\p{L}\p{N}_\-]+)/gu;


      for (const node of nodes) {
        const text = node.textContent;
        if (!text.includes('@')) continue;

        const newHtml = text.replace(pattern, (
          match,
          atOnlyTarget,
          dispParen, targetParen1,
          dispWordMulti, targetParen2,
          dispWordSingle, targetSingle1,
          dispWordSingleNoSpace, targetSingle2
        ) => {

          const targetName = (
            atOnlyTarget ||
            targetParen1 ||
            targetParen2 ||
            targetSingle1 ||
            targetSingle2 ||
            ''
          ).trim();

          const key = targetName.toLowerCase();
          const url = pageMap[key];
          if (!url) return match;

          const displayText = (
            dispParen ||
            dispWordMulti ||
            dispWordSingle ||
            dispWordSingleNoSpace ||
            atOnlyTarget ||
            ''
          ).trim();

          return `<a href="${url}">${displayText}</a>`;
        });

        if (newHtml !== text) {
          const span = document.createElement('span');
          span.innerHTML = newHtml;
          node.parentNode.replaceChild(span, node);
        }
      }

      // ======================
      // TOOLTIP SYSTEM
      // ======================

      function showTooltip(link, preview) {
        let tooltip = document.getElementById('link-preview-tooltip');

        if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.id = 'link-preview-tooltip';
          tooltip.style.position = 'absolute';
          tooltip.style.padding = '8px 12px';
          tooltip.style.background = 'rgba(0, 0, 0, 0.94)';
          tooltip.style.color = '#fff';
          tooltip.style.borderRadius = '4px';
          tooltip.style.pointerEvents = 'none';
          tooltip.style.transition = 'opacity 0.2s ease';
          tooltip.style.opacity = '0';
          tooltip.style.maxWidth = '300px';
          tooltip.style.whiteSpace = 'normal';
          tooltip.style.zIndex = '9999';
          document.body.appendChild(tooltip);
        }

        tooltip.textContent = preview;

        const rect = link.getBoundingClientRect();
        const tooltipWidth = 300;
        const padding = 10;

        const top = rect.bottom + window.scrollY + 8;
        let left = rect.left + window.scrollX;

        const viewportWidth = document.documentElement.clientWidth;

        if (left + tooltipWidth + padding > viewportWidth) {
          left = viewportWidth - tooltipWidth - padding;
        }

        if (left < padding) {
          left = padding;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.style.opacity = '1';
      }

      function hideTooltip() {
        const tooltip = document.getElementById('link-preview-tooltip');
        if (tooltip) tooltip.style.opacity = '0';
      }

      document.querySelectorAll('a').forEach(link => {

        if (link.closest('#toc-sidebar')) return;

        link.addEventListener('mouseenter', async () => {

          if (!link.dataset.preview) {
            try {
              const res = await fetch(link.href);
              const text = await res.text();
              const parser = new DOMParser();
              const doc = parser.parseFromString(text, 'text/html');

              const metaDesc = doc.querySelector('meta[name="description"]');
              const preview = metaDesc
                ? metaDesc.getAttribute('content')
                : 'No preview available';

              link.dataset.preview = preview;

            } catch {
              link.dataset.preview = 'Failed to load preview';
            }
          }

          showTooltip(link, link.dataset.preview);
        });

        link.addEventListener('mouseleave', hideTooltip);
      });

    })
    .catch(err => console.error('Error loading pages.json', err));
}


// ======================
// TEMPLATE PROCESSING
// ======================

function processEventDataTemplate() {
  const template = document.getElementById('eventData');
  if (!template) return;

  const fragment = template.content.cloneNode(true);

  replaceWordsWithLinks(fragment);

  const timeline = document.getElementById('timeline');
  if (timeline) {
    timeline.appendChild(fragment);
  }
}


// ======================
// INIT
// ======================

window.addEventListener('DOMContentLoaded', () => {
  processEventDataTemplate();
});