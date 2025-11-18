const STREAM_URL = "https://stream.zeno.fm/hvwifp8ezc6tv";
const NOWPLAYING_API = "https://api.zeno.fm/mounts/metadata/subscribe/hvwifp8ezc6tv";

const STREAM_LOGO_URL = "/image/logopraisefm.webp";

const audio = document.getElementById("audioPlayer");
const playButton = document.getElementById("playButton");
const volumeSlider = document.getElementById("volumeSlider");
const coverImage = document.getElementById("coverImage");
const currentTitleEl = document.getElementById("currentTitle");
const historyList = document.getElementById("historyList");
const statusText = document.getElementById("status");

let retryCount = 0;
let currentSong = "";
let currentArtist = "";

audio.src = STREAM_URL;
audio.volume = 0.7;

playButton.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playButton.textContent = "⏸ Pause";
  } else {
    audio.pause();
    playButton.textContent = "▶ Listen Live";
  }
});

volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
});

/* --- IGNORAR COMMERCIAL BREAK E REPETIÇÕES --- */
function isCommercial(text) {
  text = text.toLowerCase();
  return (
    text.includes("commercial") ||
    text.includes("break") ||
    text.includes("spot") ||
    text.includes("ad")
  );
}

/* --- ADICIONAR AO HISTÓRICO --- */
function addToHistory(song, artist, cover) {
  const item = document.createElement("li");
  item.className = "history-item";

  item.innerHTML = `
    <div class="history-img"><img src="${cover}"></div>
    <div class="history-text">
      <div class="history-title-item">${song}</div>
      <div class="history-artist">${artist}</div>
    </div>
  `;

  historyList.prepend(item);
}

/* --- INICIAR METADATA --- */
function setupNowPlaying() {
  const es = new EventSource(NOWPLAYING_API);

  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      let title = (data.streamTitle || "").trim();

      if (!title || isCommercial(title)) {
        statusText.textContent = "LIVE • Praise FM U.S.";
        currentTitleEl.textContent = "Praise FM U.S.";
        coverImage.src = STREAM_LOGO_URL;
        return;
      }

      const parts = title.split(" - ");
      const artist = parts[0] || "Praise FM";
      const song = parts[1] || title;

      if (song === currentSong && artist === currentArtist) return;

      currentSong = song;
      currentArtist = artist;

      currentTitleEl.textContent = `${artist} - ${song}`;
      statusText.textContent = `LIVE • Now Playing: ${artist} - ${song}`;

      fetchCover(artist, song);
    } catch (e) {
      console.log("Metadata error:", e);
    }
  };

  es.onerror = () => {
    es.close();
    setTimeout(setupNowPlaying, 5000);
  };
}

/* --- BUSCAR CAPA NO LASTFM --- */
async function fetchCover(artist, song) {
  try {
    const r = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=${encodeURIComponent(
        artist
      )}&track=${encodeURIComponent(
        song
      )}&api_key=7744c8f90ee053fc761e6a2f7e45f409&format=json`
    );

    const json = await r.json();
    const img =
      json?.track?.album?.image?.pop()?.["#text"] || STREAM_LOGO_URL;

    coverImage.src = img;
    addToHistory(song, artist, img);
  } catch {
    coverImage.src = STREAM_LOGO_URL;
  }
}

setupNowPlaying();
