import React from 'react';
import type { SectorId } from '../types';
import { ORDER, SECTORS, getUnsplashUrl, computePalette, STYLES } from '../data/tradesData';
import { ImageWithFallback } from './ImageWithFallback';

interface HeroStripProps {
  onSelectSector: (sectorId: SectorId) => void;
}

export const HeroStrip: React.FC<HeroStripProps> = ({ onSelectSector }) => {
  // Duplicate for smooth seamless looping
  const items = [...ORDER, ...ORDER];

  return (
    <div className="overflow-hidden py-4 select-none">
      <div className="animate-marquee-slow flex gap-4 w-max">
        {items.map((sectorId, idx) => {
          const sec = SECTORS[sectorId];
          const pal = computePalette(sec, STYLES[0]);
          const photo = getUnsplashUrl(sec.pool[0], 600);

          return (
            <button
              key={`${sectorId}-${idx}`}
              onClick={() => onSelectSector(sectorId)}
              className="group relative w-[240px] sm:w-[280px] md:w-[320px] aspect-[3/4] rounded-2xl overflow-hidden shrink-0 bg-stone-200 border-0 p-0 cursor-pointer shadow-sm text-left transition-transform duration-300 hover:scale-[1.02]"
              aria-label={`Bekijk stijlen voor ${sec.name}`}
            >
              <ImageWithFallback
                src={photo}
                alt={sec.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              
              <div className="absolute left-3.5 bottom-3.5 right-3.5 flex items-center justify-between gap-2">
                <span className="h-9 px-3.5 rounded-full bg-white/95 backdrop-blur-sm text-stone-900 flex items-center gap-2 text-sm font-bold shadow-sm">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: pal.accent }}
                  />
                  {sec.name}
                </span>
                <span className="text-white/80 text-xs font-mono font-medium">
                  5 stijlen
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
