
function resizeTitleText() {
  const titles = document.querySelectorAll('.movie-title');
  
  titles.forEach(title => {
    let fontSize = 20; // start at 20px
    title.style.fontSize = fontSize + 'px';

    // Reduce font size until it fits
    while (title.scrollWidth > title.clientWidth && fontSize > 8) {
      fontSize -= 1;
      title.style.fontSize = fontSize + 'px';
    }
  });
}

window.addEventListener('load', resizeTitleText);
window.addEventListener('resize', resizeTitleText);
