  function setupNowPlaying() {
    const eventSource = new EventSource(NOWPLAYING_API);
    eventSource.onmessage = (event) => {
      retryCount = 0;
      try {
        const data = JSON.parse(event.data);
        let streamTitle = (data.streamTitle || '').trim();
        streamTitle = streamTitle.replace(/[^\p{L}\p{N}\-.,!?& ]+/gu, '').replace(/\s+/g, ' ').trim();

        // === IGNORA comerciais, vinhetas e títulos que repetem o nome da rádio ===
        const isSpot = isCommercial(streamTitle) || !streamTitle || streamTitle.length < 3;
        const isStationJingle = streamTitle.toLowerCase().includes('praise fm');

        if (isSpot || isStationJingle) {
          currentSong = '';
          currentArtist = 'Praise FM U.S.';
          currentTitleEl.textContent = 'Praise FM U.S.';
          currentTitleEl.title = 'Praise FM U.S.';
          toggleCoverDisplay(false, '', false);
          statusText.textContent = 'LIVE • Praise FM U.S.';
          updateFavoriteButton();
          return; // não adiciona nada no histórico
        }

        // === MÚSICA NORMAL ===
        const parts = streamTitle.split(' - ').map(p => p.trim()).filter(Boolean);
        const artist = parts[0] || 'Praise FM U.S.';
        const song = parts.length > 1 ? parts.slice(1).join(' - ') : streamTitle;

        // Evita adicionar música se for muito parecida com o nome da rádio
        if (artist.toLowerCase().includes('praise fm') || song.toLowerCase().includes('praise fm')) {
          return;
        }

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
        currentTitleEl.textContent = 'Praise FM U.S.';
        toggleCoverDisplay(false, '', false);
        statusText.textContent = 'LIVE • Praise FM U.S.';
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
