const wrapper = document.getElementById('map-wrapper');
const viewport = document.getElementById('map-viewport');

let isDragging = false;
let startX, startY;
let currentX = 0, currentY = 0;

let scale = 2;
const minScale = 1;
const maxScale = 5;

function updateTransform() {
  wrapper.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
}

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

  // Calculate new scale
  if (e.deltaY < 0) {
    scale = Math.min(scale + zoomFactor, maxScale);
  } else {
    scale = Math.max(scale - zoomFactor, minScale);
  }

  // Calculate mouse position relative to map-wrapper's top-left corner
  const rect = wrapper.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Ratio of mouse position to current scale
  const ratioX = mouseX / oldScale;
  const ratioY = mouseY / oldScale;

  // Adjust pan to keep the zoom centered on cursor
  currentX -= (scale - oldScale) * ratioX;
  currentY -= (scale - oldScale) * ratioY;

  updateTransform();
}, { passive: false });

// CITY MARKER CLICK -------------

function cityClicked(cityName) {
  alert(`You clicked on ${cityName}`);
}

// For buttons
function zoomAtViewportCenter(deltaScale) {
  const oldScale = scale;
  const newScale = Math.max(minScale, Math.min(maxScale, scale + deltaScale));

  const rect = viewport.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const ratioX = (centerX - wrapper.getBoundingClientRect().left) / oldScale;
  const ratioY = (centerY - wrapper.getBoundingClientRect().top) / oldScale;

  scale = newScale;

  currentX -= (scale - oldScale) * ratioX;
  currentY -= (scale - oldScale) * ratioY;

  updateTransform();
}

function zoomIn() {
  zoomAtViewportCenter(0.1);
}

function zoomOut() {
  zoomAtViewportCenter(-0.1);
}

// Debug for map making --------------------------------------
viewport.addEventListener('click', (e) => {
  // Get the position of the click relative to the map
  const rect = wrapper.getBoundingClientRect();
  const x = (e.clientX - rect.left) / scale;
  const y = (e.clientY - rect.top) / scale;

  console.log(`Clicked coordinates: top: ${Math.round(y)}px; left: ${Math.round(x)}px`);
});