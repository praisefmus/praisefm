
import React, { useState, useEffect, useRef, useCallback } from 'react';
import PlayerBar from './components/PlayerBar';
import MainContent from './components/MainContent';
import ShowDetailModal from './components/ShowDetailModal';
import ProgramImage from './components/ProgramImage';
import { getCurrentAndNext, images, getNextPrograms, formatTimeRange, formatProgramName } from './utils/schedule';
import { TrackInfo, ScheduleStatus } from './types';

const STREAM_URL = "https://stream.zeno.fm/hvwifp8ezc6tv";
const METADATA_URL = "https://api.zeno.fm/mounts/metadata/subscribe/hvwifp8ezc6tv";

// Helper to clean strings for better search results
const cleanString = (str: string) => {
  return str
    .replace(/\s*\(.*?\)\s*/g, '')     // Remove content in parens e.g. (Radio Edit)
    .replace(/\s*\[.*?\]\s*/g, '')     // Remove content in brackets
    .replace(/\s*feat\.?.*?$/i, '')    // Remove "feat"
    .replace(/\s*ft\.?.*?$/i, '')      // Remove "ft"
    .trim();
};

// Helper to fetch artwork from iTunes API (Public Apple Music API)
const fetchAlbumCover = async (artist: string, title: string): Promise<string | null> => {
    try {
        // 1. Try Exact Search first (Best quality matches)
        const term = encodeURIComponent(`${artist} ${title}`);
        let response = await fetch(`https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=1`);
        let data = await response.json();

        // 2. If no results, try "Clean" search (Remove 'feat.', brackets, etc.)
        if (!data.results || data.results.length === 0) {
             const cleanArtist = cleanString(artist);
             const cleanTitle = cleanString(title);
             
             // Only retry if cleaning actually changed something
             if (cleanArtist !== artist || cleanTitle !== title) {
                const cleanTerm = encodeURIComponent(`${cleanArtist} ${cleanTitle}`);
                response = await fetch(`https://itunes.apple.com/search?term=${cleanTerm}&media=music&entity=song&limit=1`);
                data = await response.json();
             }
        }

        if (data.results && data.results.length > 0 && data.results[0].artworkUrl100) {
            // Get high-res 600x600 image instead of 100x100
            return data.results[0].artworkUrl100.replace('100x100', '600x600');
        }
    } catch (error) {
        // console.warn("Cover fetch failed", error);
    }
    return null; // Return null on failure so UI knows to use fallback
};

const App: React.FC = () => {
    // Audio Ref
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastTrackKey = useRef<string>("");

    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [schedule, setSchedule] = useState<ScheduleStatus>(getCurrentAndNext());
    const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
    const [recentTracks, setRecentTracks] = useState<TrackInfo[]>([]);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [isShowDetailOpen, setIsShowDetailOpen] = useState(false);

    // Determine Background Image
    // Use Track Cover if available, otherwise Program Image
    const bgImage = currentTrack?.cover || schedule.current?.img || images.default;

    // Initialize Audio
    useEffect(() => {
        audioRef.current = new Audio(STREAM_URL);
        audioRef.current.preload = "none";
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Schedule Loop
    useEffect(() => {
        const timer = setInterval(() => {
            setSchedule(getCurrentAndNext());
        }, 10000); // Check every 10s is sufficient for schedule
        return () => clearInterval(timer);
    }, []);

    // Metadata Stream (SSE)
    useEffect(() => {
        let eventSource: EventSource | null = null;
        try {
            eventSource = new EventSource(METADATA_URL);
            eventSource.onmessage = async (e) => {
                try {
                    const d = JSON.parse(e.data);
                    if (d.streamTitle) {
                        const parts = d.streamTitle.split(" - ");
                        const artist = parts[0]?.trim() || "";
                        const title = parts.slice(1).join(" - ")?.trim() || "";

                        // Filter out ads/commercials if preferred
                        if (title.toLowerCase().includes("commercial") || title.toLowerCase().includes("ad") || !artist || !title) {
                             // Ignore ads
                        } else {
                            const key = `${artist}-${title}`;

                            // Prevent processing if it's the same track we just handled
                            if (key === lastTrackKey.current) return;
                            lastTrackKey.current = key;

                            // Fetch cover art
                            // If it fails, it returns null
                            const cover = await fetchAlbumCover(artist, title);

                            // Check if track changed while we were fetching (rare but possible)
                            if (lastTrackKey.current !== key) return;

                            const newTrack: TrackInfo = {
                                artist,
                                title,
                                cover: cover || "", // Empty string to signify no specific cover found
                                key: key,
                                startTime: Date.now()
                            };

                            setCurrentTrack(newTrack);
                            
                            setRecentTracks(prev => {
                                // Double check for duplicates in the list
                                if (prev.length > 0 && prev[0].key === key) return prev;
                                const updated = [newTrack, ...prev];
                                return updated.slice(0, 4); // Keep max 4
                            });
                        }
                    }
                } catch (err) {
                    console.error("Metadata parse error", err);
                }
            };
        } catch (e) {
            console.error("SSE Error", e);
        }

        return () => {
            if (eventSource) eventSource.close();
        };
    }, []);

    // Controls
    const togglePlay = useCallback(() => {
        if (!audioRef.current) return;
        
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Ignore AbortError (happens when pausing while loading)
                    if (error.name === 'AbortError') return;
                    console.error("Play failed", error);
                    setIsPlaying(false);
                });
            }
        }
    }, [isPlaying]);

    const toggleMute = () => {
        if (!audioRef.current) return;
        const newMuted = !muted;
        audioRef.current.muted = newMuted;
        setMuted(newMuted);
    };

    const handleVolumeChange = (newVolume: number) => {
        if (!audioRef.current) return;
        audioRef.current.volume = newVolume;
        setVolume(newVolume);
        if (newVolume > 0 && muted) {
            setMuted(false);
            audioRef.current.muted = false;
        }
    };

    const handleStart = () => {
        if (!audioRef.current) return;
        audioRef.current.load();
        setIsPlaying(true);
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                if (error.name === 'AbortError') return;
                console.error("Start failed", error);
                setIsPlaying(false);
            });
        }
    };

    const handleRewind = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 20);
        }
    };
    
    const handleForward = () => {
        if (audioRef.current) {
            const duration = audioRef.current.duration || Infinity;
            if (isFinite(duration)) {
                 audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 20);
            }
        }
    };

    return (
        <div className="min-h-screen font-sans text-gray-900 pb-24 relative overflow-hidden bg-white">
            
            {/* Ambient Background Layer */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
                {/* Fallback color */}
                <div className="absolute inset-0 bg-gray-100" />
                
                {/* Colored Blur Base - ProgramImage handles the error for us */}
                <div className="absolute inset-0 opacity-40 transition-opacity duration-1000">
                    <ProgramImage 
                        src={bgImage} 
                        alt="Background" 
                        className="w-full h-full object-cover blur-3xl scale-125"
                    />
                </div>

                {/* Light Overlay to ensure readability */}
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[60px]" />
                
                {/* Gradient Mesh for texture */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-white/90" />
            </div>

            {/* Main Content Wrapper */}
            <div className="relative z-10">
                <MainContent 
                    schedule={schedule} 
                    onPlay={togglePlay}
                    isPlaying={isPlaying}
                    recentTracks={recentTracks}
                    onTitleClick={() => setIsShowDetailOpen(true)}
                />
            </div>
            
            <PlayerBar 
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                onStart={handleStart}
                onRewind20={handleRewind}
                onForward20={handleForward}
                onLive={handleStart}
                volume={volume}
                muted={muted}
                onToggleMute={toggleMute}
                onVolumeChange={handleVolumeChange}
                currentTrack={currentTrack}
                currentProgram={schedule.current}
                progress={schedule.progress}
                onOpenSchedule={() => setIsScheduleOpen(true)}
            />

            {/* Schedule Drawer (Right Sidebar) */}
            {isScheduleOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end items-start">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-fade-in" 
                        onClick={() => setIsScheduleOpen(false)} 
                    />
                    
                    {/* Drawer */}
                    <div className="relative w-full max-w-[420px] h-full bg-white/95 backdrop-blur-xl shadow-2xl animate-slide-in-right flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100/50">
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Schedule</h2>
                            <button 
                                onClick={() => setIsScheduleOpen(false)}
                                className="p-2 -mr-2 text-gray-900 hover:bg-black/5 rounded-full transition-colors"
                                aria-label="Close schedule"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <div className="flex flex-col">
                                {getNextPrograms().map((prog, i) => (
                                     <div key={i} className="flex gap-4 p-4 border-b border-gray-100/50 hover:bg-black/5 transition-colors group">
                                        {/* Text Info */}
                                        <div className="flex-1 min-w-0 pt-1">
                                            <h3 className="font-bold text-gray-900 text-[15px] leading-tight mb-0.5">
                                                {formatProgramName(prog)}
                                            </h3>
                                            <p className="text-[13px] text-gray-600 mb-1.5 leading-snug line-clamp-1">
                                                {prog.desc}
                                            </p>
                                            <p className="text-[13px] font-medium text-praise-orange">
                                                {formatTimeRange(prog)}
                                            </p>
                                        </div>
                                        
                                        {/* Image */}
                                        <div className="shrink-0 w-[72px] h-[72px] rounded-md overflow-hidden shadow-sm">
                                            <ProgramImage 
                                                src={prog.img} 
                                                alt={prog.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                     </div>
                                ))}
                            </div>
                            
                             {/* Spacer for bottom bar */}
                             <div className="h-24"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Show Detail Modal */}
            {isShowDetailOpen && (
                <ShowDetailModal 
                    program={schedule.current} 
                    onClose={() => setIsShowDetailOpen(false)} 
                />
            )}
        </div>
    );
};

export default App;
