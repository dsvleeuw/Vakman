import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

/**
 * Serve POST /api/send-quote during `vite dev` with the same handler the
 * Netlify Function uses, so the wizard's quote e-mail works locally too.
 */
function quoteApiDevServer(env: Record<string, string>): Plugin {
  return {
    name: 'klusbaas-quote-api',
    configureServer(server) {
      server.middlewares.use('/api/send-quote', async (req, res) => {
        const reply = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };
        if (req.method !== 'POST') return reply(405, { ok: false, error: 'Alleen POST is toegestaan.' });
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let body: unknown;
        try {
          body = JSON.parse(raw);
        } catch {
          return reply(400, { ok: false, error: 'Ongeldige JSON.' });
        }
        const { handleSendQuote } = await server.ssrLoadModule('/src/server/sendQuote.ts');
        const result = await handleSendQuote(body, env);
        reply(result.status, result.body);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), quoteApiDevServer(env)],
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
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
