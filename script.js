// CONFIG
const STREAM_URL = "https://stream.zeno.fm/hvwifp8ezc6tv";
const NOWPLAYING_API = "https://api.zeno.fm/mounts/metadata/subscribe/hvwifp8ezc6tv";
const STREAM_LOGO = "/image/logopraisefm.webp";

// DOM
const audio = document.getElementById("radioPlayer");
const playBtn = document.getElementById("playBtn");
const coverImg = document.getElementById("coverImg");
const volumeSlider = document.getElementById("volumeSlider");
const currentTitleEl = document.getElementById("currentTitle");
const statusEl = document.getElementById("status");
const historyList = document.getElementById("historyList");
const currentTimeEl = document.getElementById("currentTime");
const progressBar = document.getElementById("progressBar");
const favoriteBtn = document.getElementById("favoriteBtn");

let currentArtist = "";
let currentSong = "";
let retryCount = 0;
const MAX_RETRIES = 6;
const recentSet = new Set();

// Initialize audio
audio.src = STREAM_URL;
audio.preload = "auto";
audio.volume = parseFloat(volumeSlider.value || 0.7);

// Chicago time
function updateChicagoTime() {
  const now = new Date();
  const chicago = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "America/Chicago" });
  currentTimeEl.textContent = chicago;
}
updateChicagoTime();
setInterval(updateChicagoTime, 30000);

// Play / Pause toggle
playBtn.addEventListener("click", () => {
  if (audio.paused) {
    playStream();
  } else {
    audio.pause();
    setPlayButton(false);
  }
});

function playStream(){
  audio.src = STREAM_URL + "?_=" + Date.now();
  audio.play().then(() => setPlayButton(true)).catch(err => {
    console.error("Play error:", err);
    statusEl.textContent = "Unable to play stream";
  });
}

function setPlayButton(playing){
  const svgPath = document.querySelector("#playIcon path");
  if (playing) {
    playBtn.setAttribute("aria-pressed", "true");
    // change icon to pause visually
    playBtn.innerHTML = '⏸';
  } else {
    playBtn.setAttribute("aria-pressed", "false");
    playBtn.innerHTML = '<svg id="playIcon" viewBox="0 0 64 64" width="28" height="28" fill="none"><path d="M22 18v28l20-14L22 18z" fill="#000"></path></svg>';
  }
}

// Volume
volumeSlider.addEventListener("input", (e) => {
  audio.volume = e.target.value;
});

// Helpers
function isCommercialText(t){
  if (!t) return true;
  const s = t.toLowerCase();
  return s.includes("commercial") || s.includes("spot") || s.includes("ad") || s.includes("break");
}

function safeText(t){
  try {
    return t.replace(/[^\p{L}\p{N}\-.,!?&'’ ]+/gu, ' ').replace(/\s+/g,' ').trim();
  } catch {
    return t || "";
  }
}

// Avoid duplicates and add to history
function addToHistory(artist, song, cover){
  const key = `${artist} - ${song}`;
  if (!song || isCommercialText(key)) return;
  if (recentSet.has(key)) return;
  recentSet.add(key);

  // cap max history to 30
  if (recentSet.size > 30) {
    const first = historyList.lastElementChild;
    if (first) {
      const txt = first.querySelector('.history-title')?.textContent || '';
      recentSet.delete(txt);
      historyList.removeChild(first);
    }
  }

  const li = document.createElement("li");
  li.className = "history-item";
  li.innerHTML = `
    <div class="history-thumb"><img src="${cover || STREAM_LOGO}" alt="${song}"></div>
    <div class="history-meta">
      <div class="history-title">${artist} - ${song}</div>
      <div class="history-sub">${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
    </div>
  `;
  historyList.prepend(li);
}

// LastFM cover fetch (best effort)
async function fetchCover(artist, song){
  try {
    const apiKey = "7744c8f90ee053fc761e6a2f7e45f409";
    const endpoint = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${apiKey}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(song)}&format=json`;
    const res = await fetch(endpoint);
    const json = await res.json();
    const img = json?.track?.album?.image?.pop()?.["#text"];
    return img || STREAM_LOGO;
  } catch {
    return STREAM_LOGO;
  }
}

// Check if cover reachable
async function isCoverValid(url){
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

// NowPlaying setup via EventSource
function setupNowPlaying(){
  const es = new EventSource(NOWPLAYING_API);

  es.onmessage = async (e) => {
    retryCount = 0;
    try {
      const data = JSON.parse(e.data);
      let streamTitle = safeText(data.streamTitle || "");

      if (!streamTitle || isCommercialText(streamTitle) || streamTitle.toLowerCase().includes('praise fm')) {
        // show station name and keep radio art
        currentArtist = "Praise FM U.S.";
        currentSong = "";
        currentTitleEl.textContent = "Praise FM U.S.";
        coverImg.src = STREAM_LOGO;
        statusEl.textContent = "LIVE • Praise FM U.S.";
        return;
      }

      // handle "Commercial Break - Commercial Break" specifically
      if (streamTitle.toLowerCase().includes("commercial break")) {
        currentArtist = "Commercial Break";
        currentSong = "";
        currentTitleEl.textContent = "Commercial Break";
        coverImg.src = STREAM_LOGO;
        statusEl.textContent = "LIVE • Commercial Break";
        return;
      }

      // parse "Artist - Title" or fallback
      const parts = streamTitle.split(" - ").map(p => p.trim()).filter(Boolean);
      let artist = parts[0] || "Unknown";
      let song = parts.slice(1).join(" - ") || parts[0] || streamTitle;

      // avoid ads/jingles
      if (isCommercialText(artist) || isCommercialText(song)) {
        return;
      }

      // if same as currently shown, ignore
      if (artist === currentArtist && song === currentSong) return;

      currentArtist = artist;
      currentSong = song;
      currentTitleEl.textContent = `${artist} — ${song}`;
      statusEl.textContent = `LIVE • Now Playing`;

      // fetch cover art
      const coverUrl = await fetchCover(artist, song);
      const valid = await isCoverValid(coverUrl);
      coverImg.src = valid ? coverUrl : STREAM_LOGO;

      // animate a short progress to indicate new track (visual only)
      progressBar.style.width = "0%";
      setTimeout(()=> progressBar.style.width = "30%", 120);
      setTimeout(()=> progressBar.style.width = "60%", 700);

      // add to history if unique
      addToHistory(artist, song, valid ? coverUrl : STREAM_LOGO);

    } catch (err) {
      console.warn("NowPlaying parse error:", err);
    }
  };

  es.onerror = () => {
    retryCount++;
    statusEl.textContent = "Connection lost — reconnecting…";
    es.close();
    if (retryCount < MAX_RETRIES) {
      setTimeout(setupNowPlaying, 5000);
    } else {
      statusEl.textContent = "Connection failed. Please refresh.";
    }
  };
}

setupNowPlaying();
