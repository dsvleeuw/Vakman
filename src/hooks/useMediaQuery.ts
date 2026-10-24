import { useEffect, useState } from 'react';

/**
 * SSR-safe media query hook. Used to avoid mounting the (large) live site
 * preview on phones where it is collapsed by default.
 */
export function useMediaQuery(query: string, fallback = false): boolean {
  // Always start from `fallback` so the first client render matches the
  // prerendered markup; the effect corrects it immediately after hydration.
  const [matches, setMatches] = useState(fallback);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const list = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(list.matches);
    list.addEventListener('change', handleChange);
    return () => list.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}
