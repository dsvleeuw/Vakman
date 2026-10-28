import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Eye, GripVertical, Plus, Trash2, X } from 'lucide-react';
import type { BlockId, ContentBlockId, SectorId, SiteContent, StyleId } from '../../types';
import { BLOCKS, getBlock, isContentBlockId } from '../../data/blocks';
import { ORDER, SECTORS, STYLES, buildActiveSite } from '../../data/tradesData';
import { DEFAULT_SECTOR, DEFAULT_STYLE_ID, styleIndexFromId } from '../../utils/router';
import {
  applySiteContent,
  moveBlock,
  moveBlockTo,
  sanitizeSiteContent,
  setBlockEnabled,
} from '../../utils/siteContent';
import { fetchPublishedSite, publishSite } from '../../utils/siteClient';
import { fetchAccount, type AccountInfo } from '../../utils/accountClient';
import {
  loadPublishedLink,
  savePublishedLink,
  useSiteContent,
} from '../../hooks/useSiteContent';
import { track } from '../../utils/analytics';
import { RouteLink } from '../RouteLink';
import { SiteView } from '../SiteView';
import { BlockForm, type AnyBlockContent } from './BlockForm';
import { TextAreaField, TextField } from './Field';

export interface SiteEditorProps {
  sector?: SectorId;
  styleId?: StyleId;
  /** A published site that is being changed: `/mijn-site/<slug>?token=…`. */
  slug?: string;
  /** The management token of that published site. */
  token?: string;
}

type PanelTab = 'gegevens' | 'tekst' | 'blokken';

const TABS: { id: PanelTab; label: string }[] = [
  { id: 'blokken', label: 'Blokken' },
  { id: 'gegevens', label: 'Gegevens' },
  { id: 'tekst', label: 'Tekst' },
];

/**
 * The screen where a craftsman fills in his own website: his details, his
 * words and the blocks he wants on the page, with the result right next to it.
 */
export const SiteEditor: React.FC<SiteEditorProps> = ({
  sector: initialSector,
  styleId: initialStyleId,
  slug: initialSlug,
  token: initialToken,
}) => {
  const [sector, setSector] = useState<SectorId>(initialSector ?? DEFAULT_SECTOR);
  const [styleId, setStyleId] = useState<StyleId>(initialStyleId ?? DEFAULT_STYLE_ID);
  const { content: localContent, setContent: setLocalContent } = useSiteContent(sector, styleId);
  const [tab, setTab] = useState<PanelTab>('blokken');
  const [openBlock, setOpenBlock] = useState<ContentBlockId | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [device, setDevice] = useState<'desktop' | 'mobiel'>('desktop');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const dragId = useRef<BlockId | null>(null);

  // A published site lives on the server: that is the version visitors see.
  // Until it is published, the site is a draft in the browser of the
  // craftsman.
  const [published, setPublished] = useState<{
    slug: string;
    token: string;
    url: string;
    manageUrl: string;
  } | null>(null);
  const [remoteContent, setRemoteContent] = useState<SiteContent | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishDone, setPublishDone] = useState(false);
  // Whether the craftsman is logged in: a logged-in customer owns the site
  // he publishes and finds it back under /mijn-account.
  const [account, setAccount] = useState<AccountInfo | null>(null);

  const content = remoteContent ?? localContent;

  // The site as the craftsman sees it while he edits it.
  const liveSite = useMemo(
    () =>
      applySiteContent(
        buildActiveSite(
          sector,
          styleIndexFromId(styleId),
          content.form,
          content.disabledServices,
          undefined,
          // Dit is de site van de klant: geen demo- of voorbeeldnummer.
          true
        ),
        content
      ),
    [sector, styleId, content]
  );

  useEffect(() => {
    setSavedAt(Date.now());
  }, [content]);

  const update = (next: SiteContent) => {
    if (remoteContent) setRemoteContent(next);
    else setLocalContent(next);
    setPublishDone(false);
    track('site_content_changed', { sector });
  };

  // Is the craftsman logged in? The session cookie says so.
  useEffect(() => {
    let cancelled = false;
    fetchAccount().then((current) => {
      if (!cancelled) setAccount(current);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the published site when the craftsman opens his management link.
  useEffect(() => {
    if (!initialSlug) {
      // No link in the address bar: the site this browser published earlier
      // is the one to work on, so the customer updates his live site
      // instead of creating a second one.
      const link = loadPublishedLink(sector, styleId);
      if (!link) {
        setPublished(null);
        setRemoteContent(null);
        return;
      }
      let cancelled = false;
      fetchPublishedSite(link.slug, link.token).then((result) => {
        if (cancelled) return;
        if (!result.ok || !result.site) {
          setPublished(null);
          return;
        }
        const content = sanitizeSiteContent({
          version: 1,
          sector: result.site.sector,
          styleId: result.site.styleId,
          form: result.site.form,
          disabledServices: result.site.disabledServices,
          blocks: result.site.blocks,
          blockContent: result.site.blockContent,
          text: result.site.text,
        });
        if (!content || cancelled) return;
        setRemoteContent(content);
        setPublished({
          slug: link.slug,
          token: link.token,
          url: `${window.location.origin}/site/${link.slug}`,
          manageUrl: `${window.location.origin}/mijn-site/${link.slug}?token=${link.token}`,
        });
      });
      return () => {
        cancelled = true;
      };
    }
    let cancelled = false;
    fetchPublishedSite(initialSlug, initialToken).then((result) => {
      if (cancelled) return;
      if (!result.ok || !result.site) {
        setPublishError(result.error ?? 'Deze site kon niet worden geladen.');
        return;
      }
      const content = sanitizeSiteContent({
        version: 1,
        sector: result.site.sector,
        styleId: result.site.styleId,
        form: result.site.form,
        disabledServices: result.site.disabledServices,
        blocks: result.site.blocks,
        blockContent: result.site.blockContent,
        text: result.site.text,
      });
      if (!content || cancelled) return;
      setSector(result.site.sector);
      setStyleId(result.site.styleId);
      setRemoteContent(content);
      setPublished({
        slug: result.site.slug,
        token: initialToken ?? '',
        url: `${window.location.origin}/site/${result.site.slug}`,
        manageUrl: `${window.location.origin}/mijn-site/${result.site.slug}${
          initialToken ? `?token=${initialToken}` : ''
        }`,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [initialSlug, initialToken, sector, styleId]);

  const setBlocks = (blocks: BlockId[]) => update({ ...content, blocks });

  const setBlockContent = (block: ContentBlockId, value: AnyBlockContent) => {
    update({
      ...content,
      blockContent: { ...content.blockContent, [block]: value },
    });
  };

  // In a published site the trade and style belong to the site itself; in a
  // draft every trade keeps its own version.
  const handleSectorChange = (next: SectorId) => {
    setSector(next);
    if (remoteContent) update({ ...remoteContent, sector: next });
  };

  const handleStyleChange = (next: StyleId) => {
    setStyleId(next);
    if (remoteContent) update({ ...remoteContent, styleId: next });
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError(null);
    const result = await publishSite({
      ...(published?.slug ? { slug: published.slug } : {}),
      ...(published?.token ? { token: published.token } : {}),
      sector: content.sector,
      styleId: content.styleId,
      form: content.form,
      disabledServices: content.disabledServices,
      blocks: content.blocks,
      blockContent: content.blockContent,
      text: content.text,
    });
    setPublishing(false);

    if (!result.ok || !result.slug) {
      setPublishError(result.error ?? 'Publiceren lukte niet. Probeer het nog eens.');
      return;
    }

    const url = result.url ?? `${window.location.origin}/site/${result.slug}`;
    const manageUrl =
      result.manageUrl ??
      `${window.location.origin}/mijn-site/${result.slug}?token=${result.token ?? ''}`;
    setPublished({ slug: result.slug, token: result.token ?? '', url, manageUrl });
    if (result.token) savePublishedLink(sector, styleId, { slug: result.slug, token: result.token });
    if (!remoteContent) setRemoteContent(content);
    setPublishDone(true);
    track('site_content_changed', { sector, published: true });
  };

  const available = BLOCKS.filter((block) => !content.blocks.includes(block.id));
  const availableByGroup = available.reduce<Record<string, typeof available>>((groups, block) => {
    const group = block.addon.group;
    groups[group] = groups[group] ? [...groups[group], block] : [block];
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <header className="bg-white border-b border-stone-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap sticky top-0 z-30">
        <div className="flex flex-col">
          <h1 className="text-lg font-black text-stone-900 m-0 leading-tight">Je eigen site</h1>
          <span className="text-xs text-stone-600">
            {publishError
              ? publishError
              : publishDone
                ? 'Je site staat live.'
                : savedAt
                  ? 'Alles staat opgeslagen in je browser'
                  : 'Bezig met opslaan…'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="h-11 px-4 inline-flex items-center gap-2 rounded-full bg-stone-900 text-white text-sm font-bold disabled:opacity-60"
          >
            {publishing ? 'Bezig met publiceren…' : published ? 'Site bijwerken' : 'Site publiceren'}
          </button>
          <a
            href={published ? published.url : `/voorbeeld/${sector}/${styleId}`}
            target={published ? '_blank' : undefined}
            rel={published ? 'noreferrer' : undefined}
            className="h-11 px-4 inline-flex items-center gap-2 rounded-full border-2 border-stone-300 text-sm font-bold text-stone-900 hover:border-stone-900"
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            {published ? 'Bekijk je live site' : 'Bekijk je site'}
          </a>
        </div>
      </header>

      <div className="bg-white border-b border-stone-200 px-4 sm:px-6 py-2.5 text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
        {account ? (
          <>
            <span className="text-stone-700">
              Ingelogd als <strong className="text-stone-900">{account.email}</strong>
            </span>
            <RouteLink route={{ name: 'account' }} className="font-bold text-stone-900 underline underline-offset-2">
              Mijn sites
            </RouteLink>
          </>
        ) : (
          <>
            <span className="text-stone-700">Nog geen account? Log in om al je sites op één plek te vinden.</span>
            <RouteLink route={{ name: 'account' }} className="font-bold text-stone-900 underline underline-offset-2">
              Inloggen
            </RouteLink>
          </>
        )}
      </div>

      {published && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 sm:px-6 py-3 text-sm text-emerald-900 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-bold">Je site staat live:</span>
          <a href={published.url} className="underline break-all" target="_blank" rel="noreferrer">
            {published.url}
          </a>
          <a href={published.manageUrl} className="underline">
            Beheerlink (privé)
          </a>
          <span className="text-xs text-emerald-800">
            {account
              ? 'Je site staat in je account. De beheerlink blijft een extra zekerheid.'
              : 'Bewaar deze beheerlink: daarmee pas je je site verder aan.'}
          </span>
        </div>
      )}

      <div className="flex-1 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)]">
        {/* Live preview */}
        <div className="hidden lg:block bg-stone-200/70 p-6 overflow-y-auto h-[calc(100vh-4.25rem)]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-end gap-2 mb-3">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                className={`h-9 px-3 rounded-full text-sm font-bold ${
                  device === 'desktop'
                    ? 'bg-stone-900 text-white'
                    : 'bg-white border-2 border-stone-300 text-stone-700'
                }`}
              >
                Computer
              </button>
              <button
                type="button"
                onClick={() => setDevice('mobiel')}
                className={`h-9 px-3 rounded-full text-sm font-bold ${
                  device === 'mobiel'
                    ? 'bg-stone-900 text-white'
                    : 'bg-white border-2 border-stone-300 text-stone-700'
                }`}
              >
                Telefoon
              </button>
            </div>

            <div
              className={`bg-white shadow-xl mx-auto overflow-hidden ${
                device === 'mobiel' ? 'max-w-[24rem] rounded-[2rem] border-8 border-stone-900' : 'rounded-xl'
              }`}
            >
              <SiteView
                site={liveSite}
                selectedSector={sector}
                selectedStyleIndex={styleIndexFromId(styleId)}
                embedded
              />
            </div>
          </div>
        </div>

        {/* Panel */}
        <div className="bg-white border-t lg:border-t-0 lg:border-l border-stone-200 flex flex-col h-[calc(100vh-4.25rem)] lg:h-auto">
          <div className="lg:hidden border-b border-stone-200 p-3 flex gap-2 overflow-x-auto">
            {TABS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(entry.id)}
                className={`h-10 px-4 rounded-full text-sm font-bold whitespace-nowrap ${
                  tab === entry.id
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-700'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex border-b border-stone-200 p-3 gap-2">
            {TABS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(entry.id)}
                className={`h-10 px-4 rounded-full text-sm font-bold ${
                  tab === entry.id
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-5">
            {tab === 'gegevens' && (
              <div className="flex flex-col gap-4">
                <TextField
                  label="Bedrijfsnaam"
                  value={content.form.biz}
                  onChange={(biz) => update({ ...content, form: { ...content.form, biz } })}
                />
                <TextField
                  label="Jouw voor- en achternaam"
                  value={content.form.owner}
                  onChange={(owner) => update({ ...content, form: { ...content.form, owner } })}
                />
                <TextField
                  label="Telefoonnummer"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  hint="Je klanten bellen dit nummer. Zonder nummer blijven de bel- en WhatsApp-knoppen weg."
                  value={content.form.phone}
                  onChange={(phone) => update({ ...content, form: { ...content.form, phone } })}
                />
                <TextField
                  label="KvK-nummer"
                  hint="Vul je echte KvK-nummer in. Het verschijnt dan onderaan je site. Leeg laten mag ook."
                  value={content.form.kvk ?? ''}
                  onChange={(kvk) => update({ ...content, form: { ...content.form, kvk } })}
                />
                <TextField
                  label="Plaats"
                  autoComplete="address-level2"
                  value={content.form.city}
                  onChange={(city) => update({ ...content, form: { ...content.form, city } })}
                />
                <TextField
                  label="E-mailadres"
                  type="email"
                  autoComplete="email"
                  hint="Hier komen je offertes naartoe."
                  value={content.form.email ?? ''}
                  onChange={(email) => update({ ...content, form: { ...content.form, email } })}
                />

                <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
                  <legend className="text-sm font-bold text-stone-900 p-0">Diensten</legend>
                  <p className="text-xs text-stone-600 m-0">
                    Zet een dienst uit als je die niet aanbiedt.
                  </p>
                  {SECTORS[sector].services.map((service, index) => {
                    const hidden = content.disabledServices[index];
                    return (
                      <label
                        key={service.n}
                        className="flex items-center gap-3 h-12 px-3 rounded-xl border-2 border-stone-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={!hidden}
                          onChange={(event) => {
                            const disabledServices = { ...content.disabledServices };
                            if (event.target.checked) delete disabledServices[index];
                            else disabledServices[index] = true;
                            update({ ...content, disabledServices });
                          }}
                          className="w-5 h-5 accent-stone-900"
                        />
                        <span className="text-sm font-semibold text-stone-900">{service.n}</span>
                      </label>
                    );
                  })}
                </fieldset>

                <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
                  <legend className="text-sm font-bold text-stone-900 p-0">Vak en stijl</legend>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      aria-label="Vak"
                      value={sector}
                      onChange={(event) => handleSectorChange(event.target.value as SectorId)}
                      className="h-14 px-3 rounded-xl border-2 border-stone-300 bg-white text-base font-semibold"
                    >
                      {ORDER.map((id) => (
                        <option key={id} value={id}>
                          {SECTORS[id].name}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Stijl"
                      value={styleId}
                      onChange={(event) => handleStyleChange(event.target.value as StyleId)}
                      className="h-14 px-3 rounded-xl border-2 border-stone-300 bg-white text-base font-semibold"
                    >
                      {STYLES.map((style) => (
                        <option key={style.id} value={style.id}>
                          {style.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </fieldset>
              </div>
            )}

            {tab === 'tekst' && (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-stone-600 m-0">
                  Dit is de tekst bovenin je site. Alles is over te nemen; de oude tekst
                  komt terug als je een veld leegmaakt.
                </p>
                <TextField
                  label="Kleine regel boven de titel"
                  value={content.text.kicker}
                  onChange={(kicker) => update({ ...content, text: { ...content.text, kicker } })}
                />
                <TextField
                  label="Titel"
                  value={content.text.headline}
                  onChange={(headline) =>
                    update({ ...content, text: { ...content.text, headline } })
                  }
                />
                <TextAreaField
                  label="Introductie"
                  rows={4}
                  value={content.text.intro}
                  onChange={(intro) => update({ ...content, text: { ...content.text, intro } })}
                />
                <TextAreaField
                  label="Over jou"
                  rows={5}
                  value={content.text.about}
                  onChange={(about) => update({ ...content, text: { ...content.text, about } })}
                />
                <TextField
                  label="Knop 1"
                  value={content.text.cta1}
                  onChange={(cta1) => update({ ...content, text: { ...content.text, cta1 } })}
                />
                <TextField
                  label="Knop 2"
                  value={content.text.cta2}
                  onChange={(cta2) => update({ ...content, text: { ...content.text, cta2 } })}
                />
              </div>
            )}

            {tab === 'blokken' && (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-stone-600 m-0">
                  Dit zijn de onderdelen van je site. Zet ze aan of uit, sleep ze in de
                  volgorde die jij wilt en vul ze in met jouw teksten.
                </p>

                <ul className="flex flex-col gap-2 list-none p-0 m-0">
                  {content.blocks.map((id, index) => {
                    const block = getBlock(id);
                    if (!block) return null;
                    const isOpen = openBlock === id;
                    return (
                      <li
                        key={id}
                        draggable
                        onDragStart={() => {
                          dragId.current = id;
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          const dragged = dragId.current;
                          if (!dragged) return;
                          setBlocks(moveBlockTo(content.blocks, dragged, index));
                          dragId.current = null;
                        }}
                        className="rounded-xl border-2 border-stone-200 bg-white"
                      >
                        <div className="flex items-center gap-2 p-3">
                          <span className="text-stone-400 cursor-grab" aria-hidden="true">
                            <GripVertical className="w-4 h-4" />
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenBlock(
                                isOpen ? null : isContentBlockId(id) ? id : null
                              )
                            }
                            className="flex-1 text-left"
                          >
                            <span className="block text-sm font-bold text-stone-900">
                              {block.addon.label}
                            </span>
                            <span className="block text-xs text-stone-600">
                              {block.addon.description}
                            </span>
                          </button>
                          <button
                            type="button"
                            aria-label={`${block.addon.label} omhoog`}
                            disabled={index === 0}
                            onClick={() => setBlocks(moveBlock(content.blocks, id, -1))}
                            className="h-9 w-9 inline-flex items-center justify-center rounded-full border-2 border-stone-300 disabled:opacity-30"
                          >
                            <ArrowUp className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`${block.addon.label} omlaag`}
                            disabled={index === content.blocks.length - 1}
                            onClick={() => setBlocks(moveBlock(content.blocks, id, 1))}
                            className="h-9 w-9 inline-flex items-center justify-center rounded-full border-2 border-stone-300 disabled:opacity-30"
                          >
                            <ArrowDown className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`${block.addon.label} verwijderen`}
                            onClick={() => {
                              setBlocks(setBlockEnabled(content.blocks, id, false));
                              if (openBlock === id) setOpenBlock(null);
                            }}
                            className="h-9 w-9 inline-flex items-center justify-center rounded-full border-2 border-stone-300 hover:border-rose-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>

                        {isOpen && isContentBlockId(id) && (
                          <div className="border-t-2 border-stone-200 p-4">
                            <BlockForm
                              block={id}
                              content={
                                (content.blockContent[id] ??
                                  liveSite.blockContent[id]) as AnyBlockContent
                              }
                              onChange={(value) => setBlockContent(id, value)}
                            />
                          </div>
                        )}

                        {isOpen && !isContentBlockId(id) && (
                          <p className="border-t-2 border-stone-200 p-4 text-sm text-stone-600 m-0">
                            Dit onderdeel werkt vanzelf: de klant vult het zelf in, jij
                            hoeft er alleen tekst voor te typen.
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {showAdd ? (
                  <div className="rounded-xl border-2 border-stone-200 p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-bold text-stone-900 m-0">Blok toevoegen</h2>
                      <button
                        type="button"
                        onClick={() => setShowAdd(false)}
                        aria-label="Sluiten"
                        className="h-9 w-9 inline-flex items-center justify-center rounded-full border-2 border-stone-300"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    {Object.entries(availableByGroup).map(([group, entries]) => (
                      <div key={group} className="flex flex-col gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-stone-600 m-0">
                          {group}
                        </h3>
                        {entries.map((block) => (
                          <button
                            key={block.id}
                            type="button"
                            onClick={() => {
                              setBlocks(setBlockEnabled(content.blocks, block.id, true));
                              setShowAdd(false);
                              // Open the block right away, so the customer can
                              // fill in his own words.
                              setOpenBlock(isContentBlockId(block.id) ? block.id : null);
                            }}
                            className="flex items-center gap-3 text-left p-3 rounded-xl border-2 border-stone-200 hover:border-stone-900"
                          >
                            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>
                              <span className="block text-sm font-bold text-stone-900">
                                {block.addon.label}
                              </span>
                              <span className="block text-xs text-stone-600">
                                {block.addon.description}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    ))}

                    {available.length === 0 && (
                      <p className="text-sm text-stone-600 m-0">
                        Je hebt alle onderdelen al op je site.
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAdd(true)}
                    className="h-12 rounded-full border-2 border-stone-900 text-sm font-bold text-stone-900 inline-flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    Blok toevoegen
                  </button>
                )}

                {content.blocks.length > 0 && (
                  <p className="text-xs text-stone-500 m-0 inline-flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    Alles staat direct in je browser. Publiceren komt in de volgende stap.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
