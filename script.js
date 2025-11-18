const STREAM_URL = 'https://stream.zeno.fm/hvwifp8ezc6tv';
const ZENO_NOWPLAYING = 'https://api.zeno.fm/mounts/metadata/subscribe/hvwifp8ezc6tv';
const LASTFM_API_KEY = '7744c8f90ee053fc761e1a8d7b9a1234';
const LASTFM_USER = 'PraiseFMUS';
const POLL_INTERVAL = 15000;

const audio = new Audio(STREAM_URL);
audio.volume = 0.7;

const cover = document.getElementById('cover');
const title = document.getElementById('track-title');
const artist = document.getElementById('track-artist');
const playBtn = document.getElementById('play-btn');
const volume = document.getElementById('volume');

playBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    playBtn.textContent = '⏸️';
    cover.classList.add('playing');
  } else {
    audio.pause();
    playBtn.textContent = '▶️';
    cover.classList.remove('playing');
  }
});

volume.addEventListener('input', () => {
  audio.volume = volume.value;
});

async function fetchNowPlaying() {
  try {
    const response = await fetch(ZENO_NOWPLAYING);
    const data = await response.json();
    let track = data.mounts[0].metadata.song;

    if (!track || track === '') {
      title.textContent = 'Praise FM';
      artist.textContent = '';
      cover.src = 'image/logo.webp';
      return;
    }

    const [artistName, trackTitle] = track.split(' - ') || ['', track];
    title.textContent = trackTitle || 'Desconhecido';
    artist.textContent = artistName || 'Praise FM';

    // Buscar capa no Last.fm
    const lastfmRes = await fetch(`https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(trackTitle)}&format=json`);
    const lastfmData = await lastfmRes.json();

    let image = lastfmData.track?.album?.image?.find(img => img.size === 'extralarge')?.['#text'];
    cover.src = image ? image : 'image/logo.webp';
  } catch (error) {
    console.error('Erro ao atualizar Now Playing:', error);
    title.textContent = 'Praise FM';
    artist.textContent = '';
    cover.src = 'image/logo.webp';
  }
}

// Atualiza a cada POLL_INTERVAL
fetchNowPlaying();
setInterval(fetchNowPlaying, POLL_INTERVAL);