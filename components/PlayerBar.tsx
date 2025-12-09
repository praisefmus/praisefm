
import React from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  VolumeIcon, 
  StartIcon, 
  Rewind20Icon, 
  Forward20Icon, 
  LiveIcon,
  ScheduleIcon 
} from './Icons';
import { TrackInfo, Program } from '../types';
import { images } from '../utils/schedule';
import ProgramImage from './ProgramImage';

interface PlayerBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRewind20: () => void;
  onForward20: () => void;
  onStart: () => void;
  onLive: () => void;
  volume: number;
  muted: boolean;
  onToggleMute: () => void;
  onVolumeChange: (newVolume: number) => void;
  currentTrack: TrackInfo | null;
  currentProgram: Program | null;
  progress: number;
  onOpenSchedule: () => void;
}

const PlayerBar: React.FC<PlayerBarProps> = ({
  isPlaying,
  onTogglePlay,
  onRewind20,
  onForward20,
  onStart,
  onLive,
  volume,
  muted,
  onToggleMute,
  onVolumeChange,
  currentTrack,
  currentProgram,
  progress,
  onOpenSchedule
}) => {

  // Priority: Track Cover (if valid & not default) -> Program Image -> Default
  // This ensures that when a song is playing with artwork, we show it.
  // If the song has no artwork (default), we show the Show/Program logo instead of the generic station logo.
  const isTrackCoverReal = currentTrack?.cover && currentTrack.cover !== images.default;
  
  const displayImage = isTrackCoverReal
    ? currentTrack!.cover 
    : (currentProgram?.img || images.default);

  const displayTitle =
    currentTrack?.title ||
    currentProgram?.name ||
    "Praise FM";

  const displayArtist =
    currentTrack?.artist ||
    currentProgram?.desc ||
    "Praise & Worship";

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] z-50">

      {/* Orange Progress Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
        <div 
          className="h-full bg-praise-orange transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-2 h-auto md:h-20 flex flex-wrap md:flex-nowrap items-center justify-between gap-4">

        {/* Left: Show Info */}
        <div className="flex items-center w-full md:w-[280px] shrink-0 gap-3">
          <div className="relative w-12 h-12 shrink-0 group">
            <div className="w-full h-full rounded-full overflow-hidden border border-gray-100 shadow-sm">
              <ProgramImage 
                src={displayImage} 
                alt="Album Art" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Badge */}
            <div className="absolute -bottom-1 -right-1 bg-black text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              1
            </div>
          </div>

          <div className="flex flex-col overflow-hidden">
            <span className="font-extrabold text-sm md:text-base text-gray-900 truncate">
              {displayTitle}
            </span>
            <span className="text-xs text-gray-500 truncate">
              {displayArtist}
            </span>
          </div>
        </div>

        {/* Center Controls */}
        <div className="order-last md:order-none w-full md:flex-1 flex items-center justify-center gap-2 md:gap-6 pb-2 md:pb-0">

          {/* Volume */}
          <div className="hidden md:flex items-center group relative">
            <button 
              onClick={onToggleMute}
              className="p-2 text-black hover:bg-gray-100 rounded-full transition-colors relative z-20"
              title={muted ? "Unmute" : "Mute"}
            >
              <VolumeIcon muted={muted} className="w-6 h-6" />
            </button>

            <div className="absolute left-8 top-1/2 -translate-y-1/2 bg-white shadow-xl border border-gray-100 rounded-full pl-3 pr-4 py-2 w-[140px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform -translate-x-4 group-hover:translate-x-0 z-10 flex items-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={muted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-praise-orange focus:outline-none focus:ring-2 focus:ring-praise-orange/20"
              />
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center gap-4 md:gap-8">

            {/* Start */}
            <button 
              onClick={onStart}
              className="flex flex-col items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 text-black transition-transform active:scale-95"
              title="Start Over"
            >
              <StartIcon className="w-6 h-6" />
              <span className="text-[9px] font-bold mt-[-2px]">START</span>
            </button>

            {/* Rewind */}
            <button 
              onClick={onRewind20}
              className="flex flex-col items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 text-black transition-transform active:scale-95"
              title="Rewind 20s"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 1 2.83 5.89" />
                <path d="M12 8v4l3 3" />
              </svg>
              <span className="text-[9px] font-bold mt-[-2px]">20</span>
            </button>

            {/* Play / Pause */}
            <button 
              onClick={onTogglePlay}
              className="w-14 h-14 border-2 border-black rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all active:scale-95 group"
            >
              {isPlaying ? (
                <PauseIcon className="w-6 h-6 fill-current" />
              ) : (
                <PlayIcon className="w-6 h-6 fill-current ml-1" />
              )}
            </button>

            {/* Forward */}
            <button 
              onClick={onForward20}
              className="flex flex-col items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 text-black transition-transform active:scale-95"
              title="Forward 20s"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 scale-x-[-1]" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 1 2.83 5.89" />
                <path d="M12 8v4l3 3" />
              </svg>
              <span className="text-[9px] font-bold mt-[-2px]">20</span>
            </button>

            {/* Live Button */}
            <button 
              onClick={onLive}
              className="flex flex-col items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 text-gray-400 hover:text-praise-orange transition-colors active:scale-95"
              title="Go to Live"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 10 10" strokeOpacity="0.2"/>
                <path d="M12 6v6l4 2" />
              </svg>
              <span className="text-[9px] font-bold mt-[-2px] text-praise-blue">LIVE</span>
            </button>

          </div>
        </div>

        {/* Right Tools */}
        <div className="hidden md:flex items-center w-[280px] justify-end gap-2 text-sm font-bold text-gray-800">
          <div className="flex items-center text-praise-blue mr-4">
            <span className="animate-pulse w-2 h-2 rounded-full bg-praise-blue mr-2"></span>
            LIVE
          </div>

          <button 
            onClick={onOpenSchedule}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ScheduleIcon className="w-5 h-5" />
          </button>

          <button className="px-2 py-1 hover:bg-gray-100 rounded transition-colors">
            1<span className="text-xs align-top">x</span>
          </button>
        </div>

        {/* Mobile schedule button */}
        <button 
          onClick={onOpenSchedule}
          className="md:hidden absolute right-4 top-4 p-2"
        >
          <ScheduleIcon className="w-6 h-6" />
        </button>

      </div>
    </div>
  );
};

export default PlayerBar;
