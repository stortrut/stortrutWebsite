function resizeTitleText() {
  const titles = document.querySelectorAll('.movie-title');

  titles.forEach(title => {
    const parent = title.parentElement;
    if (!parent) return;

    const maxHeight = parent.clientHeight;
    const maxWidth = parent.clientWidth;

    // Get original font size from computed style
    const originalFontSize = parseFloat(getComputedStyle(title).fontSize);
    let fontSize = originalFontSize;

    // Reset to original font size before measuring
    title.style.fontSize = fontSize + 'px';
    title.style.whiteSpace = 'normal';
    title.style.display = 'inline-block';
    title.style.lineHeight = '1.2';

    // Shrink until it fits
    while (
      (title.scrollHeight > maxHeight || title.scrollWidth > maxWidth) &&
      fontSize > 10
    ) {
      fontSize -= 1;
      title.style.fontSize = fontSize + 'px';
    }

    // Optional: Grow back up if space allows
    while (
      title.scrollHeight < maxHeight &&
      title.scrollWidth < maxWidth &&
      fontSize < originalFontSize
    ) {
      fontSize += 1;
      title.style.fontSize = fontSize + 'px';
      if (title.scrollHeight > maxHeight || title.scrollWidth > maxWidth) {
        fontSize -= 1; // back off
        title.style.fontSize = fontSize + 'px';
        break;
      }
    }

    // Cleanup
    title.style.display = '';
  });
}

// Debounce resize calls
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(resizeTitleText, 150);
});

window.addEventListener('load', resizeTitleText);
