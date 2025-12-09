import React, { useState, useEffect } from 'react';
import { images } from '../utils/schedule';

interface ProgramImageProps {
  src?: string;
  alt: string;
  className?: string;
  isHero?: boolean;
}

// Order of priority for extension checking
const EXTENSIONS = ['.webp', '.png', '.jpg', '.jpeg'];

const ProgramImage: React.FC<ProgramImageProps> = ({ src, alt, className = "", isHero = false }) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const [attemptedPaths, setAttemptedPaths] = useState<Set<string>>(new Set());
  const [hasError, setHasError] = useState(false);

  // Reset state when prop changes
  useEffect(() => {
    setImgSrc(src);
    setAttemptedPaths(new Set(src ? [src] : []));
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (hasError) return; 

    const currentSrc = imgSrc || '';
    
    // 1. If we are already displaying the fallback android icon and it failed, give up.
    if (currentSrc.includes('android-chrome-192x192.png')) {
        setHasError(true);
        return;
    }

    // 2. If we are displaying the default logo and it failed, try the android icon as last resort.
    if (images.default && currentSrc === images.default) {
        const fallback = '/android-chrome-192x192.png';
        setImgSrc(fallback);
        return;
    }

    // 3. Extension Cycling & Path Correction Logic
    // Clean the current path
    let cleanSrc = currentSrc.split('?')[0];
    
    // If path has /images/, try removing it first (User moved images to root)
    if (cleanSrc.startsWith('/images/')) {
        const rootPath = cleanSrc.replace('/images/', '/');
        if (!attemptedPaths.has(rootPath)) {
            setAttemptedPaths(prev => new Set(prev).add(rootPath));
            setImgSrc(rootPath);
            return;
        }
        cleanSrc = rootPath; // Continue processing with the root path
    } else if (cleanSrc.startsWith('images/')) {
         const rootPath = cleanSrc.replace('images/', '/');
         if (!attemptedPaths.has(rootPath)) {
            setAttemptedPaths(prev => new Set(prev).add(rootPath));
            setImgSrc(rootPath);
            return;
        }
        cleanSrc = rootPath;
    }

    // Extract base name and extension
    const match = cleanSrc.match(/^(.*)(\.(webp|png|jpg|jpeg))$/i);
    
    if (match) {
        const basePath = match[1]; // e.g. /carpoollogo
        const currentExt = match[2].toLowerCase(); // e.g. .png

        // Try next extension
        for (const ext of EXTENSIONS) {
            if (ext === currentExt) continue; // Skip current
            
            const candidate = `${basePath}${ext}`;
            if (!attemptedPaths.has(candidate)) {
                setAttemptedPaths(prev => new Set(prev).add(candidate));
                setImgSrc(candidate);
                return;
            }
        }
    }

    // 4. If all smart attempts fail, try the configured default image
    if (images.default && !attemptedPaths.has(images.default)) {
        setAttemptedPaths(prev => new Set(prev).add(images.default));
        setImgSrc(images.default);
        return;
    }

    // 5. Final Fallback
    const finalFallback = '/android-chrome-192x192.png';
    if (!attemptedPaths.has(finalFallback)) {
        setImgSrc(finalFallback);
    } else {
        setHasError(true);
    }
  };

  // Render Visual Placeholder if everything fails
  if (hasError || !imgSrc) {
    const divClass = className.replace('object-cover', '').trim();
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 w-full h-full overflow-hidden relative ${divClass}`} title={alt || "Image failed to load"}>
         {/* Subtle pattern background */}
         <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black to-transparent" />
         
         <div className="bg-white rounded-full p-3 shadow-sm z-10">
             <svg viewBox="0 0 24 24" className={isHero ? "w-10 h-10 text-gray-300" : "w-5 h-5 text-gray-300"} fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
             </svg>
         </div>
         {isHero && <span className="mt-2 text-[10px] font-bold tracking-widest uppercase text-gray-400 z-10">Praise FM</span>}
      </div>
    );
  }

  return (
    <img 
      src={imgSrc} 
      alt={alt} 
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
};

export default ProgramImage;