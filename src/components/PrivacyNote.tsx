import React from 'react';
import { buildPath } from '../utils/router';

interface PrivacyNoteProps {
  /** Text colour etc.; preset forms pass their palette colour via `style`. */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * One line under every form that links to the privacyverklaring. A plain
 * link in a new tab, so a half-filled form is never lost.
 */
export const PrivacyNote: React.FC<PrivacyNoteProps> = ({ className = 'text-stone-500', style }) => (
  <p className={`text-xs leading-relaxed m-0 ${className}`} style={style}>
    <a
      href={buildPath({ name: 'privacy' })}
      target="_blank"
      rel="noopener"
      className="underline underline-offset-2 hover:no-underline"
      style={{ color: 'inherit' }}
    >
      Lees hoe we met je gegevens omgaan
    </a>
  </p>
);
