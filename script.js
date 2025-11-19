// --- CONFIGURAÇÃO ---
const STREAM_URL = "https://stream.zeno.fm/hvwifp8ezc6tv";
const LASTFM_API_KEY = "7744c8f90ee053fc761e0e23bfa00b89";

// --- ELEMENTOS DOM ---
const audio = new Audio(STREAM_URL);
const playPauseBtn = document.getElementById('playPauseBtn');
const iconPlay = document.getElementById('iconPlay');
const iconPause = document.getElementById('iconPause');
const artContainer = document.getElementById('artContainer');
const volumeSlider = document.getElementById('volumeSlider');
const volFill = document.getElementById('volFill');

const trackNameEl = document.getElementById('trackName');
const artistNameEl = document.getElementById('artistName');
const albumArtEl = document.getElementById('albumArt');
const bgBlur = document.getElementById('bgBlur');

// --- ESTADO DO PLAYER ---
let isPlaying = false;

// --- FUNÇÕES DE ÁUDIO ---
playPauseBtn.addEventListener('click', () => {
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        artContainer.classList.add('paused');
        iconPlay.style.display = 'block';
        iconPause.style.display = 'none';
    } else {
        audio.play();
        isPlaying = true;
        artContainer.classList.remove('paused');
        iconPlay.style.display = 'none';
        iconPause.style.display = 'block';
    }
});

// Controle de Volume
volumeSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    audio.volume = val;
    volFill.style.width = (val * 100) + '%';
});

// --- INTEGRAÇÃO LAST.FM ---
async function updateTrackInfo(artist, track) {
    if(!artist || !track) return;

    // Atualiza texto na tela
    trackNameEl.innerText = track;
    artistNameEl.innerText = artist;

    // Busca metadados e capa no Last.fm
    const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&format=json`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.track && data.track.album && data.track.album.image) {
            // Pega a imagem de maior resolução (extralarge)
            const images = data.track.album.image;
            const imgUrl = images[images.length - 1]['#text'];
            
            if (imgUrl) {
                albumArtEl.src = imgUrl;
                // Muda levemente a cor do fundo para simular efeito Apple
                bgBlur.style.background = `radial-gradient(circle at 50% 30%, #5a1e1e, #000)`;
            }
        }
    } catch (error) {
        console.error("Erro ao buscar no Last.fm:", error);
    }
}

// --- DEBUG / TESTE ---
// Se quiser ver a capa mudar, descomente as linhas abaixo:
/*
setTimeout(() => {
   updateTrackInfo("PinkPantheress", "Boy's a liar");
}, 3000);
*/
