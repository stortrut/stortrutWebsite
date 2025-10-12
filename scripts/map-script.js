const wrapper = document.getElementById('map-wrapper');
const viewport = document.getElementById('map-viewport');

let isDragging = false;
let startX, startY;
let currentX = 0, currentY = 0;

let scale = 1;
const minScale = 0.5;
const maxScale = 3;

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
  const mouseX = e.clientX;
  const mouseY = e.clientY;

  const rect = wrapper.getBoundingClientRect();

  const offsetX = mouseX - rect.left;
  const offsetY = mouseY - rect.top;

  const oldScale = scale;

  if (e.deltaY < 0) {
    scale = Math.min(scale + zoomFactor, maxScale);
  } else {
    scale = Math.max(scale - zoomFactor, minScale);
  }

  // Adjust pan to keep mouse position stable relative to zoom
  currentX -= offsetX * (scale - oldScale) / oldScale;
  currentY -= offsetY * (scale - oldScale) / oldScale;

  updateTransform();
}, { passive: false });

// CITY MARKER CLICK -------------

function cityClicked(cityName) {
  alert(`You clicked on ${cityName}`);
}

// For buttons
function zoomIn() {
  const fakeWheelEvent = { deltaY: -100, clientX: window.innerWidth/2, clientY: window.innerHeight/2 };
  viewport.dispatchEvent(new WheelEvent('wheel', fakeWheelEvent));
}

function zoomOut() {
  const fakeWheelEvent = { deltaY: 100, clientX: window.innerWidth/2, clientY: window.innerHeight/2 };
  viewport.dispatchEvent(new WheelEvent('wheel', fakeWheelEvent));
}