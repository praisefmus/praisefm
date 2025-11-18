const API_KEY = '7744c8f90ee053fc761e0e23bfa00b89';
const coverImg = document.getElementById('cover');
const blurBg = document.getElementById('blur-background');
const artistSpan = document.getElementById('artist');
const trackSpan = document.getElementById('track');

// Música inicial (exemplo)
let currentSong = {
  artist: 'Needtobreathe',
  track: 'Brother'
};

// Fallback do logo
const LOGO_URL = '/image/logopraisefm.webp';

async function updateCover(song) {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${API_KEY}&artist=${encodeURIComponent(song.artist)}&track=${encodeURIComponent(song.track)}&format=json`;
    const res = await fetch(url);
    const data = await res.json();

    const albumCover = data?.track?.album?.image?.find(img => img.size === 'large')?.['#text'];
    const coverUrl = albumCover || LOGO_URL;

    coverImg.src = coverUrl;
    blurBg.style.backgroundImage = `url(${coverUrl})`;

    artistSpan.textContent = song.artist;
    trackSpan.textContent = song.track;

  } catch (err) {
    console.error('Erro ao buscar capa:', err);
    coverImg.src = LOGO_URL;
    blurBg.style.backgroundImage = `url(${LOGO_URL})`;
  }
}

// Inicializa a capa
updateCover(currentSong);

// Aqui você pode adicionar lógica para atualizar currentSong dinamicamente