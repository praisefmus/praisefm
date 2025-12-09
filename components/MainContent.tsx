
import React from 'react';
import { ScheduleStatus, Program, TrackInfo } from '../types';
import { formatProgramName, formatTimeRange, images } from '../utils/schedule';
import { PlayIcon, PauseIconFilled, AppleIcon, AndroidIcon } from './Icons';
import ProgramImage from './ProgramImage';

interface MainContentProps {
    schedule: ScheduleStatus;
    onPlay: () => void;
    isPlaying: boolean;
    recentTracks: TrackInfo[];
    onTitleClick: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ schedule, onPlay, isPlaying, recentTracks, onTitleClick }) => {
    const { current, next1, next2, progress } = schedule;

    return (
        <div className="w-full max-w-6xl mx-auto px-5 pt-10 pb-40">
            
            {/* Station Header - Left aligned on desktop to match BBC */}
            <div className="mb-8 text-center md:text-left max-w-4xl">
                <h1 className="text-4xl font-black text-gray-900 mb-1 tracking-tight drop-shadow-sm">Praise FM</h1>
                <p className="text-gray-600 text-lg font-medium">UNITED STATES</p>
            </div>

            {/* Main Hero Section: Flex Row on Desktop */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 mb-10">
                
                {/* Left Column: Circle Visualizer */}
                <div className="relative shrink-0">
                    <div className="relative w-[70vw] h-[70vw] max-w-[320px] max-h-[320px]">
                        {/* Conic Gradient Border - ORANGE */}
                        <div 
                            className="absolute inset-0 rounded-full shadow-2xl"
                            style={{
                                background: `conic-gradient(#f54900 ${progress}%, #e5e7eb ${progress}%)`,
                                transform: 'rotate(-90deg)' // Optional: start from top
                            }}
                        />
                        {/* White spacer for ring effect */}
                        <div className="absolute inset-[4px] rounded-full bg-white"></div>
                        
                        {/* Image */}
                        <div className="absolute inset-[8px] rounded-full overflow-hidden bg-gray-100 cursor-pointer group shadow-inner" onClick={onTitleClick}>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-10 flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 text-white font-bold bg-black/50 px-3 py-1 rounded-full text-xs transition-opacity backdrop-blur-sm">View Info</span>
                            </div>
                            <ProgramImage 
                                src={current?.img || images.default} 
                                alt="Current Show" 
                                className="w-full h-full object-cover"
                                isHero={true}
                            />
                        </div>

                        {/* Large '1' Badge - Bottom Right */}
                        <div className="absolute bottom-2 right-2 w-20 h-20 bg-black text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg z-10">
                            <span className="font-black text-4xl tracking-tighter">1</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Text & Controls */}
                <div className="flex-1 text-center md:text-left pt-2 md:pt-4">
                    {/* Live Badge */}
                    <div className="flex items-center justify-center md:justify-start gap-2 text-praise-orange font-bold text-sm tracking-widest uppercase mb-3 drop-shadow-sm">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-praise-orange opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-praise-orange"></span>
                        </span>
                        LIVE &bull; {formatTimeRange(current)}
                    </div>

                    {/* Show Title - Clickable */}
                    <h2 
                        onClick={onTitleClick}
                        className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-2 leading-tight cursor-pointer hover:underline decoration-4 decoration-praise-orange underline-offset-4 transition-all drop-shadow-sm"
                        title="View Show Details"
                    >
                        {formatProgramName(current)}
                    </h2>
                    
                    {/* Host / Description */}
                    <p className="text-xl text-gray-700 mb-8 font-medium">
                        {current?.desc || "Praise & Worship Music"}
                    </p>

                    {/* Big Play Button - Orange */}
                    <button 
                        onClick={onPlay}
                        className={`flex items-center justify-center gap-3 w-full md:w-64 h-14 rounded-full text-lg font-bold shadow-lg shadow-praise-orange/30 transition-all active:scale-95 hover:brightness-110 hover:-translate-y-0.5 ${
                            isPlaying 
                            ? 'bg-praise-orange text-white' 
                            : 'bg-praise-orange text-white'
                        }`}
                    >
                        {isPlaying ? (
                            <>
                                <PauseIconFilled className="w-6 h-6 fill-current" />
                                Pause
                            </>
                        ) : (
                            <>
                                <PlayIcon className="w-6 h-6 fill-current" />
                                Listen Live
                            </>
                        )}
                    </button>
                    
                     {/* Support Link - Subtle Link as requested */}
                    <div className="mt-6">
                         <a 
                            href="https://donate.stripe.com/bJe8wQ09o1zG5W78CO33W00" 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-praise-orange transition-colors"
                        >
                            <img 
                                src={images.donate} 
                                alt="" 
                                className="h-5 w-auto object-contain opacity-80"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            <span>Support Praise FM</span>
                         </a>
                    </div>
                </div>
            </div>

             {/* Get App Banner */}
            <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-12 shadow-xl border border-white/10">
                <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold text-white mb-2">Get the Praise FM App</h3>
                    <p className="text-gray-400 text-sm">Listen to the best worship music anywhere, anytime.</p>
                </div>
                <div className="flex gap-4">
                     <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-bold text-sm shadow-sm">
                        <AppleIcon className="w-5 h-5" />
                        App Store
                    </button>
                    <button className="flex items-center gap-2 bg-transparent border border-white/30 text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-bold text-sm">
                        <AndroidIcon className="w-5 h-5" />
                        Google Play
                    </button>
                </div>
            </div>

            {/* Up Next Section */}
            <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 md:p-8 text-left border border-white/50 shadow-sm mb-10">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">Up Next</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[next1, next2].map((prog: Program | null, i) => (
                        prog && (
                            <div key={i} className="flex items-start gap-4 group cursor-pointer p-2 rounded-xl hover:bg-white/50 transition-colors">
                                <div className="relative overflow-hidden rounded-lg shrink-0 shadow-sm w-24 h-24">
                                    <ProgramImage 
                                        src={prog.img || images.default} 
                                        alt={prog.name} 
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                </div>
                                <div className="pt-1">
                                    <div className="text-xs font-bold text-praise-orange uppercase mb-1 flex items-center gap-1">
                                         <span className="w-1.5 h-1.5 rounded-full bg-praise-orange"></span>
                                        {formatTimeRange(prog)}
                                    </div>
                                    <div className="font-bold text-gray-900 text-lg leading-tight mb-1 group-hover:underline decoration-2 decoration-gray-900 underline-offset-2">
                                        {formatProgramName(prog)}
                                    </div>
                                    <div className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                        {prog.desc}
                                    </div>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </div>

            {/* Recent Tracks Section */}
            {recentTracks.length > 0 && (
                <div className="text-left max-w-6xl mx-auto mt-16 bg-white/60 backdrop-blur-md rounded-xl p-6 border border-white/50 shadow-sm">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">Recent Tracks</h3>
                    <div className="border-t border-gray-200/50">
                        {/* Table Header */}
                        <div className="flex items-center py-3 text-sm font-bold text-gray-500 uppercase tracking-wider">
                            <div className="w-12 text-center">#</div>
                            <div className="flex-1 px-4">Track</div>
                            <div className="flex-1 hidden md:block px-4">Artist</div>
                        </div>
                        
                        {/* List Items */}
                        <div className="flex flex-col">
                            {recentTracks.map((track, index) => (
                                <div key={track.key + index} className="flex items-center py-4 border-t border-gray-100/50 group hover:bg-white/50 transition-colors rounded-lg px-2 -mx-2">
                                    <div className="w-12 text-center text-gray-400 text-sm font-medium">
                                        {index + 1}.
                                    </div>
                                    <div className="flex-1 flex items-center gap-4 min-w-0 px-4">
                                        <div className="w-12 h-12 shrink-0 rounded-md overflow-hidden shadow-sm">
                                            <ProgramImage 
                                                src={track.cover || images.default} 
                                                alt={track.title} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <span className="font-bold text-gray-900 truncate">
                                            {track.title}
                                            <span className="block md:hidden text-xs text-gray-500 mt-1 font-normal truncate">{track.artist}</span>
                                        </span>
                                    </div>
                                    <div className="flex-1 hidden md:block text-gray-600 truncate px-4 font-medium">
                                        {track.artist}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MainContent;
