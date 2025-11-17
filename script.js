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
  }).catch(() => {
    playing = false;
    updatePlayButton();
    statusText.textContent = 'Click Play to listen.';
  });

  playBtn.addEventListener('click', () => {
    if (playing) {
      player.pause();
      statusText.textContent = 'Paused';
      gtag('event', 'pause_radio', { event_category: 'Radio Player' });
    } else {
      player.play().then(() => {
        statusText.textContent = 'LIVE • Now Playing';
        gtag('event', 'play_radio', { event_category: 'Radio Player' });
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
    gtag('event', 'volume_change', {
      event_category: 'Radio Player',
      value: Math.round(player.volume * 100)
    });
  });

  function updateTime() {
    const now = new Date();
    const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Chicago' };
    const optionsDate = { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Chicago' };
    currentTimeEl.textContent = now.toLocaleTimeString('en-US', optionsTime);
    currentDateEl.textContent = now.toLocaleDateString('en-US', optionsDate);
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
      const displayImg = item.coverUrl && item.coverUrl !== STREAM_LOGO_URL ? item.coverUrl : STREAM_LOGO_URL;

      return `
        <li class="history-item" role="listitem">
          <div class="history-img">
            <img src="${displayImg}" alt="${item.artist} - ${item.song}" width="40" height="40" loading="lazy" />
          </div>
          <div class="history-text">
            <div class="history-title-item">
              ${item.song}
              <span class="favorite-history" data-key="${key}" role="button" tabindex="0" aria-label="Favorite ${item.artist} - ${item.song}">${star}</span>
            </div>
            <div class="history-artist">${item.artist}</div>
          </div>
        </li>`;
    }).join('');

    document.querySelectorAll('.favorite-history').forEach(el => {
      el.addEventListener('click', e => { e.stopPropagation(); toggleFavorite(el.dataset.key, el); });
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFavorite(el.dataset.key, el); } });
    });
  }

  function toggleFavorite(key, element = null) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.indexOf(key);
    const wasFavorite = index !== -1;

    if (!wasFavorite) {
      favorites.push(key);
      gtag('event', 'favorite_add', { event_category: 'Engagement', event_label: key });
    } else {
      favorites.splice(index, 1);
      gtag('event', 'favorite_remove', { event_category: 'Engagement', event_label: key });
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));

    if (key === `${currentArtist} - ${currentSong}`) {
      favoriteBtn.textContent = wasFavorite ? '☆' : '★';
      favoriteBtn.classList.toggle('favorited', !wasFavorite);
      showImageEl.classList.toggle('favorited-cover', !wasFavorite);
    }
    if (element) element.textContent = wasFavorite ? '☆' : '★';

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
    const keywords = ['commercial', 'advertisement', 'sponsor', 'spot', 'publicidade', 'intervalo', 'break', 'jingle', 'comercial', 'anúncio', 'patrocínio'];
    const lower = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return keywords.some(k => lower.includes(k));
  }

  function fetchCoverArt(artist, song) {
    if (!artist || !song || artist === 'Praise FM U.S.' || song === 'Live') return Promise.resolve(STREAM_LOGO_URL);
    return fetch(`https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(song)}&format=json`)
      .then(res => res.json())
      .then(data => data.track?.album?.image?.find(img => img.size === 'extralarge')?.['#text'] || data.track?.album?.image?.slice(-1)[0]?.['#text'] || STREAM_LOGO_URL)
      .catch(() => STREAM_LOGO_URL);
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
    if (isSpot) {
      coverImg.src = COMMERCIAL_IMAGE_URL;
      coverImg.alt = 'Commercial Break';
    } else if (showImage && imageUrl && imageUrl !== STREAM_LOGO_URL) {
      coverImg.src = imageUrl;
      coverImg.alt = `${currentArtist} - ${currentSong}`;
    } else {
      coverImg.src = STREAM_LOGO_URL;
      coverImg.alt = 'Praise FM U.S. Logo';
    }
  }

  function setupNowPlaying() {
    const eventSource = new EventSource(NOWPLAYING_API);
    eventSource.onmessage = (event) => {
      retryCount = 0;
      try {
        const data = JSON.parse(event.data);
        let streamTitle = (data.streamTitle || '').trim();
        streamTitle = streamTitle.replace(/[^\p{L}\p{N}\-.,!?& ]+/gu, '').replace(/\s+/g, ' ').trim();

        const isSpot = isCommercial(streamTitle) || !streamTitle || streamTitle.length < 3;

        if (isSpot) {
          currentSong = '';
          currentArtist = 'Praise FM U.S.';
          currentTitleEl.textContent = 'Commercial Break';
          currentTitleEl.title = 'Commercial Break';
          toggleCoverDisplay(false, '', true);
          statusText.textContent = 'Commercial Break';
          updateFavoriteButton(); // esconde o botão de favorito
          return;
        }

        const parts = streamTitle.split(' - ').map(p => p.trim()).filter(Boolean);
        const artist = parts[0] || 'Praise FM U.S.';
        const song = parts.length > 1 ? parts.slice(1).join(' - ') : streamTitle;

        currentSong = song;
        currentArtist = artist;

        currentTitleEl.textContent = `${artist} - ${song}`;
        currentTitleEl.title = `${artist} - ${song}`;

        fetchCoverArt(artist, song).then(coverUrl => {
          if (!coverUrl || coverUrl === STREAM_LOGO_URL) {
            toggleCoverDisplay(false, '', false);
            addToHistory(song, artist, STREAM_LOGO_URL);
          } else {
            isInvalidCover(coverUrl).then(isInvalid => {
              const finalUrl = isInvalid ? STREAM_LOGO_URL : coverUrl;
              toggleCoverDisplay(!isInvalid, finalUrl, false);
              addToHistory(song, artist, finalUrl);
            });
          }

          updateFavoriteButton();
          statusText.textContent = `LIVE • Now Playing: ${artist} - ${song}`;
        });

      } catch (err) {
        console.warn('Error parsing metadata', err);
        currentTitleEl.textContent = 'Praise FM U.S. - Live';
        toggleCoverDisplay(false, '', false);
        statusText.textContent = 'LIVE • Live';
      }
    };

    eventSource.onerror = () => {
      console.warn('EventSource disconnected, retrying...');
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
    if (currentSong && currentArtist) toggleFavorite(`${currentArtist} - ${currentSong}`);
  });

  setupNowPlaying();
  updatePlayButton();
  volumeSlider.value = player.volume;
  updateFavoriteButton();
});
