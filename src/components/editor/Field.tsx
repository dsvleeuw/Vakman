import React, { useId } from 'react';

/**
 * Form fields for the editor.
 *
 * One set of fields for every form, so labels are always linked to their
 * input (`htmlFor` + `id`), the focus ring is the same everywhere and the
 * text stays readable on a phone. The editor is where a craftsman fills in
 * his own site, so these fields are the product.
 */

const INPUT_CLASS =
  'w-full h-14 px-4 rounded-xl border-2 bg-white text-stone-900 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900';

interface FieldShellProps {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}

const FieldShell: React.FC<FieldShellProps> = ({ label, hint, htmlFor, children }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={htmlFor} className="block text-sm font-bold text-stone-900">
      {label}
    </label>
    {children}
    {hint ? (
      <p id={`${htmlFor}-hint`} className="text-xs text-stone-600 m-0">
        {hint}
      </p>
    ) : null}
  </div>
);

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  type?: 'text' | 'tel' | 'email';
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'email';
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  hint,
  placeholder,
  type = 'text',
  autoComplete,
  inputMode,
}) => {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} htmlFor={id}>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={INPUT_CLASS}
      />
    </FieldShell>
  );
};

export interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  rows?: number;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  value,
  onChange,
  hint,
  rows = 3,
}) => {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} htmlFor={id}>
      <textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={`${INPUT_CLASS} h-auto py-3 leading-relaxed resize-y`}
      />
    </FieldShell>
  );
};

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  hint?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  options,
  onChange,
  hint,
}) => {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} htmlFor={id}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={INPUT_CLASS}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
};

export interface ListFieldDescriptor<T> {
  key: string;
  label: string;
  type?: 'text' | 'textarea';
  rows?: number;
  options?: SelectOption[];
}

export interface ListFieldProps<T> {
  label: string;
  hint?: string;
  items: T[];
  fields: ListFieldDescriptor<T>[];
  createItem: () => T;
  itemTitle: (item: T, index: number) => string;
  onChange: (items: T[]) => void;
}

/**
 * A list of rows the craftsman can fill in: the items of a trust bar, the
 * opening hours, the projects. Rows can be added and removed.
 */
export function ListField<T extends object>({
  label,
  hint,
  items,
  fields,
  createItem,
  itemTitle,
  onChange,
}: ListFieldProps<T>): React.ReactElement {
  const id = useId();

  const update = (index: number, key: string, value: string) => {
    const next = items.map((item, position) =>
      position === index ? { ...item, [key]: value } : item
    );
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, position) => position !== index));
  };

  const add = () => {
    onChange([...items, createItem()]);
  };

  return (
    <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
      <legend className="text-sm font-bold text-stone-900 p-0">{label}</legend>
      {hint ? <p className="text-xs text-stone-600 m-0">{hint}</p> : null}

      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <div key={index} className="rounded-xl border-2 border-stone-200 bg-stone-50 p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wide text-stone-600">
                {itemTitle(item, index)}
              </span>
              <button
                type="button"
                onClick={() => remove(index)}
                className="h-9 px-3 rounded-full bg-white border-2 border-stone-300 text-sm font-bold text-stone-700 hover:border-rose-400 hover:text-rose-600"
              >
                Verwijder
              </button>
            </div>

            {fields.map((field) => {
              const fieldId = `${id}-${index}-${field.key}`;
              const value = String((item as Record<string, unknown>)[field.key] ?? '');
              if (field.options) {
                return (
                  <div key={field.key} className="flex flex-col gap-1.5">
                    <label htmlFor={fieldId} className="text-sm font-bold text-stone-900">
                      {field.label}
                    </label>
                    <select
                      id={fieldId}
                      value={value}
                      onChange={(event) => update(index, field.key, event.target.value)}
                      className={INPUT_CLASS}
                    >
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }
              if (field.type === 'textarea') {
                return (
                  <div key={field.key} className="flex flex-col gap-1.5">
                    <label htmlFor={fieldId} className="text-sm font-bold text-stone-900">
                      {field.label}
                    </label>
                    <textarea
                      id={fieldId}
                      value={value}
                      rows={field.rows ?? 2}
                      onChange={(event) => update(index, field.key, event.target.value)}
                      className={`${INPUT_CLASS} h-auto py-3 leading-relaxed resize-y`}
                    />
                  </div>
                );
              }
              return (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <label htmlFor={fieldId} className="text-sm font-bold text-stone-900">
                    {field.label}
                  </label>
                  <input
                    id={fieldId}
                    type="text"
                    value={value}
                    onChange={(event) => update(index, field.key, event.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="self-start h-11 px-4 rounded-full border-2 border-stone-900 text-sm font-bold text-stone-900 hover:bg-stone-900 hover:text-white"
      >
        + Toevoegen
      </button>
    </fieldset>
  );
}
