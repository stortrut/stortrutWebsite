const room = document.getElementById("room");
const world = document.getElementById("world");
const drawLayer = document.getElementById("draw-layer");


//Get elements from the html page
const uploadBackgroundButton =
  document.getElementById("upload-background");

const backgroundInput =
  document.getElementById("background-input");

const addRectangleButton =
  document.getElementById("add-rectangle");

  const mapGrid =
  document.getElementById("map-grid");

const backgroundColorInput =
  document.getElementById("background-color");

const rectangleMenu =
  document.getElementById("rectangle-menu");

const statusMessage =
  document.getElementById("status-message");

const brushColor =
  document.getElementById("brush-color");

const brushShape =
  document.getElementById("brush-shape");

const drawToolButton =
  document.getElementById("draw-tool");

const eraseToolButton =
  document.getElementById("erase-tool");

const clearDrawingsButton =
  document.getElementById("clear-drawings");








//Variables
const STORAGE_BUCKET = "battle-images";
const clientId = crypto.randomUUID();

const GRID_SIZE = 40;
const DEFAULT_IMAGE_SIZE = 80;
const DEFAULT_BACKGROUND_WIDTH = 320;
const DEFAULT_BACKGROUND_HEIGHT = 240;

const rectangles = new Map();
const drawings = new Map();

let cameraX = 0;
let cameraY = 0;
let zoom = 1;

let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let panCameraStartX = 0;
let panCameraStartY = 0;

let draggedRectangle = null;
let rectangleDragOffsetX = 0;
let rectangleDragOffsetY = 0;

let selectedRectangle = null;
let lastBroadcastTime = 0;
let layerCounter = 10;

let activeTool = null;
let activeDrawing = null;

let imageInsertMode = "background";

let mapBackgroundColor = backgroundColorInput?.value || "#cf9975";


const roomChannel = supabaseClient.channel("room:main", {
  config: {
    broadcast: {
      self: false
    }
  }
});

function isMenuOpen() {
  return document.body.classList.contains("menu-open");
}

function openMenu() {
  document.body.classList.add("menu-open");
}

function closeMenu() {
  document.body.classList.remove("menu-open");
  closeRectangleMenu();

  activeTool = null;
  updateToolButtons();
}

function updateToolButtons() {
  drawToolButton.classList.toggle(
    "selected",
    activeTool === "draw"
  );

  eraseToolButton.classList.toggle(
    "selected",
    activeTool === "erase"
  );

  room.classList.toggle(
    "drawing-mode",
    activeTool === "draw"
  );

  room.classList.toggle(
    "erasing-mode",
    activeTool === "erase"
  );
}

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);

  clearTimeout(showStatus.timeout);

  showStatus.timeout = setTimeout(() => {
    statusMessage.textContent = "";
    statusMessage.classList.remove("error");
  }, 3500);
}

function sendBroadcast(event, payload) {
  roomChannel.send({
    type: "broadcast",
    event,
    payload
  });
}

function updateCamera() {
  world.style.transform =
    `translate(${cameraX}px, ${cameraY}px) scale(${zoom})`;
}

function screenToWorld(screenX, screenY) {
  const bounds = room.getBoundingClientRect();

  return {
    x: (screenX - bounds.left - cameraX) / zoom,
    y: (screenY - bounds.top - cameraY) / zoom
  };
}

function getFileExtension(file) {
  const extension = file.name.split(".").pop();

  if (!extension || extension.length > 8) {
    return "jpg";
  }

  return extension
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function setImage(element, imageUrl) {
  let image = element.querySelector("img");

  if (!imageUrl) {
    if (image) {
      image.remove();
    }

    return;
  }

  if (!image) {
    image = document.createElement("img");
    image.alt = "Battle map image";
    element.appendChild(image);
  }

  image.src = imageUrl;
}

function setRectangleLayer(rectangleData) {
  if (rectangleData.type === "background") {
    rectangleData.layer = 1;
    rectangleData.element.style.zIndex = "1";
    return;
  }

  if (
    typeof rectangleData.layer !== "number" ||
    rectangleData.layer < 2
  ) {
    rectangleData.layer = ++layerCounter;
  }

  layerCounter = Math.max(
    layerCounter,
    rectangleData.layer
  );

  rectangleData.element.style.zIndex =
    String(rectangleData.layer);
}

function applyRectangleStyles(rectangleData) {
  const element = rectangleData.element;

  element.style.left = `${rectangleData.x}px`;
  element.style.top = `${rectangleData.y}px`;
  element.style.width = `${rectangleData.width}px`;
  element.style.height = `${rectangleData.height}px`;

  element.className =
    rectangleData.type === "background"
      ? "background-image-rectangle"
      : "shared-image";

  element.classList.toggle(
    "dimmed-object",
    rectangleData.dimmed === true
  );

  if (rectangleData.type !== "background") {
    element.style.backgroundColor =
      rectangleData.color || "#c0392b";
  }

  setImage(element, rectangleData.imageUrl);
  setRectangleLayer(rectangleData);
}

function bringRectangleToFront(rectangleData) {
  if (rectangleData.type === "background") {
    return;
  }

  rectangleData.layer = ++layerCounter;

  setRectangleLayer(rectangleData);

  sendBroadcast("rectangle_layer_changed", {
    id: rectangleData.id,
    layer: rectangleData.layer
  });
}

function normalizeRectangleData(rectangleData) {
  const isBackground =
    rectangleData.type === "background";

  return {
    id: rectangleData.id,
    x: rectangleData.x,
    y: rectangleData.y,

    width:
      typeof rectangleData.width === "number"
        ? rectangleData.width
        : isBackground
          ? DEFAULT_BACKGROUND_WIDTH
          : DEFAULT_IMAGE_SIZE,

    height:
      typeof rectangleData.height === "number"
        ? rectangleData.height
        : isBackground
          ? DEFAULT_BACKGROUND_HEIGHT
          : DEFAULT_IMAGE_SIZE,

    color: rectangleData.color || "#c0392b",
    imageUrl: rectangleData.imageUrl || null,
    type: isBackground ? "background" : "image",

    dimmed: rectangleData.dimmed === true,

    layer:
      typeof rectangleData.layer === "number"
        ? rectangleData.layer
        : isBackground
          ? 1
          : ++layerCounter,

    element: null
  };
}

function addRectangle(
  rectangleData,
  broadcast = false
) {
  if (
    !rectangleData ||
    typeof rectangleData.id !== "string" ||
    typeof rectangleData.x !== "number" ||
    typeof rectangleData.y !== "number"
  ) {
    return;
  }

  const existingRectangle =
    rectangles.get(rectangleData.id);

  if (existingRectangle) {
    const normalized =
      normalizeRectangleData(rectangleData);

    Object.assign(existingRectangle, normalized, {
      element: existingRectangle.element
    });

    applyRectangleStyles(existingRectangle);
    return;
  }

  const newRectangle =
    normalizeRectangleData(rectangleData);

  rectangles.set(newRectangle.id, newRectangle);
  createRectangleElement(newRectangle);

  if (broadcast) {
    sendBroadcast("rectangle_created", {
      id: newRectangle.id,
      x: newRectangle.x,
      y: newRectangle.y,
      width: newRectangle.width,
      height: newRectangle.height,
      color: newRectangle.color,
      imageUrl: newRectangle.imageUrl,
      type: newRectangle.type,
      layer: newRectangle.layer,
      dimmed: newRectangle.dimmed
    });
  }
}






function createRectangleElement(rectangleData) {
  const element = document.createElement("div");

  rectangleData.element = element;
  element.dataset.rectangleId = rectangleData.id;

  applyRectangleStyles(rectangleData);

  element.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    if (
      rectangleData.type === "background" &&
      !isMenuOpen()
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (rectangleData.type !== "background") {
      bringRectangleToFront(rectangleData);
    }

    draggedRectangle = rectangleData;

    const position = screenToWorld(
      event.clientX,
      event.clientY
    );

    rectangleDragOffsetX =
      position.x - rectangleData.x;

    rectangleDragOffsetY =
      position.y - rectangleData.y;

    element.setPointerCapture(event.pointerId);
  });

  element.addEventListener("pointermove", (event) => {
    if (
      !draggedRectangle ||
      draggedRectangle.id !== rectangleData.id
    ) {
      return;
    }

    const position = screenToWorld(
      event.clientX,
      event.clientY
    );

    rectangleData.x =
      position.x - rectangleDragOffsetX;

    rectangleData.y =
      position.y - rectangleDragOffsetY;

    element.style.left = `${rectangleData.x}px`;
    element.style.top = `${rectangleData.y}px`;

    broadcastRectangleMove();
  });

  element.addEventListener("pointerup", (event) => {
    if (
      draggedRectangle &&
      draggedRectangle.id === rectangleData.id
    ) {
      draggedRectangle = null;

      try {
        element.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture may already be released.
      }

      sendBroadcast("rectangle_moved", {
        id: rectangleData.id,
        x: rectangleData.x,
        y: rectangleData.y
      });
    }
  });

  element.addEventListener("pointercancel", () => {
    draggedRectangle = null;
  });

  element.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();

    openRectangleMenu(
      event.clientX,
      event.clientY,
      rectangleData
    );
  });

  world.appendChild(element);
}

function broadcastRectangleMove() {
  const now = Date.now();

  if (now - lastBroadcastTime < 30) {
    return;
  }

  lastBroadcastTime = now;

  if (!draggedRectangle) {
    return;
  }

  sendBroadcast("rectangle_moved", {
    id: draggedRectangle.id,
    x: draggedRectangle.x,
    y: draggedRectangle.y
  });
}

function openRectangleMenu(x, y, rectangleData) {
  selectedRectangle = rectangleData;

  rectangleMenu.style.left = `${x}px`;
  rectangleMenu.style.top = `${y}px`;
  rectangleMenu.classList.add("visible");
}

function closeRectangleMenu() {
  selectedRectangle = null;
  rectangleMenu.classList.remove("visible");
}

function resizeRectangle(width, height) {
  if (!selectedRectangle) {
    return;
  }

  selectedRectangle.width = width;
  selectedRectangle.height = height;

  applyRectangleStyles(selectedRectangle);

  sendBroadcast("rectangle_resized", {
    id: selectedRectangle.id,
    width,
    height
  });

  closeRectangleMenu();
}

function createRectangleAtScreenCenter() {
  imageInsertMode = "character";
  backgroundInput.click();
}

function createImageAtScreenCenter(imageUrl) {
  const bounds = room.getBoundingClientRect();

  const position = screenToWorld(
    bounds.left + bounds.width / 2,
    bounds.top + bounds.height / 2
  );

  addRectangle(
    {
      id: crypto.randomUUID(),
      x: position.x - DEFAULT_IMAGE_SIZE / 2,
      y: position.y - DEFAULT_IMAGE_SIZE / 2,
      width: DEFAULT_IMAGE_SIZE,
      height: DEFAULT_IMAGE_SIZE,
      imageUrl,
      type: "image",
      layer: ++layerCounter
    },
    true
  );
}


function deleteRectangle(rectangleData) {
  if (!rectangleData) {
    return;
  }

  rectangles.delete(rectangleData.id);

  if (rectangleData.element) {
    rectangleData.element.remove();
  }

  sendBroadcast("rectangle_deleted", {
    id: rectangleData.id
  });

  closeRectangleMenu();
}

function setRectangleDimmed(rectangleData, dimmed) {
  if (!rectangleData) {
    return;
  }

  rectangleData.dimmed = dimmed;
  applyRectangleStyles(rectangleData);

  sendBroadcast("rectangle_dimmed", {
    id: rectangleData.id,
    dimmed
  });

  closeRectangleMenu();
}



function createBackgroundAtScreenCenter(imageUrl) {
  const bounds = room.getBoundingClientRect();

  const position = screenToWorld(
    bounds.left + bounds.width / 2,
    bounds.top + bounds.height / 2
  );

  addRectangle(
    {
      id: crypto.randomUUID(),
      x: position.x - DEFAULT_BACKGROUND_WIDTH / 2,
      y: position.y - DEFAULT_BACKGROUND_HEIGHT / 2,
      width: DEFAULT_BACKGROUND_WIDTH,
      height: DEFAULT_BACKGROUND_HEIGHT,
      imageUrl,
      type: "background",
      layer: 1
    },
    true
  );
}

async function uploadImage(file, insertMode) {
  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    showStatus("Please select an image file.", true);
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showStatus("The image must be smaller than 10 MB.", true);
    return;
  }

  showStatus("Uploading image...");

  const extension = getFileExtension(file);
  const filePath =
    `${clientId}/${crypto.randomUUID()}.${extension}`;

  const { data, error } =
    await supabaseClient.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false
      });

  if (error) {
    console.error("Image upload failed:", error);
    showStatus("Image upload failed.", true);
    return;
  }

  const { data: publicUrlData } =
    supabaseClient.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

  if (!publicUrlData?.publicUrl) {
    showStatus("Could not create an image URL.", true);
    return;
  }

  if (insertMode === "character") {
    createImageAtScreenCenter(
      publicUrlData.publicUrl
    );

    showStatus("Character inserted.");
  } else {
    createBackgroundAtScreenCenter(
      publicUrlData.publicUrl
    );

    showStatus("Background inserted.");
  }
}

function createPathFromPoints(points) {
  if (!points.length) {
    return "";
  }

  return points
    .map((point, index) => {
      return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
    })
    .join(" ");
}

function renderDrawing(drawingData) {
  let path = document.querySelector(
    `[data-drawing-id="${drawingData.id}"]`
  );

  if (!path) {
    path = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );

    path.dataset.drawingId = drawingData.id;
    drawLayer.appendChild(path);
  }

  path.setAttribute(
    "d",
    createPathFromPoints(drawingData.points)
  );

  path.setAttribute("fill", "none");
  path.setAttribute(
    "stroke",
    drawingData.color || "#ffffff"
  );
  path.setAttribute(
    "stroke-width",
    drawingData.size || 5
  );

  path.setAttribute(
    "stroke-linecap",
    drawingData.shape === "square"
      ? "square"
      : "round"
  );

  path.setAttribute(
    "stroke-linejoin",
    drawingData.shape === "square"
      ? "miter"
      : "round"
  );
}




function isValidHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function setMapBackgroundColor(
  color,
  broadcast = true
) {
  if (!isValidHexColor(color)) {
    return;
  }

  mapBackgroundColor = color;
  mapGrid.style.backgroundColor = color;

  if (backgroundColorInput.value !== color) {
    backgroundColorInput.value = color;
  }

  if (broadcast) {
    sendBroadcast("background_color_changed", {
      color
    });
  }
}





function removeDrawing(drawingId, broadcast = true) {
  drawings.delete(drawingId);

  const path = document.querySelector(
    `[data-drawing-id="${drawingId}"]`
  );

  if (path) {
    path.remove();
  }

  if (broadcast) {
    sendBroadcast("drawing_removed", {
      id: drawingId
    });
  }
}

function distanceBetweenPoints(a, b) {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2)
  );
}

function findDrawingAtPosition(position) {
  const eraseDistance = 18 / zoom;

  for (const drawingData of drawings.values()) {
    for (const point of drawingData.points) {
      if (
        distanceBetweenPoints(point, position) <=
        eraseDistance
      ) {
        return drawingData;
      }
    }
  }

  return null;
}

function beginDrawing(event) {
  if (
    !isMenuOpen() ||
    !activeTool ||
    event.button !== 0
  ) {
    return false;
  }

  const position = screenToWorld(
    event.clientX,
    event.clientY
  );

  if (activeTool === "erase") {
    const drawing =
      findDrawingAtPosition(position);

    if (drawing) {
      removeDrawing(drawing.id);
    }

    return true;
  }

  activeDrawing = {
    id: crypto.randomUUID(),
    points: [position],
    color: brushColor.value,
    shape: brushShape.value,
    size: 5
  };

  drawings.set(
    activeDrawing.id,
    activeDrawing
  );

  renderDrawing(activeDrawing);

  return true;
}

function continueDrawing(event) {
  if (!activeDrawing) {
    return;
  }

  const position = screenToWorld(
    event.clientX,
    event.clientY
  );

  const previousPoint =
    activeDrawing.points[
      activeDrawing.points.length - 1
    ];

  if (
    distanceBetweenPoints(previousPoint, position) <
    2 / zoom
  ) {
    return;
  }

  activeDrawing.points.push(position);
  renderDrawing(activeDrawing);
}

function finishDrawing() {
  if (!activeDrawing) {
    return;
  }

  if (activeDrawing.points.length > 1) {
    sendBroadcast(
      "drawing_created",
      activeDrawing
    );
  } else {
    removeDrawing(activeDrawing.id, false);
  }

  activeDrawing = null;
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  event.preventDefault();

  if (isMenuOpen()) {
    closeMenu();
  } else {
    openMenu();
  }
});

uploadBackgroundButton.addEventListener("click", () => {
  imageInsertMode = "background";
  backgroundInput.click();
});


backgroundInput.addEventListener("change", async () => {
  await uploadImage(
    backgroundInput.files[0],
    imageInsertMode
  );

  backgroundInput.value = "";
});

addRectangleButton.addEventListener("click", () => {
  createRectangleAtScreenCenter();
});

drawToolButton.addEventListener("click", () => {
  activeTool =
    activeTool === "draw" ? null : "draw";

  updateToolButtons();
});


backgroundColorInput.addEventListener(
  "input",
  () => {
    setMapBackgroundColor(
      backgroundColorInput.value
    );
  }
);

eraseToolButton.addEventListener("click", () => {
  activeTool =
    activeTool === "erase" ? null : "erase";

  updateToolButtons();
});

clearDrawingsButton.addEventListener("click", () => {
  for (const drawing of drawings.values()) {
    removeDrawing(drawing.id);
  }

  showStatus("Drawings removed.");
});

rectangleMenu.addEventListener("click", (event) => {
  const actionButton =
    event.target.closest("[data-action]");

  if (actionButton) {
    const action =
      actionButton.dataset.action;

    if (action === "delete") {
      deleteRectangle(selectedRectangle);
      return;
    }

    if (action === "dim") {
      setRectangleDimmed(selectedRectangle, true);
      return;
    }

    if (action === "restore") {
      setRectangleDimmed(selectedRectangle, false);
      return;
    }
  }

  const sizeButton =
    event.target.closest("[data-width]");

  if (!sizeButton) {
    return;
  }

  resizeRectangle(
    Number(sizeButton.dataset.width),
    Number(sizeButton.dataset.height)
  );
});

document.addEventListener("pointerdown", (event) => {
  if (
    !event.target.closest("#rectangle-menu") &&
    !event.target.closest(".shared-image") &&
    !event.target.closest(".background-image-rectangle")
  ) {
    closeRectangleMenu();
  }
});

roomChannel.on(
  "broadcast",
  { event: "background_color_changed" },
  ({ payload }) => {
    if (!payload?.color) {
      return;
    }

    setMapBackgroundColor(
      payload.color,
      false
    );
  }
);



room.addEventListener("pointerdown", (event) => {
  if (beginDrawing(event)) {
    room.setPointerCapture(event.pointerId);
    return;
  }

  if (event.button !== 1) {
    return;
  }

  event.preventDefault();

  isPanning = true;
  room.classList.add("camera-dragging");

  panStartX = event.clientX;
  panStartY = event.clientY;
  panCameraStartX = cameraX;
  panCameraStartY = cameraY;

  room.setPointerCapture(event.pointerId);
});

room.addEventListener("pointermove", (event) => {
  if (activeDrawing) {
    continueDrawing(event);
    return;
  }

  if (!isPanning) {
    return;
  }

  cameraX =
    panCameraStartX + event.clientX - panStartX;

  cameraY =
    panCameraStartY + event.clientY - panStartY;

  updateCamera();
});

function stopPointerAction(event) {
  finishDrawing();

  if (isPanning) {
    isPanning = false;
    room.classList.remove("camera-dragging");
  }

  try {
    if (room.hasPointerCapture(event.pointerId)) {
      room.releasePointerCapture(event.pointerId);
    }
  } catch {
    // Pointer capture may already be released.
  }
}

room.addEventListener("pointerup", stopPointerAction);
room.addEventListener("pointercancel", stopPointerAction);

room.addEventListener("auxclick", (event) => {
  if (event.button === 1) {
    event.preventDefault();
  }
});

room.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

room.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();

    const zoomFactor =
      event.deltaY < 0 ? 1.1 : 0.9;

    const pointerBeforeZoom =
      screenToWorld(event.clientX, event.clientY);

    zoom = Math.max(
      0.25,
      Math.min(3, zoom * zoomFactor)
    );

    const bounds = room.getBoundingClientRect();

    cameraX =
      event.clientX -
      bounds.left -
      pointerBeforeZoom.x * zoom;

    cameraY =
      event.clientY -
      bounds.top -
      pointerBeforeZoom.y * zoom;

    updateCamera();
  },
  { passive: false }
);

roomChannel.on(
  "broadcast",
  { event: "rectangle_created" },
  ({ payload }) => {
    addRectangle(payload);
  }
);

roomChannel.on(
  "broadcast",
  { event: "rectangle_moved" },
  ({ payload }) => {
    const rectangleData =
      rectangles.get(payload?.id);

    if (!rectangleData) {
      return;
    }

    rectangleData.x = payload.x;
    rectangleData.y = payload.y;

    applyRectangleStyles(rectangleData);
  }
);

roomChannel.on(
  "broadcast",
  { event: "rectangle_resized" },
  ({ payload }) => {
    const rectangleData =
      rectangles.get(payload?.id);

    if (!rectangleData) {
      return;
    }

    rectangleData.width = payload.width;
    rectangleData.height = payload.height;

    applyRectangleStyles(rectangleData);
  }
);

roomChannel.on(
  "broadcast",
  { event: "rectangle_layer_changed" },
  ({ payload }) => {
    const rectangleData =
      rectangles.get(payload?.id);

    if (!rectangleData) {
      return;
    }

    rectangleData.layer = payload.layer;
    applyRectangleStyles(rectangleData);
  }
);

roomChannel.on(
  "broadcast",
  { event: "drawing_created" },
  ({ payload }) => {
    if (
      !payload ||
      typeof payload.id !== "string" ||
      !Array.isArray(payload.points)
    ) {
      return;
    }

    drawings.set(payload.id, payload);
    renderDrawing(payload);
  }
);

roomChannel.on(
  "broadcast",
  { event: "drawing_removed" },
  ({ payload }) => {
    if (payload?.id) {
      removeDrawing(payload.id, false);
    }
  }
);

roomChannel.on(
  "broadcast",
  { event: "request_rectangles" },
  ({ payload }) => {
    const requester = payload?.requester;

    if (
      typeof requester !== "string" ||
      requester === clientId
    ) {
      return;
    }

    sendBroadcast("rectangles_response", {
      requester,

      backgroundColor: mapBackgroundColor,

      rectangles: Array.from(
        rectangles.values()
      ).map((rectangleData) => ({
        id: rectangleData.id,
        x: rectangleData.x,
        y: rectangleData.y,
        width: rectangleData.width,
        height: rectangleData.height,
        color: rectangleData.color,
        imageUrl: rectangleData.imageUrl,
        type: rectangleData.type,
        layer: rectangleData.layer,
        dimmed: rectangleData.dimmed
      }))
    });

    sendBroadcast("drawings_response", {
      requester,
      drawings: Array.from(drawings.values())
    });
  }
);

roomChannel.on(
  "broadcast",
  { event: "rectangles_response" },
  ({ payload }) => {
    if (
      payload?.requester !== clientId ||
      !Array.isArray(payload.rectangles)
    ) {
      return;
    }

    if (payload.backgroundColor) {
      setMapBackgroundColor(
        payload.backgroundColor,
        false
      );
    }

    payload.rectangles.forEach((rectangleData) => {
      addRectangle(rectangleData);
    });
  }
);

roomChannel.on(
  "broadcast",
  { event: "drawings_response" },
  ({ payload }) => {
    if (
      payload?.requester !== clientId ||
      !Array.isArray(payload.drawings)
    ) {
      return;
    }

    payload.drawings.forEach((drawingData) => {
      drawings.set(drawingData.id, drawingData);
      renderDrawing(drawingData);
    });
  }
);




roomChannel.on(
  "broadcast",
  { event: "rectangle_deleted" },
  ({ payload }) => {
    const rectangleData =
      rectangles.get(payload?.id);

    if (!rectangleData) {
      return;
    }

    rectangles.delete(rectangleData.id);

    if (rectangleData.element) {
      rectangleData.element.remove();
    }

    closeRectangleMenu();
  }
);

roomChannel.on(
  "broadcast",
  { event: "rectangle_dimmed" },
  ({ payload }) => {
    const rectangleData =
      rectangles.get(payload?.id);

    if (!rectangleData) {
      return;
    }

    rectangleData.dimmed =
      payload.dimmed === true;

    applyRectangleStyles(rectangleData);
  }
);


roomChannel.subscribe(async (status) => {
  if (status !== "SUBSCRIBED") {
    console.error(
      "Supabase channel status:",
      status
    );

    showStatus(
      "Could not connect to the room.",
      true
    );

    return;
  }

  await roomChannel.send({
    type: "broadcast",
    event: "request_rectangles",
    payload: {
      requester: clientId
    }
  });

  showStatus(
    "Connected to the battle map."
  );
});

setMapBackgroundColor(
  mapBackgroundColor,
  false
);

updateToolButtons();
updateCamera();