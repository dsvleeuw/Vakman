import React from 'react';
import { BRAND_COLORS, BRAND_MARK, BRAND_WORDMARK } from '../data/brandMark';

interface LogoProps {
  /** `dark` = stone ink for light backgrounds; `light` for dark backgrounds. */
  tone?: 'dark' | 'light';
  /** Only the beeldmerk (K + winkelhaak), e.g. for tight spaces. */
  markOnly?: boolean;
  /** Sets the height; width follows the aspect ratio. Default `h-9`. */
  className?: string;
  /** Accessible name. Pass `null` when a parent link already names it. */
  label?: string | null;
}

/**
 * The Klusbaas logo as inline SVG: the K-shaped stem plus winkelhaak and
 * the outlined "Klusbaas" woordmerk. Rendered from the same path data as
 * `public/brand/*.svg`, so it looks identical without waiting for a font.
 */
export const Logo: React.FC<LogoProps> = ({
  tone = 'dark',
  markOnly = false,
  className = 'h-9',
  label = 'Klusbaas',
}) => {
  const ink = tone === 'dark' ? BRAND_COLORS.ink : BRAND_COLORS.inkLight;
  const amber = tone === 'dark' ? BRAND_COLORS.amber : BRAND_COLORS.amberLight;
  const width = markOnly ? 64 : BRAND_WORDMARK.width;
  const a11y = label
    ? { role: 'img', 'aria-label': label }
    : { 'aria-hidden': true as const, focusable: 'false' as const };

  return (
    <svg
      viewBox={`0 0 ${width} 64`}
      className={`${className} w-auto shrink-0 block`}
      xmlns="http://www.w3.org/2000/svg"
      {...a11y}
    >
      <path fill={ink} d={BRAND_MARK.stem} />
      <path fill={amber} d={BRAND_MARK.square} />
      {!markOnly && <path fill={ink} d={BRAND_WORDMARK.path} />}
    </svg>
  );
};
