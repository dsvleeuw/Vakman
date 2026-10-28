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
  setBlockEnabled,
} from '../../utils/siteContent';
import { useSiteContent } from '../../hooks/useSiteContent';
import { track } from '../../utils/analytics';
import { SiteView } from '../SiteView';
import { BlockForm, type AnyBlockContent } from './BlockForm';
import { TextAreaField, TextField } from './Field';

export interface SiteEditorProps {
  sector?: SectorId;
  styleId?: StyleId;
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
}) => {
  const [sector, setSector] = useState<SectorId>(initialSector ?? DEFAULT_SECTOR);
  const [styleId, setStyleId] = useState<StyleId>(initialStyleId ?? DEFAULT_STYLE_ID);
  const { content, setContent } = useSiteContent(sector, styleId);
  const [tab, setTab] = useState<PanelTab>('blokken');
  const [openBlock, setOpenBlock] = useState<ContentBlockId | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [device, setDevice] = useState<'desktop' | 'mobiel'>('desktop');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const dragId = useRef<BlockId | null>(null);

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
    setContent(next);
    track('site_content_changed', { sector });
  };

  const setBlocks = (blocks: BlockId[]) => update({ ...content, blocks });

  const setBlockContent = (block: ContentBlockId, value: AnyBlockContent) => {
    update({
      ...content,
      blockContent: { ...content.blockContent, [block]: value },
    });
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
            {savedAt ? 'Alles staat opgeslagen in je browser' : 'Bezig met opslaan…'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/voorbeeld/${sector}/${styleId}`}
            className="h-11 px-4 inline-flex items-center gap-2 rounded-full border-2 border-stone-300 text-sm font-bold text-stone-900 hover:border-stone-900"
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            Bekijk je site
          </a>
        </div>
      </header>

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
                      onChange={(event) => setSector(event.target.value as SectorId)}
                      className="h-12 px-3 rounded-xl border-2 border-stone-300 bg-white text-sm font-semibold"
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
                      onChange={(event) => setStyleId(event.target.value as StyleId)}
                      className="h-12 px-3 rounded-xl border-2 border-stone-300 bg-white text-sm font-semibold"
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
