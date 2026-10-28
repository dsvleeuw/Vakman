import { accountFromSession } from '../../src/server/accountHandler';
import { handleGetSite, handlePublishSite } from '../../src/server/siteHandler';
import { createBlobAccountStorage, createBlobSiteStorage } from '../../src/server/storage';

/**
 * POST /api/site: publish a site or change a published one.
 * GET  /api/site?slug=…[&token=…]: read a published site.
 *
 * A customer who is logged in owns the sites he published, so he can change
 * them without the management link. The link keeps working for sites that
 * were published before accounts existed.
 */
export default async (req: Request): Promise<Response> => {
  const storage = await createBlobSiteStorage();
  const siteUrl = process.env.PUBLIC_SITE_URL || process.env.URL || new URL(req.url).origin;
  const account = await accountFromSession(req.headers.get('cookie'), {
    accounts: await createBlobAccountStorage(),
  });

  if (req.method === 'GET') {
    const params = new URL(req.url).searchParams;
    const result = await handleGetSite(params, storage, account?.id);
    return Response.json(result.body, { status: result.status });
  }

  if (req.method !== 'POST') {
    return Response.json({ ok: false, error: 'Alleen POST is toegestaan.' }, { status: 405 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'Ongeldige JSON.' }, { status: 400 });
  }

  const result = await handlePublishSite(body, {
    storage,
    siteUrl,
    ...(account ? { ownerId: account.id } : {}),
  });
  return Response.json(result.body, { status: result.status });
};

export const config = { path: '/api/site' };
