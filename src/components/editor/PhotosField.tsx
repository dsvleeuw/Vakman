import React, { useRef, useState } from 'react';
import type { WorkProject } from '../../types';
import { uploadPhoto } from '../../utils/mediaClient';

/**
 * The photos of the craftsman: the photo at the top of his page and the
 * photos of his own projects.
 *
 * A published site shows the work of its owner. The stock photos of the
 * trade preset are demo material, so the craftsman uploads his own here.
 * The photo is made smaller in the browser before it goes to the server.
 */

interface PhotosFieldProps {
  /** The photo at the top of the page. */
  heroPhoto?: string;
  /** The projects of the craftsman, with their photos. */
  work: WorkProject[];
  onChange: (next: { heroPhoto?: string; work: WorkProject[] }) => void;
}

const INPUT_CLASS =
  'w-full h-12 px-4 rounded-xl border-2 bg-white text-stone-900 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-stone-900';

/** One photo: choose a file, see it, or take it away. */
const PhotoPicker: React.FC<{
  label: string;
  photo?: string;
  onChange: (photo: string | undefined) => void;
}> = ({ label, photo, onChange }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    const result = await uploadPhoto(file);
    setBusy(false);
    if (!result.ok || !result.url) {
      setError(result.error ?? 'Het uploaden is niet gelukt.');
      return;
    }
    onChange(result.url);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold text-stone-900">{label}</span>
      <div className="flex items-center gap-3 flex-wrap">
        {photo ? (
          <img
            src={photo}
            alt={label}
            className="w-24 h-24 object-cover rounded-xl border-2 border-stone-200 bg-stone-100"
          />
        ) : (
          <span className="w-24 h-24 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-xs text-stone-500 text-center px-2">
            Nog geen foto
          </span>
        )}
        <label
          className={`h-11 px-4 rounded-full border-2 border-stone-900 text-sm font-bold flex items-center cursor-pointer ${
            busy ? 'opacity-60' : 'hover:bg-stone-900 hover:text-white'
          }`}
        >
          {busy ? 'Bezig…' : photo ? 'Foto vervangen' : 'Foto kiezen'}
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              void handleFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>
        {photo && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="h-11 px-4 rounded-full bg-white border-2 border-stone-300 text-sm font-bold text-stone-700 hover:border-rose-400 hover:text-rose-600"
          >
            Verwijderen
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-rose-600 font-bold m-0">
          {error}
        </p>
      )}
    </div>
  );
};

export const PhotosField: React.FC<PhotosFieldProps> = ({ heroPhoto, work, onChange }) => {
  const update = (index: number, changes: Partial<WorkProject>) => {
    onChange({
      heroPhoto,
      work: work.map((project, position) =>
        position === index ? { ...project, ...changes } : project
      ),
    });
  };

  const remove = (index: number) => {
    onChange({ heroPhoto, work: work.filter((_, position) => position !== index) });
  };

  const add = () => {
    onChange({
      heroPhoto,
      work: [...work, { t: '', c: '', y: '' }],
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-stone-600 m-0">
        Dit zijn de foto’s van je eigen werk. Zonder foto’s blijven de voorbeeldfoto’s
        van het vak in de editor staan en komen ze niet op je site. Je foto wordt
        kleiner gemaakt voordat hij naar de server gaat.
      </p>

      <PhotoPicker
        label="Foto bovenin je site"
        photo={heroPhoto}
        onChange={(photo) => onChange({ heroPhoto: photo, work })}
      />

      <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
        <legend className="text-sm font-bold text-stone-900 p-0">Je projecten</legend>
        {work.length === 0 && (
          <p className="text-xs text-stone-600 m-0">
            Nog geen projecten. Voeg je eigen werk toe, met een foto erbij.
          </p>
        )}
        {work.map((project, index) => (
          <div
            key={index}
            className="rounded-xl border-2 border-stone-200 bg-stone-50 p-3 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wide text-stone-600">
                Project {index + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(index)}
                className="h-9 px-3 rounded-full bg-white border-2 border-stone-300 text-sm font-bold text-stone-700 hover:border-rose-400 hover:text-rose-600"
              >
                Verwijder
              </button>
            </div>
            <div>
              <label htmlFor={`work-title-${index}`} className="block text-sm font-bold mb-1 text-stone-900">
                Titel
              </label>
              <input
                id={`work-title-${index}`}
                type="text"
                value={project.t}
                onChange={(event) => update(index, { t: event.target.value })}
                placeholder="bijv. Badkamer schilderen"
                className={INPUT_CLASS}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={`work-place-${index}`} className="block text-sm font-bold mb-1 text-stone-900">
                  Soort werk
                </label>
                <input
                  id={`work-place-${index}`}
                  type="text"
                  value={project.c}
                  onChange={(event) => update(index, { c: event.target.value })}
                  placeholder="bijv. Schilderwerk"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor={`work-year-${index}`} className="block text-sm font-bold mb-1 text-stone-900">
                  Jaar
                </label>
                <input
                  id={`work-year-${index}`}
                  type="text"
                  value={project.y}
                  onChange={(event) => update(index, { y: event.target.value })}
                  placeholder="bijv. 2025"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <PhotoPicker
              label="Foto van dit project"
              photo={project.img}
              onChange={(photo) => update(index, { ...(photo ? { img: photo } : { img: undefined }) })}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="self-start h-11 px-4 rounded-full border-2 border-stone-900 text-sm font-bold text-stone-900 hover:bg-stone-900 hover:text-white"
        >
          + Project toevoegen
        </button>
      </fieldset>
    </div>
  );
};
