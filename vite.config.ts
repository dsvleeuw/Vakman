import { readFile } from 'node:fs/promises';
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
        const { createFileSiteStorage } = await server.ssrLoadModule('/src/server/storage.ts');
        // Een ingelogde klant: zijn offerte belandt in zijn account, zodat hij
        // hem kan zien en betalen.
        const accountHandler = await server.ssrLoadModule('/src/server/accountHandler.ts');
        const { createFileAccountStorage } = await server.ssrLoadModule('/src/server/storage.ts');
        const account = await accountHandler.accountFromSession(req.headers.cookie ?? null, {
          accounts: createFileAccountStorage(path.resolve(__dirname, '.data')),
        });
        const { paymentDetailsFromEnv } = await server.ssrLoadModule('/src/server/payment.ts');
        const payment = paymentDetailsFromEnv(env);
        const result = await handler.handleLead(body, req.socket.remoteAddress ?? 'dev', {
          env,
          storage,
          ...(account ? { accountId: account.id } : {}),
          // Met de sites kan een aanvraag op een gepubliceerde klantsite naar
          // de vakman zelf gaan, in plaats van naar Klusbaas.
          sites: createFileSiteStorage(path.resolve(__dirname, '.data')),
          siteUrl: env.PUBLIC_SITE_URL || `http://${req.headers.host ?? 'localhost:3000'}`,
          // De betaalgegevens staan in de offerte-PDF en op de offertepagina.
          ...(payment ? { payment } : {}),
        });
        reply(res, result.status, result.body);
      });

      // Het overzicht van Klusbaas: same handler as netlify/functions/admin.mts.
      server.middlewares.use('/api/admin', async (req, res) => {
        if (req.method !== 'POST') return reply(res, 405, { ok: false, error: 'Alleen POST is toegestaan.' });
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let body: unknown;
        try {
          body = JSON.parse(raw);
        } catch {
          return reply(res, 400, { ok: false, error: 'Ongeldige JSON.' });
        }
        const adminHandler = await server.ssrLoadModule('/src/server/adminHandler.ts');
        const { createFileAdminStorage } = await server.ssrLoadModule('/src/server/adminStorage.ts');
        const { createFileAccountStorage, createFileSiteStorage, createFileStorage } =
          await server.ssrLoadModule('/src/server/storage.ts');
        const { createAccountMailer } = await server.ssrLoadModule('/src/server/accountMailer.ts');
        const { paymentDetailsFromEnv } = await server.ssrLoadModule('/src/server/payment.ts');
        const payment = paymentDetailsFromEnv(env);
        const result = await adminHandler.handleAdmin(
          body,
          {
            env: { ADMIN_PASSWORD: env.ADMIN_PASSWORD },
            sessions: createFileAdminStorage(path.resolve(__dirname, '.data')),
            sites: createFileSiteStorage(path.resolve(__dirname, '.data')),
            leads: createFileStorage(path.resolve(__dirname, '.data')),
            accounts: createFileAccountStorage(path.resolve(__dirname, '.data')),
            // Een offerte die Klusbaas zelf schrijft gaat per mail naar de
            // klant, met de PDF erbij en de betaalgegevens.
            sendMail: createAccountMailer(env, (message: string) =>
              server.config.logger.info(message)
            ),
            ...(payment ? { payment } : {}),
            siteUrl: env.PUBLIC_SITE_URL || `http://${req.headers.host ?? 'localhost:3000'}`,
          },
          req.headers.cookie ?? null,
          false
        );
        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json');
        if (result.setCookie) res.setHeader('Set-Cookie', result.setCookie);
        if (result.clearCookie) res.setHeader('Set-Cookie', result.clearCookie);
        res.end(JSON.stringify(result.body));
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

      // Accounts: register, log in, log out. The session lives in an
      // httpOnly cookie; accounts and sessions land in `.data/accounts` and
      // `.data/sessions` in dev.
      server.middlewares.use('/api/account', async (req, res) => {
        if (req.method !== 'POST') return reply(res, 405, { ok: false, error: 'Alleen POST is toegestaan.' });
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let body: unknown;
        try {
          body = JSON.parse(raw);
        } catch {
          return reply(res, 400, { ok: false, error: 'Ongeldige JSON.' });
        }
        const accountHandler = await server.ssrLoadModule('/src/server/accountHandler.ts');
        const { createFileAccountStorage, createFileSiteStorage, createFileStorage } =
          await server.ssrLoadModule('/src/server/storage.ts');
        const { paymentDetailsFromEnv } = await server.ssrLoadModule('/src/server/payment.ts');
        const { createAccountMailer } = await server.ssrLoadModule('/src/server/accountMailer.ts');
        const payment = paymentDetailsFromEnv(env);
        const sendMail = createAccountMailer(env, (message: string) =>
          server.config.logger.info(message)
        );
        const result = await accountHandler.handleAccount(
          body,
          {
            accounts: createFileAccountStorage(path.resolve(__dirname, '.data')),
            sites: createFileSiteStorage(path.resolve(__dirname, '.data')),
            leads: createFileStorage(path.resolve(__dirname, '.data')),
            // De offertes van de klant staan in dezelfde opslag als de aanvragen.
            quotes: createFileStorage(path.resolve(__dirname, '.data')),
            sendMail,
            siteUrl: env.PUBLIC_SITE_URL || `http://${req.headers.host ?? 'localhost:3000'}`,
            ...(payment ? { payment } : {}),
          },
          req.headers.cookie ?? null,
          false
        );
        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json');
        if (result.setCookie) res.setHeader('Set-Cookie', result.setCookie);
        if (result.clearCookie) res.setHeader('Set-Cookie', result.clearCookie);
        res.end(JSON.stringify(result.body));
      });

      // Published sites: publish or read them, with the same handlers the
      // Netlify Function uses. Sites land in `.data/sites` in dev.
      // Foto's van de vakman: opslaan en weer serveren, net als in productie.
      server.middlewares.use('/api/media', async (req, res) => {
        const url = new URL(req.originalUrl ?? req.url ?? '', 'http://localhost');
        const mediaHandler = await server.ssrLoadModule('/src/server/mediaHandler.ts');
        const { createFileMediaStorage } = await server.ssrLoadModule('/src/server/storage.ts');
        const storage = createFileMediaStorage(path.resolve(__dirname, '.data'));

        if (req.method === 'GET') {
          const result = await mediaHandler.handleGetMedia(url.searchParams, { storage });
          if (result.status !== 200 || !result.body) {
            res.statusCode = result.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false }));
            return;
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', result.contentType);
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          res.end(Buffer.from(result.body));
          return;
        }
        if (req.method !== 'POST') {
          return reply(res, 405, { ok: false, error: 'Alleen POST is toegestaan.' });
        }
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let body: unknown;
        try {
          body = JSON.parse(raw);
        } catch {
          return reply(res, 400, { ok: false, error: 'Ongeldige JSON.' });
        }
        const result = await mediaHandler.handleUploadMedia(body, {
          storage,
          clientKey: req.socket.remoteAddress ?? 'dev',
        });
        reply(res, result.status, result.body);
      });

      server.middlewares.use('/api/site', async (req, res) => {
        const url = new URL(req.originalUrl ?? req.url ?? '', 'http://localhost');
        const siteHandler = await server.ssrLoadModule('/src/server/siteHandler.ts');
        const accountHandler = await server.ssrLoadModule('/src/server/accountHandler.ts');
        const { createFileAccountStorage, createFileSiteStorage } = await server.ssrLoadModule(
          '/src/server/storage.ts'
        );
        const storage = createFileSiteStorage(path.resolve(__dirname, '.data'));
        const siteUrl = env.PUBLIC_SITE_URL || `http://${req.headers.host ?? 'localhost:3000'}`;
        // A logged-in customer owns the sites he published.
        const account = await accountHandler.accountFromSession(req.headers.cookie ?? null, {
          accounts: createFileAccountStorage(path.resolve(__dirname, '.data')),
        });

        if (req.method === 'GET') {
          const result = await siteHandler.handleGetSite(
            url.searchParams,
            storage,
            account?.id
          );
          return reply(res, result.status, result.body);
        }
        if (req.method !== 'POST') {
          return reply(res, 405, { ok: false, error: 'Alleen POST is toegestaan.' });
        }
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let body: unknown;
        try {
          body = JSON.parse(raw);
        } catch {
          return reply(res, 400, { ok: false, error: 'Ongeldige JSON.' });
        }
        const { createAccountMailer } = await server.ssrLoadModule('/src/server/accountMailer.ts');
        const result = await siteHandler.handlePublishSite(body, {
          storage,
          siteUrl,
          ...(account ? { ownerId: account.id, ownerEmail: account.email } : {}),
          // Na de eerste publicatie gaat er een mail met het adres en wat er
          // nog moet gebeuren.
          sendMail: createAccountMailer(env, (message: string) => server.config.logger.info(message)),
        });
        reply(res, result.status, result.body);
      });

      // A published site is rendered on the server, exactly like in
      // production: the crawler and the link preview see the site.
      server.middlewares.use('/site', async (req, res) => {
        const url = new URL(req.originalUrl ?? req.url ?? '', 'http://localhost');
        const slug = url.pathname.split('/').filter(Boolean)[1] ?? '';
        const { createFileSiteStorage } = await server.ssrLoadModule('/src/server/storage.ts');
        const { toPublicSite } = await server.ssrLoadModule('/src/server/siteHandler.ts');
        const { renderPublishedSite } = await server.ssrLoadModule('/src/entry-server.tsx');
        const { publishedMeta, publishedHeadTags } = await server.ssrLoadModule(
          '/src/utils/publishedMeta.ts'
        );
        const storage = createFileSiteStorage(path.resolve(__dirname, '.data'));
        const record = await storage.getSite(slug);
        if (!record) {
          res.statusCode = 302;
          res.setHeader('Location', '/');
          return res.end();
        }
        const site = toPublicSite(record);
        const markup = await renderPublishedSite(slug, site);
        const origin = env.PUBLIC_SITE_URL || `http://${req.headers.host ?? 'localhost:3000'}`;
        const meta = publishedMeta(site, origin);
        const { replaceRootMarkup, stripStaticHeadTags } = await server.ssrLoadModule(
          '/src/utils/htmlHead.ts'
        );
        const shell = await readFile(path.resolve(__dirname, 'index.html'), 'utf8');
        const html = replaceRootMarkup(
          stripStaticHeadTags(shell).replace(
            '</head>',
            `  ${publishedHeadTags(meta, origin)}\n  </head>`
          ),
          markup,
          'published'
        ).replace(
          '</body>',
          `  <script>window.__PUBLISHED_SITE__=${JSON.stringify(site)};</script>\n  </body>`
        );
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(html);
      });

      // The sitemap of the published sites, so the dev server behaves like
      // production.
      server.middlewares.use('/sitemap-sites.xml', async (req, res) => {
        const { createFileSiteStorage } = await server.ssrLoadModule('/src/server/storage.ts');
        const { buildPublishedSitesSitemap } = await server.ssrLoadModule('/src/utils/sitemap.ts');
        const storage = createFileSiteStorage(path.resolve(__dirname, '.data'));
        const siteUrl = env.PUBLIC_SITE_URL || `http://${req.headers.host ?? 'localhost:3000'}`;
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.end(buildPublishedSitesSitemap(await storage.listSites(), siteUrl));
      });

      // De klant zegt ja op de offerte: de status wordt "geaccepteerd" en
      // Klusbaas krijgt een mail.
      server.middlewares.use('/api/quote/accept', async (req, res) => {
        if (req.method !== 'POST') return reply(res, 405, { ok: false, error: 'Alleen POST is toegestaan.' });
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let body: unknown;
        try {
          body = JSON.parse(raw);
        } catch {
          return reply(res, 400, { ok: false, error: 'Ongeldige JSON.' });
        }
        const { createAcceptMailer, handleAcceptQuote } = await server.ssrLoadModule(
          '/src/server/acceptQuote.ts'
        );
        const { createFileStorage } = await server.ssrLoadModule('/src/server/storage.ts');
        const result = await handleAcceptQuote(body, {
          storage: createFileStorage(path.resolve(__dirname, '.data')),
          sendMail: createAcceptMailer(env, (message: string) => server.config.logger.info(message)),
          notifyEmail: env.QUOTE_NOTIFY_EMAIL,
          fromEmail: env.QUOTE_FROM_EMAIL,
          siteUrl: env.PUBLIC_SITE_URL || `http://${req.headers.host ?? 'localhost:3000'}`,
          log: (message: string) => server.config.logger.info(message),
        });
        reply(res, result.status, result.body);
      });

      server.middlewares.use('/api/quote', async (req, res) => {
        if (req.method !== 'GET') return reply(res, 405, { ok: false, error: 'Alleen GET is toegestaan.' });
        const { handler, storage } = await load();
        const { paymentDetailsFromEnv } = await server.ssrLoadModule('/src/server/payment.ts');
        const payment = paymentDetailsFromEnv(env);
        const url = new URL(req.originalUrl ?? req.url ?? '', 'http://localhost');
        const result = await handler.handleGetQuote(
          url.searchParams,
          storage,
          payment ? { payment } : {}
        );
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
