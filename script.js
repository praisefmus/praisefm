// ===============================
// CONFIGURAÇÕES PRINCIPAIS
// ===============================
const STREAM_URL = "https://stream.zeno.fm/hvwifp8ezc6tv";
const NOWPLAYING_API = "https://api.zeno.fm/mounts/metadata/subscribe/hvwifp8ezc6tv";
const STREAM_LOGO_URL = "https://raw.githubusercontent.com/praisefmus/praisefm/main/image/logopraisefm.webp";

// Elementos
const audio = document.getElementById("radioPlayer");
const playBtn = document.getElementById("playBtn");
const volumeSlider = document.getElementById("volumeSlider");
const currentTitleEl = document.getElementById("currentTitle");
const currentDateEl = document.getElementById("currentDate");
const coverImg = document.getElementById("coverImg");
const statusText = document.getElementById("status");
const historyList = document.getElementById("historyList");
const favoriteBtn = document.getElementById("favoriteBtn");

let currentSong = "";
let currentArtist = "";
let retryCount = 0;
const MAX_RETRIES = 5;

// ===============================
// HORÁRIO DE CHICAGO EM TEMPO REAL
// ===============================
function updateChicagoTime() {
  const now = new Date();
  const chicagoTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Chicago"
  });
  document.getElementById("currentTime").textContent = chicagoTime;
}
setInterval(updateChicagoTime, 30000);
updateChicagoTime();

// ===============================
// PLAYER PLAY/PAUSE
// ===============================
playBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.src = STREAM_URL + "?nocache=" + Date.now();
    audio.play().then(() => {
      playBtn.textContent = "⏸ Pause";
      playBtn.setAttribute("aria-pressed", "true");
    }).catch(err => {
      console.error("Play error:", err);
      statusText.textContent = "Error loading audio.";
    });
  } else {
    audio.pause();
    playBtn.textContent = "▶ Play";
    playBtn.setAttribute("aria-pressed", "false");
  }
});

audio.addEventListener("playing", () => {
  statusText.textContent = "LIVE • Audio Connected";
});

// ===============================
// VOLUME
// ===============================
volumeSlider.addEventListener("input", e => {
  audio.volume = e.target.value;
});

// ===============================
// DETECTA COMERCIAIS / VINHETAS
// ===============================
function isCommercial(title) {
  const keywords = ["spot", "ad", "advert", "commercial", "promo"];
  return keywords.some(k => title.toLowerCase().includes(k));
}

// ===============================
// CAPA — VALIDAÇÃO
// ===============================
function isInvalidCover(url) {
  return fetch(url, { method: "HEAD" })
    .then(res => !res.ok)
    .catch(() => true);
}

// ===============================
// BUSCA CAPA NA LASTFM
// ===============================
async function fetchCoverArt(artist, song) {
  const apiKey = "7744c8f90ee053fc761e3b7a8dfe88b1";
  const endpoint = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${apiKey}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(song)}&format=json`;

  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    if (data?.track?.album?.image?.length) {
      const img = data.track.album.image.pop()["#text"];
      return img || STREAM_LOGO_URL;
    }
  } catch (err) {
    console.warn("LastFM Error:", err);
  }

  return STREAM_LOGO_URL;
}

// ===============================
// ALTERA EXIBIÇÃO DA CAPA
// ===============================
function toggleCoverDisplay(show, src) {
  coverImg.style.opacity = show ? "1" : "0";
  coverImg.src = src || STREAM_LOGO_URL;
}

// ===============================
// ADICIONA AO HISTÓRICO
// ===============================
function addToHistory(song, artist, cover) {
  const li = document.createElement("li");
  li.className = "history-item";

  li.innerHTML = `
    <div class="history-img"><img src="${cover}" /></div>
    <div class="history-text">
      <div class="history-title-item">${song}</div>
      <div class="history-artist">${artist}</div>
    </div>
  `;

  if (historyList.firstChild) {
    historyList.insertBefore(li, historyList.firstChild);
  } else {
    historyList.appendChild(li);
  }
}

// ===============================
// FAVORITOS
// ===============================
function updateFavoriteButton() {
  const key = `${currentArtist} - ${currentSong}`;
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  favoriteBtn.classList.toggle("favorited", favs.includes(key));
}

favoriteBtn.addEventListener("click", () => {
  const key = `${currentArtist} - ${currentSong}`;
  let favs = JSON.parse(localStorage.getItem("favorites") || "[]");

  if (favs.includes(key)) {
    favs = favs.filter(f => f !== key);
  } else {
    favs.push(key);
  }

  localStorage.setItem("favorites", JSON.stringify(favs));
  updateFavoriteButton();
});

// ===============================
// NOW PLAYING — LÊ METADADOS DO ZENO
// ===============================
function setupNowPlaying() {
  const eventSource = new EventSource(NOWPLAYING_API);

  eventSource.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      let title = (data.streamTitle || "").trim();

      title = title.replace(/[^\p{L}\p{N}\-.,!?& ]+/gu, "").replace(/\s+/g, " ").trim();

      // Ignora comerciais e jingles
      const isSpot = isCommercial(title) || title.length < 3;
      const isJingle = title.toLowerCase().includes("praise fm");

      if (isSpot || isJingle) {
        currentSong = "";
        currentArtist = "Praise FM U.S.";
        currentTitleEl.textContent = "Praise FM U.S.";
        toggleCoverDisplay(false, STREAM_LOGO_URL);
        statusText.textContent = "LIVE • Praise FM U.S.";
        updateFavoriteButton();
        return;
      }

      // Música normal
      const parts = title.split(" - ").filter(Boolean);
      currentArtist = parts[0] || "Praise FM U.S.";
      currentSong = parts.slice(1).join(" - ") || title;

      currentTitleEl.textContent = `${currentArtist} - ${currentSong}`;

      // Capa
      const coverUrl = await fetchCoverArt(currentArtist, currentSong);
      const invalid = await isInvalidCover(coverUrl);
      const finalCover = invalid ? STREAM_LOGO_URL : coverUrl;

      toggleCoverDisplay(true, finalCover);
      addToHistory(currentSong, currentArtist, finalCover);

      statusText.textContent = `LIVE • Now Playing: ${currentArtist} - ${currentSong}`;
      updateFavoriteButton();

    } catch (err) {
      console.warn("Metadata parse error:", err);
    }
  };

  eventSource.onerror = () => {
    console.warn("EventSource error");
    eventSource.close();
    retryCount++;

    if (retryCount < MAX_RETRIES) {
      statusText.textContent = "Reconnecting...";
      setTimeout(setupNowPlaying, 5000);
    } else {
      statusText.textContent = "Connection lost. Refresh.";
    }
  };
}

setupNowPlaying();
