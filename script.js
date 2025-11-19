/* ====== CONFIG ====== */
const STREAM_URL = "https://stream.zeno.fm/hvwifp8ezc6tv";
const NOWPLAYING_API = "https://api.zeno.fm/mounts/metadata/subscribe/hvwifp8ezc6tv";
const STREAM_LOGO = "/image/logopraisefm.webp";
const LASTFM_API_KEY = "7744c8f90ee053fc761e0e23bfa00b89"; // sua API

/* ====== DOM ====== */
const audio = document.getElementById("radioPlayer");
const playBtn = document.getElementById("playBtn");
const playIcon = document.getElementById("playIcon");
const coverMain = document.getElementById("coverMain");
const bg = document.getElementById("bg");
const currentTitleEl = document.getElementById("currentTitle");
const currentArtistEl = document.getElementById("currentArtist");
const historyList = document.getElementById("historyList");
const volumeSlider = document.getElementById("volumeSlider");
const progressFill = document.getElementById("progressFill");
const timeLeftEl = document.getElementById("timeLeft");
const timeRightEl = document.getElementById("timeRight");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const muteBtn = document.getElementById("muteBtn");
const airBtn = document.getElementById("airBtn");
const queueBtn = document.getElementById("queueBtn");

/* internal state */
let currentArtist = "";
let currentSong = "";
let recentSet = new Set();

/* ====== WHITELISTED PROGRAMS (NEVER DETECT AS COMMERCIAL) ====== */
const PROGRAM_WHITELIST = [
  "the living the message",
  "the living message",
  "the living the message -",
  "the living the message:",
  "acoustic worship",
  "louvor acústico",
  "praise fm carpool",
  "carpool",
  "the living",
  // add more program identifiers here if needed
].map(s => s.toLowerCase());

/* ====== HELPER: isCommercialStrict ====== */
function isCommercialStrict(raw){
  if (!raw) return false;
  const lowered = raw.toLowerCase();

  // exact commercial phrases we consider real commercials
  const commercialPatterns = [
    "commercial break",
    "commercial",
    "ad break",
    "spot break",
    "intervalo comercial",
    "commercials",
    "ad",
    "spot",
    "break"
  ];

  // if whitelist matches, don't treat as commercial
  for (const w of PROGRAM_WHITELIST){
    if (lowered.includes(w)) return false;
  }

  // Only consider commercial if raw exactly matches or contains one of the strict phrases
  for (const p of commercialPatterns){
    // require either the phrase as a whole word or common separators
    if (lowered === p) return true;
    if (lowered.includes(p + " ") || lowered.includes(" " + p) || lowered.includes(" - " + p) || lowered.includes(p + " - ")) return true;
  }

  return false;
}

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
    setPlayUI(true);
  } else {
    audio.pause();
    setPlayUI(false);
  }
});

function setPlayUI(isPlaying){
  if (isPlaying){
    // set play icon to pause (replace svg path with pause)
    playIcon.innerHTML = `<path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" fill="currentColor"/>`;
    playBtn.setAttribute('aria-pressed','true');
  } else {
    playIcon.innerHTML = `<path d="M5 3.5v17l14-8.5L5 3.5z" fill="currentColor"/>`;
    playBtn.setAttribute('aria-pressed','false');
  }
}

// initial UI
setPlayUI(false);

/* volume */
audio.volume = Number(volumeSlider.value);
volumeSlider.addEventListener("input", () => audio.volume = Number(volumeSlider.value));
muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.classList.toggle('accented', audio.muted);
});

/* small prev/next UX (no actual skip for stream) */
prevBtn.addEventListener("click", ()=> { /* placeholder: could trigger jump in history UI */ });
nextBtn.addEventListener("click", ()=> { /* placeholder */ });

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

  // trim to 40 items
  if (historyList.children.length > 40) historyList.removeChild(historyList.lastChild);
}

/* ====== LAST.FM COVER FETCH (robust) ====== */
async function fetchCover(artist, song) {
  try {
    if (!artist && !song) return STREAM_LOGO;

    const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(song)}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return STREAM_LOGO;
    const json = await res.json();

    let img = json?.track?.album?.image?.pop()?.["#text"] || null;
    if (!img || typeof img !== "string" || img.trim() === "") return STREAM_LOGO;
    if (img.startsWith("//")) img = "https:" + img;
    return img;
  } catch (err) {
    return STREAM_LOGO;
  }
}

/* ====== color extraction (best-effort with CORS fallback) ====== */
function extractColorFromImageUrl(url){
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const w = Math.min(120, img.width);
          const h = Math.min(120, img.height);
          canvas.width = w; canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);
          const data = ctx.getImageData(0,0,w,h).data;
          const count = {};
          for (let i=0;i<data.length;i+=4){
            const r=data[i], g=data[i+1], b=data[i+2];
            if (r>240 && g>240 && b>240) continue;
            if (r<12 && g<12 && b<12) continue;
            const key = `${Math.round(r/16)*16},${Math.round(g/16)*16},${Math.round(b/16)*16}`;
            count[key] = (count[key]||0) + 1;
          }
          let top=null, topCount=0;
          for (const k in count) if (count[k] > topCount){ top=k; topCount=count[k]; }
          if (!top) return resolve(null);
          const parts = top.split(',').map(Number);
          resolve(`rgb(${parts[0]},${parts[1]},${parts[2]})`);
        } catch(e){ resolve(null); }
      };
      img.onerror = () => resolve(null);
    } catch(e){ resolve(null); }
  });
}

async function applyAccentFromImage(url){
  try {
    bg.style.backgroundImage = `url("${url}")`;
    const color = await extractColorFromImageUrl(url);
    if (color) {
      document.documentElement.style.setProperty('--accent', color);
      // add accent class to icons so they change color
      setIconsAccented(true);
    } else {
      document.documentElement.style.setProperty('--accent', '#ff2d85');
      setIconsAccented(false);
    }
  } catch(e){
    document.documentElement.style.setProperty('--accent', '#ff2d85');
    setIconsAccented(false);
    bg.style.backgroundImage = `url("${STREAM_LOGO}")`;
  }
}

function setIconsAccented(on){
  const controls = document.querySelectorAll('.control, .mini-icon, .icon-btn');
  controls.forEach(el => {
    if (on) el.classList.add('accented');
    else el.classList.remove('accented');
  });
}

/* ====== Progress pulse for stream (visual only) ====== */
function setProgressPulse(pct){ progressFill.style.width = `${pct}%`; }

/* ====== Now Playing (EventSource) ====== */
function setupNowPlaying(){
  const es = new EventSource(NOWPLAYING_API);

  es.onmessage = async (e) => {
    try {
      const data = JSON.parse(e.data);
      const raw = (data.streamTitle||"").trim();
      const lowered = raw.toLowerCase();

      // Commercial detection using strict function + whitelist
      if (isCommercialStrict(raw)) {
        currentTitleEl.textContent = "Commercial Break";
        currentArtistEl.textContent = "";
        const commercialImg = "/image/commercial break.png";
        coverMain.src = commercialImg;
        await applyAccentFromImage(commercialImg);
        return;
      }

      // parse artist and song
      const parts = raw.split(" - ");
      const artist = parts[0] ? parts[0].trim() : "";
      const song = parts[1] ? parts[1].trim() : (parts[0] || "").trim();

      if (!artist && !song) return;
      if (artist === currentArtist && song === currentSong) return;

      currentArtist = artist;
      currentSong = song;

      currentTitleEl.textContent = song || "Untitled";
      currentArtistEl.textContent = artist || "";

      // fetch cover
      const cover = await fetchCover(artist, song);
      coverMain.src = cover;
      await applyAccentFromImage(cover);

      // add to history
      addToHistory(artist, song, cover);

      // progress pulse simulation
      let pct = 0;
      const interval = setInterval(()=> {
        pct = Math.min(100, pct + (6 + Math.random()*10));
        setProgressPulse(pct);
      }, 700);
      setTimeout(()=> { clearInterval(interval); setProgressPulse(0); }, 9000);

    } catch (err) {
      console.warn("NowPlaying parse error", err);
    }
  };

  es.onerror = () => {
    setTimeout(setupNowPlaying, 4000);
  };
}

setupNowPlaying();

/* ====== Keep play/pause button in sync with audio events ====== */
audio.addEventListener('play', ()=> setPlayUI(true));
audio.addEventListener('pause', ()=> setPlayUI(false));

/* ====== initial bg & cover ====== */
coverMain.src = STREAM_LOGO;
bg.style.backgroundImage = `url("${STREAM_LOGO}")`;
document.documentElement.style.setProperty('--accent', '#ff2d85');
setIconsAccented(false);
