const clientId = crypto.randomUUID();

const videoControls =
  document.getElementById("video-controls");

const youtubeUrlInput =
  document.getElementById("youtube-url");

const loadVideoButton =
  document.getElementById("load-video");

const volumeSlider =
  document.getElementById("volume-slider");

const soundStatus =
  document.getElementById("sound-status");

  const pauseVideoButton =
  document.getElementById("pause-video");

let player = null;
let playerReady = false;

let currentVideoId = null;
let currentState = "paused";
let currentPosition = 0;
let lastStateTimestamp = 0;

let applyingRemoteState = false;
let controllerId = null;
let soundEnabled = false;

const roomChannel = supabaseClient.channel(
  "youtube-room:main",
  {
    config: {
      broadcast: {
        self: false,
        ack: true
      }
    }
  }
);

// --------------------------------------------------
// Sound status
// --------------------------------------------------

function updateSoundStatus(isEnabled) {
  soundEnabled = isEnabled;

  if (!soundStatus) {
    return;
  }

  if (isEnabled) {
    soundStatus.textContent =
      "🔊 Sound enabled";
    soundStatus.classList.remove("sound-muted");
    soundStatus.classList.add("sound-enabled");
  } else {
    soundStatus.textContent =
      "🔇 Muted - touch the volume bar to enable sound";
    soundStatus.classList.remove("sound-enabled");
    soundStatus.classList.add("sound-muted");
  }
}
function enableSound() {
  if (!playerReady || !player) {
    updateSoundStatus(false);
    return;
  }

  const volume = Number(volumeSlider.value);

  if (volume <= 0) {
    player.mute();
    updateSoundStatus(false);
    return;
  }

  /*
    Only change the sound state.
    Do not call playVideo() here, because the video may
    intentionally be paused for everyone.
  */
  player.unMute();
  player.setVolume(volume);

  updateSoundStatus(true);
}

updateSoundStatus(false);

volumeSlider.addEventListener("pointerdown", () => {
  enableSound();
});

volumeSlider.addEventListener("input", () => {
  enableSound();
});

// --------------------------------------------------
// Load YouTube IFrame API
// --------------------------------------------------

function createYouTubePlayer() {
  if (player) {
    return;
  }

  if (!window.YT || !window.YT.Player) {
    console.error("YouTube API is not ready yet.");
    return;
  }

  player = new YT.Player("youtube-player", {
    width: "1",
    height: "1",

    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      origin: window.location.origin,
      playsinline: 1,
      rel: 0
    },

    events: {
      onReady: handleYouTubeReady,
      onStateChange: handleYouTubeStateChange,
      onError: handleYouTubeError
    }
  });
}

window.onYouTubeIframeAPIReady = () => {
  createYouTubePlayer();
};

if (window.YT && window.YT.Player) {
  createYouTubePlayer();
} else {
  const youtubeScript =
    document.createElement("script");

  youtubeScript.src =
    "https://www.youtube.com/iframe_api";

  youtubeScript.async = true;
  document.head.appendChild(youtubeScript);
}

// --------------------------------------------------
// YouTube events
// --------------------------------------------------

function handleYouTubeReady() {
  playerReady = true;

  player.mute();
  player.setVolume(Number(volumeSlider.value));

  updateSoundStatus(false);

  console.log("YouTube player is ready.");

  requestCurrentVideo();
}

function handleYouTubeStateChange(event) {
  if (!playerReady || applyingRemoteState) {
    return;
  }

  if (controllerId !== clientId) {
    return;
  }

  if (event.data === YT.PlayerState.PLAYING) {
    broadcastPlaybackState("playing");
  }

  if (event.data === YT.PlayerState.PAUSED) {
    broadcastPlaybackState("paused");
  }

  if (event.data === YT.PlayerState.ENDED) {
    player.seekTo(0, true);
    player.playVideo();
    broadcastPlaybackState("playing");
  }
}

function handleYouTubeError(event) {
  const errorMessages = {
    2: "The YouTube video ID is invalid.",
    5: "The video cannot be played in this HTML5 player.",
    100: "This video was removed or made private.",
    101: "The video owner does not allow embedded playback.",
    150: "The video owner does not allow embedded playback."
  };

  const message =
    errorMessages[event.data] ||
    `YouTube could not play this video. Error ${event.data}.`;

  console.error("YouTube player error:", event.data);
  alert(message);

  currentVideoId = null;
  currentPosition = 0;
  currentState = "paused";

  if (
    player &&
    typeof player.stopVideo === "function"
  ) {
    player.stopVideo();
  }
}

// --------------------------------------------------
// Escape key
// --------------------------------------------------

window.addEventListener(
  "keydown",
  (event) => {
    if (event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (videoControls) {
      videoControls.hidden = false;
      videoControls.style.display = "flex";
    }

    if (youtubeUrlInput) {
      youtubeUrlInput.focus();
    }
  },
  true
);

// --------------------------------------------------
// YouTube URL handling
// --------------------------------------------------

function getYouTubeVideoId(value) {
  try {
    const url = new URL(value.trim());

    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1).split("/")[0];
    }

    if (
      url.hostname.includes("youtube.com") &&
      url.searchParams.get("v")
    ) {
      return url.searchParams.get("v");
    }

    if (
      url.hostname.includes("youtube.com") &&
      url.pathname.startsWith("/embed/")
    ) {
      return url.pathname
        .split("/embed/")[1]
        .split("/")[0];
    }

    return null;
  } catch {
    return null;
  }
}

// --------------------------------------------------
// Local video loading
// --------------------------------------------------

function loadVideo(
  videoId,
  startSeconds = 0,
  shouldPlay = true
) {
  if (!videoId) {
    alert("No YouTube video ID found.");
    return false;
  }

  if (!player || !playerReady) {
    alert(
      "The YouTube player is still loading. Try again in a moment."
    );
    return false;
  }

  currentVideoId = videoId;
  currentPosition = startSeconds;
  currentState = shouldPlay ? "playing" : "paused";
  lastStateTimestamp = Date.now();

  player.loadVideoById({
    videoId,
    startSeconds
  });

  if (shouldPlay) {
    player.playVideo();
  } else {
    player.pauseVideo();
  }

  return true;
}

// --------------------------------------------------
// Load video button
// --------------------------------------------------

loadVideoButton.addEventListener(
  "click",
  (event) => {
    event.preventDefault();

    const inputValue =
      youtubeUrlInput.value.trim();

    const videoId =
      getYouTubeVideoId(inputValue);

    if (!videoId) {
      alert("Please paste a valid YouTube URL.");
      return;
    }

    const loaded =
      loadVideo(videoId, 0, true);

    if (!loaded) {
      return;
    }

    controllerId = clientId;

    sendBroadcast("video_changed", {
      controllerId,
      videoId,
      position: 0,
      state: "playing",
      timestamp: Date.now()
    });

    youtubeUrlInput.value = "";
  }
);

pauseVideoButton.addEventListener(
  "click",
  (event) => {
    event.preventDefault();

    if (!playerReady || !player || !currentVideoId) {
      alert("There is no video currently playing.");
      return;
    }

    /*
      The person who clicks pause becomes the controller,
      so the pause command is applied to everyone.
    */
    controllerId = clientId;

    player.pauseVideo();

    currentState = "paused";
    currentPosition = player.getCurrentTime();
    lastStateTimestamp = Date.now();

    sendBroadcast("playback_state", {
      controllerId,
      videoId: currentVideoId,
      position: currentPosition,
      state: "paused",
      timestamp: lastStateTimestamp
    });
  }
);

// --------------------------------------------------
// Supabase Broadcast helpers
// --------------------------------------------------

function sendBroadcast(event, payload) {
  roomChannel.send({
    type: "broadcast",
    event,
    payload
  });
}

function broadcastPlaybackState(state) {
  if (
    !playerReady ||
    !currentVideoId ||
    controllerId !== clientId
  ) {
    return;
  }

  const position =
    player.getCurrentTime();

  currentState = state;
  currentPosition = position;
  lastStateTimestamp = Date.now();

  sendBroadcast("playback_state", {
    controllerId,
    videoId: currentVideoId,
    position,
    state,
    timestamp: Date.now()
  });
}

// --------------------------------------------------
// Periodic synchronization
// --------------------------------------------------

setInterval(() => {
  if (
    !playerReady ||
    !currentVideoId ||
    controllerId !== clientId ||
    player.getPlayerState() !== YT.PlayerState.PLAYING
  ) {
    return;
  }

  broadcastPlaybackState("playing");
}, 2000);

// --------------------------------------------------
// Apply remote playback state
// --------------------------------------------------

function applyPlaybackState(payload) {
  if (
    !playerReady ||
    !payload ||
    !payload.videoId
  ) {
    return;
  }

  controllerId =
    payload.controllerId || null;

  const networkDelay =
    (Date.now() - payload.timestamp) / 1000;

  let targetPosition =
    Number(payload.position) || 0;

  if (payload.state === "playing") {
    targetPosition += Math.max(0, networkDelay);
  }

  applyingRemoteState = true;

  if (currentVideoId !== payload.videoId) {
    currentVideoId = payload.videoId;

    player.loadVideoById({
      videoId: payload.videoId,
      startSeconds: targetPosition
    });
  } else {
    const localPosition =
      player.getCurrentTime();

    const drift =
      Math.abs(localPosition - targetPosition);

    if (drift > 0.5) {
      player.seekTo(targetPosition, true);
    }
  }

  if (payload.state === "playing") {
    player.playVideo();
  } else {
    player.pauseVideo();
  }

  currentState = payload.state;
  currentPosition = targetPosition;
  lastStateTimestamp = payload.timestamp;

  setTimeout(() => {
    applyingRemoteState = false;
  }, 1000);
}

// --------------------------------------------------
// Request current state
// --------------------------------------------------

function requestCurrentVideo() {
  sendBroadcast("request_video_state", {
    requesterId: clientId
  });
}

// --------------------------------------------------
// Realtime listeners
// --------------------------------------------------

roomChannel.on(
  "broadcast",
  { event: "video_changed" },
  ({ payload }) => {
    if (!payload) {
      return;
    }

    controllerId =
      payload.controllerId || null;

    applyPlaybackState(payload);
  }
);

roomChannel.on(
  "broadcast",
  { event: "playback_state" },
  ({ payload }) => {
    if (!payload) {
      return;
    }

    if (payload.controllerId === clientId) {
      return;
    }

    applyPlaybackState(payload);
  }
);

roomChannel.on(
  "broadcast",
  { event: "request_video_state" },
  ({ payload }) => {
    if (
      !payload ||
      payload.requesterId === clientId ||
      controllerId !== clientId ||
      !currentVideoId ||
      !playerReady
    ) {
      return;
    }

    sendBroadcast("video_state_response", {
      requesterId: payload.requesterId,
      controllerId,
      videoId: currentVideoId,
      position: player.getCurrentTime(),
      state:
        player.getPlayerState() === YT.PlayerState.PLAYING
          ? "playing"
          : "paused",
      timestamp: Date.now()
    });
  }
);

roomChannel.on(
  "broadcast",
  { event: "video_state_response" },
  ({ payload }) => {
    if (
      !payload ||
      payload.requesterId !== clientId
    ) {
      return;
    }

    applyPlaybackState(payload);
  }
);

// --------------------------------------------------
// Connect to Realtime
// --------------------------------------------------

roomChannel.subscribe((status, error) => {
  if (status === "SUBSCRIBED") {
    requestCurrentVideo();
    return;
  }

  if (error) {
    console.error(
      "Realtime connection error:",
      error
    );
  }
});