const audio = document.getElementById('audio');
const playButton = document.getElementById('play-button');
const cover = document.getElementById('cover');
const bg = document.getElementById('bg');
const trackList = document.getElementById('track-list');

playButton.addEventListener('click', () => {
    if(audio.paused) {
        audio.play();
        playButton.textContent = '⏸️';
    } else {
        audio.pause();
        playButton.textContent = '▶️';
    }
});

function updateBackground(src) {
    bg.style.backgroundImage = `url('${src}')`;
}
updateBackground(cover.src);

// Lista simulada de músicas recentes
const recentTracks = [
    "Song 1 - Artist A",
    "Song 2 - Artist B",
    "Song 3 - Artist C",
    "Song 4 - Artist D"
];

recentTracks.forEach(track => {
    const li = document.createElement('li');
    li.textContent = track;
    trackList.appendChild(li);
});