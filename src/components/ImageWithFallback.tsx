import React, { useState } from 'react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  fallbackIcon,
  style,
  ...rest
}) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (error) {
    return (
      <div
        className={`w-full h-full min-h-[140px] flex flex-col items-center justify-center p-4 text-center bg-stone-200 text-stone-600 ${className}`}
        style={style}
        role="img"
        aria-label={alt}
      >
        {fallbackIcon || (
          <svg
            className="w-8 h-8 opacity-40 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
        <span className="text-xs font-semibold opacity-75 line-clamp-1">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      onLoad={() => setLoaded(true)}
      className={`${className} ${!loaded ? 'opacity-90' : 'opacity-100'} transition-opacity duration-300`}
      style={style}
      {...rest}
    />
  );
};
