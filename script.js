const STREAM_URL = "https://stream.zeno.fm/hvwifp8ezc6tv";
const NOWPLAYING_API = "https://api.zeno.fm/mounts/metadata/subscribe/hvwifp8ezc6tv";
const STREAM_LOGO_URL = "image/logopraisefm.webp";

const audio = document.getElementById("radioPlayer");
const playBtn = document.getElementById("playBtn");
const volumeSlider = document.getElementById("volumeSlider");
const currentTitleEl = document.getElementById("currentTitle");
const currentTimeEl = document.getElementById("currentTime");
const statusText = document.getElementById("status");
const coverImg = document.getElementById("coverImg");
const historyList = document.getElementById("historyList");
const favoriteBtn = document.getElementById("favoriteBtn");

let retryCount = 0;
const MAX_RETRIES = 5;

let currentSong = "";
let currentArtist = "";

// Atualiza horário de Chicago
function updateChicagoTime() {
  const now = new Date();
  const chicago = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Chicago"
  });
  currentTimeEl.textContent = chicago;
}
setInterval(updateChicagoTime, 30000);
updateChicagoTime();

// Play / Pause
playBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.src = STREAM_URL + "?t=" + Date.now();
    audio.play().then(() => {
      playBtn.textContent = "❚❚ Pause";
      playBtn.setAttribute("aria-pressed", "true");
    }).catch(err => {
      console.error("Error playing:", err);
      statusText.textContent = "Error playing stream";
    });
  } else {
    audio.pause();
    playBtn.textContent = "▶ Play";
    playBtn.setAttribute("aria-pressed", "false");
  }
});

// Volume
volumeSlider.addEventListener("input", (e) => {
  audio.volume = e.target.value;
});

// Verifica se a capa é inválida (404)
async function isInvalidCover(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return !res.ok;
  } catch {
    return true;
  }
}

// Busca capa no LastFM
async function fetchCoverArt(artist, song) {
  const apiKey = "7744c8f90ee053fc761e3b7a8dfe88b1"; // troque se tiver outro
  const endpoint = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(song)}&api_key=${apiKey}&format=json`;
  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    const img = data?.track?.album?.image?.pop()?.["#text"];
    return img || STREAM_LOGO_URL;
  } catch {
    return STREAM_LOGO_URL;
  }
}

// Adiciona no histórico (evita duplicatas)
function addToHistory(song, artist, cover) {
  const newKey = `${artist} - ${song}`;
  if (historyList.firstChild) {
    const firstText = historyList.firstChild.querySelector(".history-title-item")?.textContent;
    if (firstText === newKey) {
      return;
    }
  }

  const li = document.createElement("li");
  li.className = "history-item";
  li.innerHTML = `
    <div class="history-img"><img src="${cover}" alt="${song}" /></div>
    <div class="history-text">
      <div class="history-title-item">${artist} - ${song}</div>
    </div>
  `;
  historyList.prepend(li);
}

// Favoritos
function updateFavoriteButton() {
  const key = `${currentArtist} - ${currentSong}`;
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  favoriteBtn.classList.toggle("favorited", favs.includes(key));
}
favoriteBtn.addEventListener("click", () => {
  const key = `${currentArtist} - ${currentSong}`;
  let favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  if (favs.includes(key)) {
    favs = favs.filter(item => item !== key);
  } else {
    favs.push(key);
  }
  localStorage.setItem("favorites", JSON.stringify(favs));
  updateFavoriteButton();
});

// Pega metadados do Zeno
function setupNowPlaying() {
  const eventSource = new EventSource(NOWPLAYING_API);
  eventSource.onmessage = async (event) => {
    retryCount = 0;
    try {
      const data = JSON.parse(event.data);
      let streamTitle = (data.streamTitle || "").trim();
      streamTitle = streamTitle.replace(/[^\p{L}\p{N}\-.,!?& ]+/gu, "").replace(/\s+/g, " ").trim();

      // se for commercial break
      if (streamTitle.toLowerCase().includes("commercial break")) {
        currentArtist = "Commercial Break";
        currentSong = "";
        currentTitleEl.textContent = "Commercial Break";
        statusText.textContent = "LIVE • Commercial Break";
        coverImg.src = STREAM_LOGO_URL;
        return;
      }

      // se for jingle ou vazio
      if (!streamTitle || streamTitle.toLowerCase().includes("praise fm")) {
        currentArtist = "Praise FM U.S.";
        currentSong = "";
        currentTitleEl.textContent = "Praise FM U.S.";
        statusText.textContent = "LIVE • Praise FM U.S.";
        coverImg.src = STREAM_LOGO_URL;
        return;
      }

      // música normal
      const parts = streamTitle.split(" - ").map(p => p.trim()).filter(Boolean);
      const artist = parts[0];
      const song = parts.slice(1).join(" - ") || parts[0];
      currentArtist = artist;
      currentSong = song;

      currentTitleEl.textContent = `${artist} - ${song}`;
      statusText.textContent = `LIVE • Now Playing`;

      const coverUrl = await fetchCoverArt(artist, song);
      const invalid = await isInvalidCover(coverUrl);
      coverImg.src = invalid ? STREAM_LOGO_URL : coverUrl;

      addToHistory(song, artist, coverUrl);
      updateFavoriteButton();

    } catch (err) {
      console.warn("Erro no metadata:", err);
    }
  };

  eventSource.onerror = () => {
    retryCount++;
    statusText.textContent = "Reconnecting...";
    eventSource.close();
    if (retryCount < MAX_RETRIES) {
      setTimeout(setupNowPlaying, 5000);
    } else {
      statusText.textContent = "Connection failed.";
    }
  };
}
setupNowPlaying();
