function resizeTitleText() {
  const titles = document.querySelectorAll('.movie-title');

  titles.forEach(title => {
    let fontSize = 24; // Try a higher starting size
    title.style.fontSize = fontSize + 'px';

    const parent = title.parentElement;
    if (!parent) return;

    // Shrink only if overflowing container
    while (
      (title.scrollWidth > parent.clientWidth || title.scrollHeight > parent.clientHeight) &&
      fontSize > 10
    ) {
      fontSize -= 1;
      title.style.fontSize = fontSize + 'px';
    }
  });
}

window.addEventListener('load', resizeTitleText);
window.addEventListener('resize', resizeTitleText);