
import React from 'react';
import { Program } from '../types';
import { formatProgramName, formatTimeRange, images } from '../utils/schedule';
import ProgramImage from './ProgramImage';

interface ShowDetailModalProps {
  program: Program | null;
  onClose: () => void;
}

const ShowDetailModal: React.FC<ShowDetailModalProps> = ({ program, onClose }) => {
  if (!program) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Hero Image */}
        <div className="relative h-64 w-full">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-[1]" />
          <ProgramImage 
            src={program.img || images.default} 
            alt={program.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 z-[2]">
            <div className="inline-block px-2 py-1 bg-praise-orange text-white text-xs font-bold rounded mb-2 uppercase tracking-wider">
              {formatTimeRange(program)}
            </div>
            <h2 className="text-3xl font-black text-white leading-none">
              {formatProgramName(program)}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">About the Show</h3>
          <p className="text-gray-700 text-lg leading-relaxed">
            {program.desc}
          </p>
          
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ShowDetailModal;
