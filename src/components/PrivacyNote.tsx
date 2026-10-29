import React from 'react';
import { buildPath } from '../utils/router';

interface PrivacyNoteProps {
  /** Text colour etc.; preset forms pass their palette colour via `style`. */
  className?: string;
  style?: React.CSSProperties;
  /** Where the data from this form goes, in plain words. */
  note?: string;
  /**
   * Where the link points. On a published site this is the privacy
   * statement of that site, not the one of Klusbaas.
   */
  href?: string;
}

/**
 * One line under every form that links to the privacyverklaring. A plain
 * link in a new tab, so a half-filled form is never lost.
 */
export const PrivacyNote: React.FC<PrivacyNoteProps> = ({
  className = 'text-stone-500',
  style,
  note,
  href,
}) => (
  <p className={`text-xs leading-relaxed m-0 ${className}`} style={style}>
    {note ? <>{note} </> : null}
    <a
      href={href ?? buildPath({ name: 'privacy' })}
      target="_blank"
      rel="noopener"
      className="underline underline-offset-2 hover:no-underline"
      style={{ color: 'inherit' }}
    >
      Lees hoe we met je gegevens omgaan
    </a>
  </p>
);
