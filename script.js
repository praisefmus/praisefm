const STREAM_URL = "https://stream.zeno.fm/hvwifp8ezc6tv";
const NOWPLAYING_API = "https://api.zeno.fm/mounts/metadata/subscribe/hvwifp8ezc6tv";
const STREAM_LOGO = "/image/logopraisefm.webp";

const audio = document.getElementById("radioPlayer");
const playBtn = document.getElementById("playBtn");
const coverImg = document.getElementById("coverImg");
const currentTitleEl = document.getElementById("currentTitle");
const statusEl = document.getElementById("status");
const historyList = document.getElementById("historyList");
const volumeSlider = document.getElementById("volumeSlider");
const currentTimeEl = document.getElementById("currentTime");

let currentArtist = "";
let currentSong = "";
let recentSet = new Set();

/* TIME (CHICAGO) */
function updateChicagoTime() {
    const now = new Date();
    currentTimeEl.textContent = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Chicago"
    });
}
updateChicagoTime();
setInterval(updateChicagoTime, 30000);

/* PLAY / PAUSE */
playBtn.addEventListener("click", () => {
    if (audio.paused) {
        audio.src = STREAM_URL + "?_=" + Date.now();
        audio.play();
        playBtn.textContent = "⏸";
    } else {
        audio.pause();
        playBtn.textContent = "▶";
    }
});

audio.volume = volumeSlider.value;
volumeSlider.oninput = () => audio.volume = volumeSlider.value;

/* HISTORY */
function addToHistory(artist, song, cover) {
    const key = `${artist} - ${song}`;
    if (recentSet.has(key)) return;
    recentSet.add(key);

    const li = document.createElement("li");
    li.className = "history-item";

    li.innerHTML = `
        <img src="${cover}" class="history-img" />
        <div class="history-text">
            <div class="history-title">${artist} - ${song}</div>
            <div class="history-time">${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
        </div>
    `;

    historyList.prepend(li);
}

/* FETCH COVER FROM LASTFM — UPDATED WITH YOUR API KEY */
async function fetchCover(artist, song) {
    try {
        const apiKey = "7744c8f90ee053fc761e0e23bfa00b89"; // SUA API KEY CORRETA
        const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${apiKey}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(song)}&format=json`;

        const res = await fetch(url);
        const json = await res.json();

        let img = json?.track?.album?.image?.pop()?.["#text"];

        // FIX: capa vazia ou inexistente → usa o logo
        if (!img || img.trim() === "") {
            return STREAM_LOGO;
        }

        return img;

    } catch {
        return STREAM_LOGO;
    }
}

/* NOW PLAYING */
function setupNowPlaying() {
    const es = new EventSource(NOWPLAYING_API);

    es.onmessage = async (e) => {
        try {
            const data = JSON.parse(e.data);
            const raw = (data.streamTitle || "").trim();

            if (!raw || raw.toLowerCase().includes("commercial")) {
                currentTitleEl.textContent = "Praise FM U.S.";
                coverImg.src = STREAM_LOGO;
                return;
            }

            const parts = raw.split(" - ");
            const artist = parts[0] || "";
            const song = parts[1] || parts[0];

            if (artist === currentArtist && song === currentSong) return;

            currentArtist = artist;
            currentSong = song;

            currentTitleEl.textContent = `${artist} — ${song}`;

            const cover = await fetchCover(artist, song);
            coverImg.src = cover;

            addToHistory(artist, song, cover);

            statusEl.textContent = "LIVE • Now Playing";

        } catch (err) {
            console.log("Metadata error:", err);
        }
    };

    es.onerror = () => {
        statusEl.textContent = "Reconnecting…";
        setTimeout(setupNowPlaying, 4000);
    };
}

setupNowPlaying();
