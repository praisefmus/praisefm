document.addEventListener('DOMContentLoaded', () => {
  const STREAM_URL = 'https://stream.zeno.fm/hvwifp8ezc6tv';
  const NOWPLAYING_API = 'https://api.zeno.fm/mounts/metadata/subscribe/hvwifp8ezc6tv';
  const LASTFM_API_KEY = '7744c8f90ee053fc761e0e23bfa00b89';

  const STREAM_LOGO_URL = 'https://raw.githubusercontent.com/praisefmus/praisefm/main/image/logopraisefm.webp';
  const COMMERCIAL_IMAGE_URL = 'https://raw.githubusercontent.com/praisefmus/praisefm/main/image/commercial%20break.png';

  const player = document.getElementById('radioPlayer');
  const playBtn = document.getElementById('playBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  const statusText = document.getElementById('status');
  const coverImg = document.getElementById('coverImg');
  const currentTitleEl = document.getElementById('currentTitle');
  const currentDateEl = document.getElementById('currentDate');
  const currentTimeEl = document.getElementById('currentTime');
  const historyList = document.getElementById('historyList');
  const favoriteBtn = document.getElementById('favoriteBtn');
  const showImageEl = document.getElementById('showImage');

  if (!player || !playBtn || !volumeSlider) {
    console.error("Error: Essential player elements not found.");
    statusText.textContent = "Error loading player. Please refresh.";
    return;
  }

  let playing = false;
  let currentTrackKey = '';
  const history = [];
  const MAX_HISTORY = 5;
  let currentSong = '';
  let currentArtist = '';
  let retryCount = 0;
  const MAX_RETRIES = 5;

  player.crossOrigin = 'anonymous';
  player.src = STREAM_URL;
  player.volume = parseFloat(localStorage.getItem('volume') || volumeSlider.value);

  coverImg.src = STREAM_LOGO_URL;
  coverImg.alt = 'Praise FM U.S. Logo';

  function updatePlayButton() {
    playBtn.textContent = playing ? '⏸ Pause' : '▶ Play';
    playBtn.setAttribute('aria-label', playing ? 'Pause radio' : 'Play radio');
    playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
  }

  player.play().then(() => {
    playing = true;
    updatePlayButton();
    statusText.textContent = 'LIVE • Now Playing';
  }).catch(err => {
    console.warn('Autoplay blocked — user interaction required');
    playing = false;
    updatePlayButton();
    statusText.textContent = 'Click Play to listen.';
  });

  playBtn.addEventListener('click', () => {
    if (playing) {
      player.pause();
      statusText.textContent = 'Paused';
    } else {
      player.play().then(() => {
        statusText.textContent = 'LIVE • Now Playing';
      }).catch(err => {
        statusText.textContent = 'Failed to play — try again.';
        console.error('Play error:', err);
      });
    }
    playing = !playing;
    updatePlayButton();
  });

  volumeSlider.addEventListener('input', () => {
    player.volume = volumeSlider.value;
    localStorage.setItem('volume', volumeSlider.value);
    volumeSlider.setAttribute('aria-valuenow', volumeSlider.value);
    statusText.textContent = `Volume: ${Math.round(player.volume * 100)}%`;
  });

  function updateTime() {
    const now = new Date();
    const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Chicago' };
    const optionsDate = { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Chicago' };
    const timeFormatted = now.toLocaleTimeString('en-US', optionsTime);
    const dateFormatted = now.toLocaleDateString('en-US', optionsDate);
    currentTimeEl.textContent = timeFormatted;
    currentDateEl.textContent = dateFormatted;
  }

  setInterval(updateTime, 1000);
  updateTime();

  function addToHistory(song, artist, coverUrl = '') {
    const key = `${artist} - ${song}`;
    if (key === currentTrackKey) return;
    currentTrackKey = key;

    const existing = history.findIndex(item => item.song === song && item.artist === artist);
    if (existing !== -1) history.splice(existing, 1);
    history.unshift({ song, artist, coverUrl });
    if (history.length > MAX_HISTORY) history.pop();
    renderHistory();
  }

  function renderHistory() {
    if (history.length === 0) {
      historyList.innerHTML = '<li style="text-align:center;color:#666;padding:16px;">No songs yet...</li>';
      return;
    }

    historyList.innerHTML = history.map(item => {
      const key = `${item.artist} - ${item.song}`;
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const isFav = favorites.includes(key);
      const star = isFav ? '★' : '☆';
      const displayImg = item.coverUrl && item.coverUrl !== STREAM_LOGO_URL
        ? item.coverUrl
        : STREAM_LOGO_URL;

      return `
        <li class="history-item" role="listitem">
          <div class="history-img">
            <img
              src="${displayImg}"
              alt="${item.artist} - ${item.song}"
              width="40"
              height="40"
              loading="lazy"
            />
          </div>
          <div class="history-text">
            <div class="history-title-item">
              ${item.song}
              <span
                class="favorite-history"
                data-key="${key}"
                role="button"
                tabindex="0"
                aria-label="Favorite ${item.artist} - ${item.song}"
              >${star}</span>
            </div>
            <div class="history-artist">${item.artist}</div>
          </div>
        </li>`;
    }).join('');

    document.querySelectorAll('.favorite-history').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(el.dataset.key, el);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleFavorite(el.dataset.key, el);
        }
      });
    });
  }

  function toggleFavorite(key, element = null) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.indexOf(key);
    if (index === -1) {
      favorites.push(key);
    } else {
      favorites.splice(index, 1);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));

    const isNowFav = index === -1;
    if (key === `${currentArtist} - ${currentSong}`) {
      favoriteBtn.textContent = isNowFav ? '★' : '☆';
      favoriteBtn.classList.toggle('favorited', isNowFav);
      showImageEl.classList.toggle('favorited-cover', isNowFav);
    }
    if (element) {
      element.textContent = isNowFav ? '★' : '☆';
      element.setAttribute('data-key', key);
    }
    updateFavoriteButton();
  }

  function updateFavoriteButton() {
    if (!currentSong || !currentArtist) return;
    const key = `${currentArtist} - ${currentSong}`;
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const isFav = favorites.includes(key);
    favoriteBtn.textContent = isFav ? '★' : '☆';
    favoriteBtn.classList.toggle('favorited', isFav);
    showImageEl.classList.toggle('favorited-cover', isFav);
    favoriteBtn.setAttribute('aria-pressed', isFav ? 'true' : 'false');
  }

  function isCommercial(title) {
    const keywords = [
      'commercial', 'advertisement', 'sponsor', 'spot',
      'publicidade', 'intervalo', 'break', 'jingle',
      'comercial', 'anúncio', 'patrocínio'
    ];
    const lower = title.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return keywords.some(k => lower.includes(k));
  }

  function fetchCoverArt(artist, song) {
    if (!artist || !song || isCommercial(song) || artist === 'Praise FM U.S.' || song === 'Live') {
      return Promise.resolve(STREAM_LOGO_URL);
    }
    return fetch(`https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(song)}&format=json`)
      .then(res => res.json())
      .then(data => {
        const images = data.track?.album?.image;
        if (images) {
          const cover = images.find(img => img.size === 'extralarge') || images[images.length - 1];
          return cover['#text'] || STREAM_LOGO_URL;
        }
        return STREAM_LOGO_URL;
      })
      .catch(err => {
        console.warn('Failed to fetch cover:', err);
        return STREAM_LOGO_URL;
      });
  }

  function isInvalidCover(imageUrl) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(false);
      img.onerror = () => resolve(true);
      img.src = imageUrl;
      setTimeout(() => resolve(true), 5000);
    });
  }

  function toggleCoverDisplay(showImage = true, imageUrl = '', isSpot = false) {
    let altText = `${currentArtist} - ${currentSong}`;
    if (isSpot) {
      coverImg.src = COMMERCIAL_IMAGE_URL;
      altText = 'Commercial Break';
    } else if (showImage && imageUrl && imageUrl !== STREAM_LOGO_URL) {
      coverImg.src = imageUrl;
    } else {
      coverImg.src = STREAM_LOGO_URL;
    }
    coverImg.alt = altText;
  }

  function setupNowPlaying() {
    const eventSource = new EventSource(NOWPLAYING_API);
    eventSource.onmessage = (event) => {
      retryCount = 0; // Reset retry on success
      try {
        const data = JSON.parse(event.data);
        let streamTitle = (data.streamTitle || '').trim() || 'Unknown Song';
        streamTitle = streamTitle
          .replace(/[^\p{L}\p{N}\-.,!? ]+/gu, '')
          .replace(/\s+/g, ' ')
          .trim();

        if (!streamTitle || streamTitle.length < 3) {
          streamTitle = 'Praise FM U.S. - Spot';
        }

        const isSpot = isCommercial(streamTitle);
        if (isSpot) {
          streamTitle = 'Praise FM U.S. - Spot';
        }

        const parts = streamTitle.split(' - ').map(p => p.trim()).filter(Boolean);
        const artist = parts[0] || 'Praise FM U.S.';
        const song = parts.length > 1 ? parts.slice(1).join(' - ') : streamTitle;
        currentSong = song;
        currentArtist = artist;

        currentTitleEl.textContent = `${artist} - ${song}`;
        currentTitleEl.title = `${artist} - ${song}`;

        fetchCoverArt(artist, song).then(coverUrl => {
          if (!coverUrl || isSpot || coverUrl === STREAM_LOGO_URL) {
            toggleCoverDisplay(false, '', isSpot);
            addToHistory(song, artist, isSpot ? COMMERCIAL_IMAGE_URL : STREAM_LOGO_URL);
          } else {
            isInvalidCover(coverUrl).then(isInvalid => {
              if (isInvalid) {
                toggleCoverDisplay(false, '', isSpot);
                addToHistory(song, artist, STREAM_LOGO_URL);
              } else {
                toggleCoverDisplay(true, coverUrl, isSpot);
                addToHistory(song, artist, coverImg.src);
              }
            }).catch(() => {
              toggleCoverDisplay(false, '', isSpot);
              addToHistory(song, artist, STREAM_LOGO_URL);
            });
          }

          updateFavoriteButton();
          statusText.textContent = `LIVE • Now Playing: ${artist} - ${song}`;
          if (isSpot) {
            statusText.textContent = '📢 Commercial Break';
          }
        }).catch(err => {
          console.error("Error fetching cover:", err);
          toggleCoverDisplay(false, '', true);
          addToHistory(song, artist, COMMERCIAL_IMAGE_URL);
          currentTitleEl.textContent = 'Praise FM U.S. - Live';
          statusText.textContent = 'LIVE • Live';
        });
      } catch (err) {
        console.warn('Error parsing metadata', err);
        currentTitleEl.textContent = 'Praise FM U.S. - Live';
        toggleCoverDisplay(false, '', true);
        statusText.textContent = 'LIVE • Live';
        addToHistory('Live', 'Praise FM U.S.', COMMERCIAL_IMAGE_URL);
      }
    };

    eventSource.onerror = () => {
      console.warn('EventSource disconnected, retrying in 5s...');
      statusText.textContent = 'Connection failed. Retrying...';
      eventSource.close();
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        setTimeout(setupNowPlaying, 5000);
      } else {
        statusText.textContent = 'Max retries reached. Please refresh.';
      }
    };
  }

  favoriteBtn.addEventListener('click', () => {
    if (currentSong && currentArtist) {
      toggleFavorite(`${currentArtist} - ${currentSong}`);
    }
  });

  setupNowPlaying();
  updatePlayButton();
  volumeSlider.value = player.volume; // Sync slider with persisted volume
  updateFavoriteButton(); // Inicializa favoritos
});
