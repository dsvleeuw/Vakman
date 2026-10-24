import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const container = document.getElementById('root')!;
const prerendered = container.hasChildNodes();

/**
 * Build-time prerendering writes the rendered markup into #root. When that
 * happened we hydrate (React reuses the HTML instead of replacing it) and
 * preload the lazy route chunk first so the hydration matches exactly.
 */
async function boot() {
  if (prerendered) {
    try {
      if (container.dataset.route === 'site') await import('./components/SiteView');
      if (container.dataset.route === 'components') await import('./components/ComponentGallery');
    } catch {
      // A failed preload is not fatal: hydration can still suspend.
    }
    hydrateRoot(container, <App />);
    return;
  }

  createRoot(container).render(<App />);
}

void boot();
