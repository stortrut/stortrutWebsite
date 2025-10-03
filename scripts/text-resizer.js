function resizeTitleText() {
  const titles = document.querySelectorAll('.movie-title');

  titles.forEach(title => {
    const parent = title.parentElement;
    if (!parent) return;

    let fontSize = 24;
    title.style.fontSize = fontSize + 'px';

    const maxHeight = parent.clientHeight;
    const maxWidth = parent.clientWidth;

    // Temporarily set styles to allow wrapping and measure overflow
    title.style.whiteSpace = 'normal';
    title.style.display = 'inline-block';
    title.style.lineHeight = '1.2';

    // Shrink until it fits both height and width
    while (
      (title.scrollHeight > maxHeight || title.scrollWidth > maxWidth) &&
      fontSize > 10
    ) {
      fontSize -= 1;
      title.style.fontSize = fontSize + 'px';
    }

    // Optional: Reset any temporary styles
    title.style.display = '';
  });
}

window.addEventListener('load', resizeTitleText);
window.addEventListener('resize', resizeTitleText);
