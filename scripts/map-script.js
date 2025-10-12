const wrapper = document.getElementById('map-wrapper');
const viewport = document.getElementById('map-viewport');

let isDragging = false;
let startX, startY;
let currentX = 0, currentY = 0;

let scale = 1;  // Start fully zoomed out
const minScale = 1;
const maxScale = 10;

function updateTransform() {
  wrapper.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
}

// Center the map visually on load
const rect = viewport.getBoundingClientRect();
currentX = (rect.width - rect.width * scale) / 2;
currentY = (rect.height - rect.height * scale) / 2;

updateTransform();

// DRAGGING ----------------------

viewport.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX - currentX;
  startY = e.clientY - currentY;
  viewport.style.cursor = 'grabbing';
});

viewport.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  currentX = e.clientX - startX;
  currentY = e.clientY - startY;
  updateTransform();
});

viewport.addEventListener('mouseup', () => {
  isDragging = false;
  viewport.style.cursor = 'grab';
});

viewport.addEventListener('mouseleave', () => {
  isDragging = false;
  viewport.style.cursor = 'grab';
});

// ZOOMING ------------------------

viewport.addEventListener('wheel', (e) => {
  e.preventDefault();

  const zoomFactor = 0.1;
  const oldScale = scale;

  if (e.deltaY < 0) {
    scale = Math.min(scale + zoomFactor, maxScale);
  } else {
    scale = Math.max(scale - zoomFactor, minScale);
  }

  const rect = viewport.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const mapX = (mouseX - currentX) / oldScale;
  const mapY = (mouseY - currentY) / oldScale;

  currentX -= (scale - oldScale) * mapX;
  currentY -= (scale - oldScale) * mapY;

  updateTransform();
}, { passive: false });

// CITY MARKER CLICK -------------

function cityClicked(cityName) {
  alert(`You clicked on ${cityName}`);
}

// BUTTON ZOOM (centered on viewport center)

function zoomAtViewportCenter(deltaScale) {
  const oldScale = scale;
  const newScale = Math.max(minScale, Math.min(maxScale, scale + deltaScale));

  const rect = viewport.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const mapX = (centerX - currentX) / oldScale;
  const mapY = (centerY - currentY) / oldScale;

  scale = newScale;

  currentX -= (scale - oldScale) * mapX;
  currentY -= (scale - oldScale) * mapY;

  updateTransform();
}

function zoomIn() {
  zoomAtViewportCenter(0.1);
}

function zoomOut() {
  zoomAtViewportCenter(-0.1);
}

// CLICK TO GET COORDINATES --------

viewport.addEventListener('click', (e) => {
  const rect = viewport.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const x = (mouseX - currentX) / scale;
  const y = (mouseY - currentY) / scale;

  console.log(`Clicked coordinates: top: ${Math.round(y)}px; left: ${Math.round(x)}px`);
});