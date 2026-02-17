//Supported formats @Jon, Jon@(Target), (Display Name)@(Target), Jon@Target

// ======================
// Replace @words with links (robust version)
// ======================
function replaceWordsWithLinks(rootNode = document.body) {
  fetch('/articles/pages.json')
    .then(res => res.json())
    .then(pages => {
      // Build lookup map (lowercase keys for case-insensitive matching)
      const pageMap = {};
      for (const page of pages) {
        pageMap[page.name.toLowerCase()] = page.url;
        if (Array.isArray(page.shorthands)) {
          for (const sh of page.shorthands) pageMap[sh.toLowerCase()] = page.url;
        }
      }

      const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      nodes.forEach(node => {
        const text = node.textContent;
        if (!text.includes('@')) return; // skip nodes without @

        const words = text.split(/(\s+)/); // keep whitespace

        const newWords = words.map(word => {
          let originalWord = word;

          // ---- Handle @Name and @Names (Swedish -s) ----
          if (word.startsWith('@')) {
            let target = word.slice(1).toLowerCase();
            let url = pageMap[target];

            if (!url && target.endsWith('s')) {
              const singular = target.slice(0, -1);
              url = pageMap[singular];
            }

            if (url) return `<a href="${url}">${originalWord}</a>`;
            return originalWord;
          }

          // ---- Handle Name@(Target) ----
          const atParenMatch = word.match(/^([\p{L}\p{N}_\-]+)@\((.+)\)$/u);
          if (atParenMatch) {
            const display = atParenMatch[1];
            let target = atParenMatch[2].toLowerCase();
            let url = pageMap[target];

            // Swedish genitive -s support
            if (!url && target.endsWith('s')) url = pageMap[target.slice(0,-1)];
            if (url) return `<a href="${url}">${display}</a>`;
            return originalWord;
          }

          // ---- Handle (Display)@(Target) ----
          const parenMatch = word.match(/^\((.+)\)@\((.+)\)$/u);
          if (parenMatch) {
            const display = parenMatch[1];
            let target = parenMatch[2].toLowerCase();
            let url = pageMap[target];

            if (!url && target.endsWith('s')) url = pageMap[target.slice(0,-1)];
            if (url) return `<a href="${url}">${display}</a>`;
            return originalWord;
          }

          // ---- Handle Name@Target ----
          const atMatch = word.match(/^([\p{L}\p{N}_\-]+)@([\p{L}\p{N}_\-]+)$/u);
          if (atMatch) {
            const display = atMatch[1];
            let target = atMatch[2].toLowerCase();
            let url = pageMap[target];

            if (!url && target.endsWith('s')) url = pageMap[target.slice(0,-1)];
            if (url) return `<a href="${url}">${display}</a>`;
            return originalWord;
          }

          return originalWord; // no match
        });

        // Replace the text node with a span containing the links
        if (newWords.join('') !== text) {
          const span = document.createElement('span');
          span.innerHTML = newWords.join('');
          node.parentNode.replaceChild(span, node);
        }
      });

      // ======================
      // Tooltip System
      // ======================
      function showTooltip(link, preview) {
        let tooltip = document.getElementById('link-preview-tooltip');
        if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.id = 'link-preview-tooltip';
          tooltip.style.position = 'absolute';
          tooltip.style.padding = '8px 12px';
          tooltip.style.background = 'rgba(0,0,0,0.94)';
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
        let left = rect.left + window.scrollX;
        let top = rect.bottom + window.scrollY + 8;
        const padding = 10;
        const tooltipWidth = 300;
        const viewportWidth = document.documentElement.clientWidth;

        if (left + tooltipWidth + padding > viewportWidth) left = viewportWidth - tooltipWidth - padding;
        if (left < padding) left = padding;

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
              const preview = metaDesc ? metaDesc.getAttribute('content') : 'No preview available';
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
// Template processing
// ======================
function processEventDataTemplate() {
  const template = document.getElementById('eventData');
  if (!template) return;

  const fragment = template.content.cloneNode(true);
  replaceWordsWithLinks(fragment);

  const timeline = document.getElementById('timeline');
  if (timeline) timeline.appendChild(fragment);
}

// ======================
// Init
// ======================
window.addEventListener('DOMContentLoaded', () => {
  processEventDataTemplate();
});