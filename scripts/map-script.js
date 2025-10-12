let mapContainer = document.getElementById('map-container');
let map = document.getElementById('map');
let isDragging = false;
let startX, startY;

mapContainer.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX - map.offsetLeft;
  startY = e.clientY - map.offsetTop;
  mapContainer.style.cursor = 'grabbing';
});

mapContainer.addEventListener('mousemove', (e) => {
  if (isDragging) {
    let x = e.clientX - startX;
    let y = e.clientY - startY;
    map.style.left = `${x}px`;
    map.style.top = `${y}px`;
  }
});

mapContainer.addEventListener('mouseup', () => {
  isDragging = false;
  mapContainer.style.cursor = 'grab';
});

mapContainer.addEventListener('mouseleave', () => {
  isDragging = false;
  mapContainer.style.cursor = 'grab';
});

function cityClicked(cityName) {
  alert(`You clicked on ${cityName}`);
  // You can redirect, show more info, etc. here.
}
