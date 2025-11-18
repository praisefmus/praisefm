const audio = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");
const volumeSlider = document.getElementById("volumeSlider");
const trackTitle = document.getElementById("track-title");
const cover = document.getElementById("cover");
const recentList = document.getElementById("recentList");

// API Zeno FM
const NOWPLAYING_URL = "https://api.zeno.fm/mounts/metadata/subscribe/hvwifp8ezc6tv";

// PLAY / PAUSE
playBtn.addEventListener("click", () => {
    if (audio.paused) {
        audio.play();
        playBtn.textContent = "❚❚";
    } else {
        audio.pause();
        playBtn.textContent = "►";
    }
});

// VOLUME
volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
});

// RECEBE METADADOS
async function loadNowPlaying() {
    try {
        const res = await fetch(NOWPLAYING_URL);
        const data = await res.json();

        const title = data.now_playing.title || "Praise FM";
        const artwork = data.now_playing.artwork || "image/logopraisefm.webp";
        const history = data.recently_played || [];

        trackTitle.textContent = title;
        cover.src = artwork;

        // RESETAR LISTA
        recentList.innerHTML = "";

        history.slice(0, 5).forEach(track => {
            const li = document.createElement("li");
            li.textContent = track.title;
            recentList.appendChild(li);
        });

    } catch (err) {
        console.log("Erro ao carregar metadata:", err);
    }
}

// Atualiza a cada 5 segundos
setInterval(loadNowPlaying, 5000);
loadNowPlaying();
