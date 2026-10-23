import React, { useState } from 'react';
import type { BeforeAfterProject } from '../types';
import { ImageWithFallback } from './ImageWithFallback';

interface BeforeAfterSliderProps {
  project: BeforeAfterProject;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ project }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number, rect: DOMRect) => {
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX, rect);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      handleMove(e.clientX, rect);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden select-none cursor-ew-resize border border-stone-200 shadow-md"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* After Image (Full width background) */}
        <ImageWithFallback
          src={project.afterImg}
          alt={`Na verbouwing - ${project.title}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <span className="absolute right-4 top-4 z-10 px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-sm">
          NA VERBOUWING
        </span>

        {/* Before Image (Clipped overlay) */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <div className="absolute inset-0 w-full h-full">
            <ImageWithFallback
              src={project.beforeImg}
              alt={`Voor verbouwing - ${project.title}`}
              className="w-full h-full object-cover max-w-none"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <span className="absolute left-4 top-4 z-10 px-3 py-1 rounded-full bg-stone-900/90 text-white font-bold text-xs shadow-sm">
            VOORAF
          </span>
        </div>

        {/* Slider Handle Line */}
        <div
          className="absolute inset-y-0 w-1 bg-white shadow-2xl z-20 flex items-center justify-center pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="w-9 h-9 rounded-full bg-white text-stone-900 shadow-xl border-2 border-stone-900 flex items-center justify-center font-bold text-xs">
            ↔
          </div>
        </div>
      </div>

      <div className="flex justify-between items-baseline gap-2">
        <h4 className="text-lg font-bold text-stone-900 m-0">{project.title}</h4>
        <span className="font-mono text-xs text-stone-500">{project.location}</span>
      </div>
      <p className="text-sm text-stone-600 m-0">{project.description}</p>
    </div>
  );
};
