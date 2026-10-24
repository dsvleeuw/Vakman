import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

/**
 * Serve POST /api/lead and GET /api/quote during `vite dev` with the same
 * handlers the Netlify Functions use. Quotes and leads land in `.data/`
 * (gitignored) instead of Netlify Blobs.
 */
function leadApiDevServer(env: Record<string, string>): Plugin {
  return {
    name: 'klusbaas-lead-api',
    configureServer(server) {
      const load = async () => {
        const handler = await server.ssrLoadModule('/src/server/leadHandler.ts');
        const { createFileStorage } = await server.ssrLoadModule('/src/server/storage.ts');
        return { handler, storage: createFileStorage(path.resolve(__dirname, '.data')) };
      };
      const reply = (res: import('http').ServerResponse, status: number, body: unknown) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(body));
      };

      server.middlewares.use('/api/lead', async (req, res) => {
        if (req.method !== 'POST') return reply(res, 405, { ok: false, error: 'Alleen POST is toegestaan.' });
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let body: unknown;
        try {
          body = JSON.parse(raw);
        } catch {
          return reply(res, 400, { ok: false, error: 'Ongeldige JSON.' });
        }
        const { handler, storage } = await load();
        const result = await handler.handleLead(body, req.socket.remoteAddress ?? 'dev', {
          env,
          storage,
          siteUrl: env.PUBLIC_SITE_URL || `http://${req.headers.host ?? 'localhost:3000'}`,
        });
        reply(res, result.status, result.body);
      });

      // Newsletter (double opt-in): same handlers as netlify/functions/newsletter.mts,
      // subscribers in `.data/newsletter` instead of the Blobs store.
      server.middlewares.use('/api/newsletter', async (req, res) => {
        const url = new URL(req.originalUrl ?? req.url ?? '', 'http://localhost');
        const nl = await server.ssrLoadModule('/src/server/newsletterHandler.ts');
        const { createFileNewsletterStorage } = await server.ssrLoadModule('/src/server/newsletterStorage.ts');
        const deps = {
          env,
          storage: createFileNewsletterStorage(path.resolve(__dirname, '.data')),
          siteUrl: env.PUBLIC_SITE_URL || `http://${req.headers.host ?? 'localhost:3000'}`,
        };
        if (url.pathname === '/api/newsletter/confirm') {
          const result = await nl.handleNewsletterConfirm(url.searchParams.get('token'), deps);
          if (url.searchParams.get('format') === 'json') return reply(res, 200, result);
          res.statusCode = 303;
          res.setHeader('Location', result.location);
          return res.end();
        }
        if (req.method !== 'POST') return reply(res, 405, { ok: false, error: 'Alleen POST is toegestaan.' });
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let body: unknown;
        try {
          body = JSON.parse(raw);
        } catch {
          body = undefined;
        }
        const result =
          url.pathname === '/api/newsletter/unsubscribe'
            ? await nl.handleNewsletterUnsubscribe(body, deps)
            : await nl.handleNewsletterSignup(body, req.socket.remoteAddress ?? 'dev', deps);
        reply(res, result.status, result.body);
      });

      server.middlewares.use('/api/quote', async (req, res) => {
        if (req.method !== 'GET') return reply(res, 405, { ok: false, error: 'Alleen GET is toegestaan.' });
        const { handler, storage } = await load();
        const url = new URL(req.originalUrl ?? req.url ?? '', 'http://localhost');
        const result = await handler.handleGetQuote(url.searchParams, storage);
        if (result.kind === 'pdf') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${result.filename}"`);
          return res.end(Buffer.from(result.pdf));
        }
        reply(res, result.status, result.body);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), leadApiDevServer(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Allow the e2b/AI Studio preview proxy host to reach the dev server.
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // Quotes/leads written to .data/ during dev must not trigger reloads.
      watch: process.env.DISABLE_HMR === 'true' ? null : { ignored: ['**/.data/**'] },
    },
  };
});
