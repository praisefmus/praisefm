"use client";

import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [currentTrack, setCurrentTrack] = useState({
    title: '',
    artist: '',
    cover: '/logopraisefm.webp', // Logo padrão
  });
  const [recentTracks, setRecentTracks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulação de stream
  const streamUrl = "https://radio.streemlion.com:18008/;";

  useEffect(() => {
    const audio = new Audio(streamUrl);
    audio.autoplay = true;

    const fetchMetadata = async () => {
      try {
        const response = await fetch('/api/now-playing'); // Substitua pela sua API
        if (response.ok) {
          const data = await response.json();
          if (data.track) {
            setCurrentTrack({
              title: data.track.title || 'Loading...',
              artist: data.track.artist || '',
              cover: data.track.cover || '/logopraisefm.webp',
            });
            setRecentTracks(prev => [data.track, ...prev.slice(0, 9)]);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar metadados:", error);
      }
    };

    fetchMetadata();
    const interval = setInterval(fetchMetadata, 10000);

    return () => clearInterval(interval);
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      document.querySelector('audio').pause();
    } else {
      document.querySelector('audio').play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="container">
      <Head>
        <title>Praise FM U.S.</title>
        <meta name="description" content="Live Christian Worship Radio" />
      </Head>

      <main className="main">
        <header className="header">
          <h1>Praise FM U.S.</h1>
          <p>Praise & Worship</p>
        </header>

        <div className="player">
          <div className="album-art-container">
            <img
              src={currentTrack.cover}
              alt="Current song"
              className="album-art"
            />
          </div>

          <div className="track-info">
            <div className="live-indicator">
              <span className="live-dot"></span> LIVE
            </div>
            <h2>{isLoading ? 'Loading...' : currentTrack.title}</h2>
            <p>{isLoading ? '' : currentTrack.artist}</p>
          </div>

          <div className="controls">
            <button onClick={togglePlay} className="play-btn">
              {isPlaying ? '⏸️' : '▶️'}
            </button>
          </div>
        </div>

        <div className="recently-played">
          <h3>Recently Played</h3>
          {recentTracks.length > 0 ? (
            <ul>
              {recentTracks.map((track, index) => (
                <li key={index}>
                  {track.artist} — {track.title}
                </li>
              ))}
            </ul>
          ) : (
            <p>No songs yet...</p>
          )}
        </div>

        <audio src={streamUrl} style={{ display: 'none' }} />
      </main>
    </div>
  );
}
