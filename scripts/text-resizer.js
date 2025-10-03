
function resizeTitleText() {
  const titles = document.querySelectorAll('.movie-title');

  titles.forEach(title => {
    let fontSize = 20; // Starting font size
    title.style.fontSize = fontSize + 'px';
    title.style.whiteSpace = 'nowrap'; // Prevent wrapping during measurement

    // Shrink until it fits without overflow
    while ((title.scrollWidth > title.clientWidth || title.scrollHeight > title.clientHeight) && fontSize > 5) {
      fontSize -= 1;
      title.style.fontSize = fontSize + 'px';
    }

    title.style.whiteSpace = ''; // Allow wrapping again if needed
  });
}

window.addEventListener('load', resizeTitleText);
window.addEventListener('resize', resizeTitleText);