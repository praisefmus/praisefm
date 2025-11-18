// CONFIG
const STREAM_URL = "https://stream.zeno.fm/hvwifp8ezc6tv";
const NOWPLAYING_API = "https://api.zeno.fm/mounts/metadata/subscribe/hvwifp8ezc6tv";
const STREAM_LOGO_URL = "./image/logopraisefm.webp";

let audio = new Audio(STREAM_URL);
audio.volume = 0.7;

let retryCount = 0;
const MAX_RETRIES = 5;

const coverArt = document.getElementById("coverArt");
const currentTitle = document.getElementById("currentTitle");
const playButton = document.getElementById("playButton");
const volumeControl = document.getElementById("volumeControl");
const statusText = document.getElementById("statusText");
const historyList = document.getElementById("historyList");

let currentSong = "";
let currentArtist = "";

// PLAY
playButton.addEventListener("click", () => {
    if (audio.paused) {
        audio.play();
        playButton.textContent = "Pause";
    } else {
        audio.pause();
        playButton.textContent = "Play";
    }
});

// VOLUME
volumeControl.addEventListener("input", (e) => {
    audio.volume = e.target.value;
});

// CHECK INVALID COVER
async function isInvalidCover(url) {
    try {
        const res = await fetch(url, { method: "HEAD" });
        return !res.ok;
    } catch {
        return true;
    }
}

// LASTFM COVER FETCH
async function fetchCoverArt(artist, song) {
    try {
        const res = await fetch(
            `https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(song)}&artist=${encodeURIComponent(artist)}&api_key=7744c8f90ee053fc761e3b2c0f63357b&format=json`
        );

        const data = await res.json();
        const image = data?.results?.trackmatches?.track?.[0]?.image?.[3]["#text"];

        return image || STREAM_LOGO_URL;
    } catch {
        return STREAM_LOGO_URL;
    }
}

// ADD TO HISTORY
function addToHistory(song, artist, cover) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${song}</strong><br><span>${artist}</span>`;
    historyList.prepend(li);
}

// METADATA LISTENER
function setupNowPlaying() {
    const eventSource = new EventSource(NOWPLAYING_API);

    eventSource.onmessage = async (event) => {
        retryCount = 0;

        try {
            const data = JSON.parse(event.data);
            let streamTitle = (data.streamTitle || "").trim();

            // clean
            streamTitle = streamTitle.replace(/[^\p{L}\p{N}\-.,!?& ]+/gu, "")
                                     .replace(/\s+/g, " ")
                                     .trim();

            if (!streamTitle || streamTitle.toLowerCase().includes("praise fm")) {
                statusText.textContent = "LIVE • Praise FM U.S.";
                currentTitle.textContent = "Praise FM U.S.";
                coverArt.src = STREAM_LOGO_URL;
                return;
            }

            // split
            const parts = streamTitle.split(" - ");
            const artist = parts[0] || "Praise FM U.S.";
            const song = parts[1] || streamTitle;

            currentArtist = artist;
            currentSong = song;

            currentTitle.textContent = `${artist} - ${song}`;
            statusText.textContent = `LIVE • Now Playing`;

            const coverUrl = await fetchCoverArt(artist, song);
            const invalid = await isInvalidCover(coverUrl);

            coverArt.src = invalid ? STREAM_LOGO_URL : coverUrl;

            addToHistory(song, artist, coverUrl);

        } catch (err) {
            console.log("Metadata error", err);
        }
    };

    eventSource.onerror = () => {
        statusText.textContent = "Connection lost… reconnecting";
        eventSource.close();

        if (retryCount < MAX_RETRIES) {
            retryCount++;
            setTimeout(setupNowPlaying, 3000);
        } else {
            statusText.textContent = "Max retries reached.";
        }
    };
}

setupNowPlaying();
