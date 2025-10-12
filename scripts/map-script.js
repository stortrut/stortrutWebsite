const wrapper = document.getElementById('map-wrapper');
const viewport = document.getElementById('map-viewport');

let isDragging = false;
let startX, startY;
let currentX = 0, currentY = 0;

viewport.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX - currentX;
  startY = e.clientY - currentY;
  viewport.style.cursor = 'grabbing';
});

viewport.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  e.preventDefault();
  currentX = e.clientX - startX;
  currentY = e.clientY - startY;
  wrapper.style.transform = `translate(${currentX}px, ${currentY}px)`;
});

viewport.addEventListener('mouseup', () => {
  isDragging = false;
  viewport.style.cursor = 'grab';
});

viewport.addEventListener('mouseleave', () => {
  isDragging = false;
  viewport.style.cursor = 'grab';
});

function cityClicked(cityName) {
  alert(`You clicked on ${cityName}`);
}
