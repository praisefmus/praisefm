/* Apple-style live radio player
   - stronger blurred background from cover (fade)
   - subtle gradient play button
   - cover fade + zoom-in on change
   - controls float on a translucent card
   - no duplicate history; ignore commercials
*/

const STREAM_URL = "https://stream.zeno.fm/hvwifp8ezc6tv";
const NOWPLAYING_API = "https://api.zeno.fm/mounts/metadata/subscribe/hvwifp8ezc6tv";
const STREAM_LOGO = "/image/logopraisefm.webp";

// DOM
const audio = document.getElementById("radioPlayer");
const playBtn = document.getElementById("playBtn");
const coverImg = document.getElementById("coverImg");
const currentTitleEl = document.getElementById("currentTitle");
const currentSubEl = document.getElementById("currentSub");
const statusEl = document.getElementById("status");
const historyList = document.getElementById("historyList");
const volumeSlider = document.getElementById("volumeSlider");
const currentTimeEl = document.getElementById("currentTime");
const progressBar = document.getElementById("progressBar");
const bgExpand = document.getElementById("bgExpand");
const playCircle = document.querySelector(".play-circle");

let currentArtist = "";
let currentSong = "";
let retryCount = 0;
const MAX_RETRIES = 6;
const recentSet = new Set();

// initialize audio
audio.src = STREAM_URL;
audio.preload = "auto";
audio.volume = parseFloat(volumeSlider?.value || 0.7);

// Chicago time
function updateChicagoTime(){
  const now = new Date();
  currentTimeEl.textContent = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "America/Chicago" });
}
updateChicagoTime();
setInterval(updateChicagoTime, 30000);

// play/pause visual state
function setPlayingState(isPlaying){
  if (isPlaying){
    playCircle.classList.add("playing");
    playCircle.setAttribute("aria-pressed","true");
  } else {
    playCircle.classList.remove("playing");
    playCircle.setAttribute("aria-pressed","false");
  }
}

playBtn.addEventListener("click", ()=>{
  if (audio.paused){
    audio.src = STREAM_URL + "?_=" + Date.now();
    audio.play().then(()=> setPlayingState(true)).catch(err=>{ console.error("Play failed:",err); statusEl.textContent="Unable to play stream";});
  } else {
    audio.pause();
    setPlayingState(false);
  }
});

// volume control
if (volumeSlider) volumeSlider.addEventListener("input", (e)=> { audio.volume = e.target.value; });

// helpers
function isCommercialText(t){
  if (!t) return true;
  const s = t.toLowerCase();
  return s.includes("commercial") || s.includes("spot") || s.includes("ad") || s.includes("break");
}
function safeText(t){
  if (!t) return "";
  return String(t).replace(/[^\w\s\-.,!?'&()]/g, " ").replace(/\s+/g," ").trim();
}

// history - avoid duplicates
function addToHistory(artist, song, cover){
  const key = `${artist} - ${song}`;
  if (!song || isCommercialText(key)) return;
  if (recentSet.has(key)) return;
  recentSet.add(key);

  // cap history
  if (recentSet.size > 60){
    const last = historyList.lastElementChild;
    if (last){
      const txt = last.querySelector('.history-title')?.textContent || '';
      recentSet.delete(txt);
      historyList.removeChild(last);
    }
  }

  const empty = historyList.querySelector('.empty');
  if (empty) empty.remove();

  const li = document.createElement("li");
  li.className = "history-item";
  li.innerHTML = `
    <div class="history-thumb"><img src="${cover || STREAM_LOGO}" alt=""></div>
    <div class="history-meta">
      <div class="history-title">${artist} - ${song}</div>
      <div class="history-sub">${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
    </div>
  `;
  historyList.prepend(li);
}

// best-effort cover fetch via Last.fm
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

async function isCoverValid(url){
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

// background fade
function setBackgroundFromCover(url){
  if (!bgExpand) return;
  bgExpand.style.opacity = 0;
  // give opacity time to fade out before swapping image
  setTimeout(()=> {
    bgExpand.style.backgroundImage = `url('${url}')`;
    bgExpand.style.opacity = 1;
  }, 260);
}

// cover swap with fade+zoom
function swapCoverWithAnimation(url){
  if (!coverImg) return;
  coverImg.classList.add('fade-out');
  setTimeout(()=> {
    // change src
    coverImg.src = url;
    // remove fade and add zoom-in
    coverImg.classList.remove('fade-out');
    coverImg.classList.add('zoom-in');
    // remove zoom after animation
    setTimeout(()=> coverImg.classList.remove('zoom-in'), 900);
  }, 300);
}

// NowPlaying via EventSource
function setupNowPlaying(){
  const es = new EventSource(NOWPLAYING_API);

  es.onmessage = async (evt) => {
    retryCount = 0;
    try {
      const data = JSON.parse(evt.data);
      let streamTitle = safeText(data.streamTitle || "");

      // ignore station jingles or empty
      if (!streamTitle || streamTitle.toLowerCase().includes("praise fm") || isCommercialText(streamTitle)){
        currentArtist = "Praise FM U.S.";
        currentSong = "";
        currentTitleEl.textContent = "Praise FM U.S.";
        statusEl.textContent = "LIVE • Praise FM U.S.";
        swapCoverWithAnimation(STREAM_LOGO);
        setBackgroundFromCover(STREAM_LOGO);
        return;
      }

      // commercial break
      if (streamTitle.toLowerCase().includes("commercial break")){
        currentArtist = "Commercial Break";
        currentSong = "";
        currentTitleEl.textContent = "Commercial Break";
        statusEl.textContent = "LIVE • Commercial Break";
        swapCoverWithAnimation(STREAM_LOGO);
        setBackgroundFromCover(STREAM_LOGO);
        return;
      }

      const parts = streamTitle.split(" - ").map(p => p.trim()).filter(Boolean);
      let artist = parts[0] || "Unknown";
      let song = parts.slice(1).join(" - ") || parts[0] || streamTitle;

      // no change
      if (artist === currentArtist && song === currentSong) return;

      currentArtist = artist;
      currentSong = song;
      currentTitleEl.textContent = `${artist} — ${song}`;
      statusEl.textContent = `LIVE • Now Playing`;

      // get cover and validate
      const coverUrl = await fetchCover(artist, song);
      const valid = await isCoverValid(coverUrl);
      const finalCover = valid ? coverUrl : STREAM_LOGO;

      swapCoverWithAnimation(finalCover);
      setBackgroundFromCover(finalCover);

      // visual progress
      progressBar.style.width = "0%";
      setTimeout(()=> progressBar.style.width = "30%", 120);
      setTimeout(()=> progressBar.style.width = "65%", 700);

      addToHistory(artist, song, finalCover);
    } catch (err) {
      console.warn("NowPlaying parse error:", err);
    }
  };

  es.onerror = () => {
    retryCount++;
    statusEl.textContent = "Connection lost — reconnecting…";
    es.close();
    if (retryCount < MAX_RETRIES) setTimeout(setupNowPlaying, 5000);
    else statusEl.textContent = "Connection failed. Please refresh.";
  };
}

setupNowPlaying();
