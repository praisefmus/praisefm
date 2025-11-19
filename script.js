/* ====== CONFIG ====== */
const STREAM_URL = "https://stream.zeno.fm/hvwifp8ezc6tv";
const NOWPLAYING_API = "https://api.zeno.fm/mounts/metadata/subscribe/hvwifp8ezc6tv";
const STREAM_LOGO = "/image/logopraisefm.webp";
const LASTFM_API_KEY = "7744c8f90ee053fc761e0e23bfa00b89"; // sua API

/* ====== DOM ====== */
const audio = document.getElementById("radioPlayer");
const playBtn = document.getElementById("playBtn");
const coverMain = document.getElementById("coverMain");
const bg = document.getElementById("bg");
const currentTitleEl = document.getElementById("currentTitle");
const currentArtistEl = document.getElementById("currentArtist");
const statusEl = document.getElementById("status"); // (not visible in UI but kept)
const historyList = document.getElementById("historyList");
const volumeSlider = document.getElementById("volumeSlider");
const progressFill = document.getElementById("progressFill");
const timeLeftEl = document.getElementById("timeLeft");
const timeRightEl = document.getElementById("timeRight");

/* internal state */
let currentArtist = "";
let currentSong = "";
let recentSet = new Set();

/* ====== TIME (Chicago) ====== */
const currentTimeLabel = document.getElementById("timeRight");
function updateChicagoTime(){
  const now = new Date();
  currentTimeLabel.textContent = now.toLocaleTimeString("en-US",{ hour: "2-digit", minute: "2-digit", timeZone: "America/Chicago" });
}
updateChicagoTime();
setInterval(updateChicagoTime, 30000);

/* ====== PLAY / PAUSE ====== */
playBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.src = STREAM_URL + "?_=" + Date.now();
    audio.play().catch(()=>{ /* autoplay blocked */ });
    playBtn.textContent = "⏸";
  } else {
    audio.pause();
    playBtn.textContent = "▶";
  }
});

/* volume */
audio.volume = Number(volumeSlider.value);
volumeSlider.addEventListener("input", () => audio.volume = Number(volumeSlider.value));

/* progress (fake—stream has no duration). We'll show a pulsing indicator instead */
function setProgressPulse(pct){
  progressFill.style.width = `${pct}%`;
}

/* ====== HISTORY UI ====== */
function addToHistory(artist, song, cover) {
  const key = `${artist} - ${song}`;
  if (recentSet.has(key)) return;
  recentSet.add(key);

  const li = document.createElement("li");
  li.className = "history-item";

  li.innerHTML = `
    <img src="${cover}" class="history-img" alt="${song}">
    <div class="history-text">
      <div class="history-title">${artist} — ${song}</div>
      <div class="history-time">${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
    </div>
  `;

  historyList.prepend(li);

  // remove overflow older than 40 items to keep list light
  if (historyList.children.length > 40) historyList.removeChild(historyList.lastChild);
}

/* ====== LAST.FM COVER FETCH (with robust checks) ====== */
async function fetchCover(artist, song) {
  try {
    if (!artist && !song) return STREAM_LOGO;

    const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(song)}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return STREAM_LOGO;
    const json = await res.json();

    // try different locations for album image
    let img = json?.track?.album?.image?.pop()?.["#text"] || json?.track?.album?.image?.slice(-1)?.[0]?.["#text"] || null;

    // Some responses return empty string; check length and http scheme
    if (!img || typeof img !== "string" || img.trim() === "") return STREAM_LOGO;
    if (img.startsWith("//")) img = "https:" + img;
    return img;
  } catch (err) {
    return STREAM_LOGO;
  }
}

/* ====== Dominant color extraction (for accent). Best-effort; falls back to CSS var. ====== */
function extractColorFromImage(imgEl){
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imgEl.src || imgEl.getAttribute('src');

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const w = Math.min(200, img.width);
          const h = Math.min(200, img.height);
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);
          const data = ctx.getImageData(0,0,w,h).data;
          const count = {};
          for (let i=0;i<data.length;i+=4){
            const r = data[i], g=data[i+1], b=data[i+2];
            // ignore near-white and near-black pixels for better accent
            if (r>240 && g>240 && b>240) continue;
            if (r<12 && g<12 && b<12) continue;
            const key = `${Math.round(r/8)*8},${Math.round(g/8)*8},${Math.round(b/8)*8}`;
            count[key] = (count[key]||0) + 1;
          }
          let top = null, topCount = 0;
          for (const k in count){
            if (count[k] > topCount){ top = k; topCount = count[k]; }
          }
          if (!top) return resolve(null);
          const parts = top.split(",").map(Number);
          resolve(`rgb(${parts[0]},${parts[1]},${parts[2]})`);
        } catch (e){
          resolve(null);
        }
      };

      img.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

async function applyAccentFromImage(url){
  try {
    // set background blur
    bg.style.backgroundImage = `url("${url}")`;

    // try to extract color
    const tmp = document.createElement('img');
    tmp.crossOrigin = "anonymous";
    tmp.src = url;
    await new Promise((r)=>{ tmp.onload=r; tmp.onerror=r; });

    const color = await extractColorFromImage(tmp);
    if (color) {
      // compute accent as slightly brightened color
      document.documentElement.style.setProperty('--accent', color);
    } else {
      // fallback accent
      document.documentElement.style.setProperty('--accent', '#ff2d85');
    }
  } catch (e) {
    document.documentElement.style.setProperty('--accent', '#ff2d85');
    bg.style.backgroundImage = `url("${STREAM_LOGO}")`;
  }
}

/* ====== Now Playing (EventSource) ====== */
function setupNowPlaying(){
  const es = new EventSource(NOWPLAYING_API);

  es.onmessage = async (e) => {
    try {
      const data = JSON.parse(e.data);
      const raw = (data.streamTitle||"").trim();

      // COMMERCIAL DETECTION (several keywords)
      const lowered = raw.toLowerCase();
      if (!raw || lowered.includes("commercial") || lowered.includes("spot") || lowered.includes("ad") || lowered.includes("intervalo") || lowered.includes("break")) {
        currentTitleEl.textContent = "Commercial Break";
        currentArtistEl.textContent = "";
        const commercialImg = "/image/commercial break.png";
        coverMain.src = commercialImg;
        await applyAccentFromImage(commercialImg);
        return;
      }

      // format artist — song
      const parts = raw.split(" - ");
      const artist = parts[0] ? parts[0].trim() : "";
      const song = parts[1] ? parts[1].trim() : (parts[0] || "").trim();

      if (!artist && !song) return;

      if (artist === currentArtist && song === currentSong) return;

      currentArtist = artist;
      currentSong = song;

      currentTitleEl.textContent = song || "Untitled";
      currentArtistEl.textContent = artist || "";

      // fetch cover image
      const cover = await fetchCover(artist, song);
      coverMain.src = cover;
      await applyAccentFromImage(cover);

      // add to history
      addToHistory(artist, song, cover);

      // set subtle "progress" pulse for live stream (simulate)
      let pct = 0;
      const interval = setInterval(()=> {
        pct = (pct + Math.random()*8) % 100;
        setProgressPulse(pct);
      }, 900);
      setTimeout(()=> clearInterval(interval), 9000);

    } catch (err) {
      console.warn("NowPlaying parse error", err);
    }
  };

  es.onerror = () => {
    // try reconnect UI hint
    // console.log("NowPlaying SSE error — reconnecting...");
    setTimeout(setupNowPlaying, 4000);
  };
}

setupNowPlaying();

/* ====== Small UX: show visual play state when audio plays/pauses ====== */
audio.addEventListener('play', ()=> playBtn.textContent = '⏸');
audio.addEventListener('pause', ()=> playBtn.textContent = '▶');

/* ====== initial bg & cover ====== */
coverMain.src = STREAM_LOGO;
bg.style.backgroundImage = `url("${STREAM_LOGO}")`;
document.documentElement.style.setProperty('--accent', '#ff2d85');
