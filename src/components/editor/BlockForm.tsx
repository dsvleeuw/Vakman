import React from 'react';
import type {
  AvailabilityContent,
  BlockContentMap,
  ContactCtaContent,
  ContentBlockId,
  GuaranteeContent,
  OpeningHoursContent,
  ProjectStatsContent,
  PromotionContent,
  ServiceAreasContent,
  TeamMemberContent,
  TestimonialContent,
  TrustBarContent,
  TrustBarItem,
} from '../../types';
import { ListField, SelectField, TextAreaField, TextField } from './Field';

export type AnyBlockContent = BlockContentMap[ContentBlockId];

export interface BlockFormProps {
  block: ContentBlockId;
  content: AnyBlockContent;
  onChange: (content: AnyBlockContent) => void;
}

const ICON_OPTIONS = [
  { value: 'shield', label: 'Keurmerk / garantie' },
  { value: 'clock', label: 'Snelheid / bereikbaarheid' },
  { value: 'pin', label: 'Werkgebied' },
  { value: 'star', label: 'Beoordelingen' },
  { value: 'check', label: 'Belofte' },
  { value: 'award', label: 'Erkenning' },
  { value: 'leaf', label: 'Duurzaam / vakmanschap' },
  { value: 'tool', label: 'Gereedschap / vak' },
];

/** A list of short lines, one item per line. Handy for places and promises. */
const LinesField: React.FC<{
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
}> = ({ label, hint, items, onChange }) => (
  <TextAreaField
    label={label}
    hint={hint}
    rows={4}
    value={items.join('\n')}
    onChange={(value) =>
      onChange(
        value
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      )
    }
  />
);

/**
 * The form for one block: the words the craftsman can change. Every block
 * starts from the trade preset, so the form is never empty.
 */
export const BlockForm: React.FC<BlockFormProps> = ({ block, content, onChange }) => {
  switch (block) {
    case 'trust-bar': {
      const value = content as TrustBarContent;
      return (
        <ListField
          label="Bewijzen"
          hint="Vier korte regels waar je klant op vertrouwt."
          items={value.items}
          itemTitle={(item, index) => `Bewijs ${index + 1}`}
          createItem={(): TrustBarItem => ({ icon: 'check', title: '', text: '' })}
          fields={[
            { key: 'icon', label: 'Icoon', options: ICON_OPTIONS },
            { key: 'title', label: 'Titel' },
            { key: 'text', label: 'Toelichting' },
          ]}
          onChange={(items) => onChange({ items })}
        />
      );
    }
    case 'guarantees': {
      const value = content as GuaranteeContent;
      return (
        <ListField
          label="Beloften"
          hint="Wat je garandeert. Concrete afspraken werken beter dan moeite woorden."
          items={value.items}
          itemTitle={(item, index) => `Belofte ${index + 1}`}
          createItem={() => ({ title: '', description: '' })}
          fields={[
            { key: 'title', label: 'Titel' },
            { key: 'description', label: 'Toelichting', type: 'textarea' },
          ]}
          onChange={(items) => onChange({ items })}
        />
      );
    }
    case 'testimonial': {
      const value = content as TestimonialContent;
      return (
        <div className="flex flex-col gap-4">
          <TextAreaField
            label="Review"
            value={value.quote}
            onChange={(quote) => onChange({ ...value, quote })}
          />
          <TextField
            label="Van wie"
            value={value.who}
            onChange={(who) => onChange({ ...value, who })}
          />
          <TextField
            label="Score"
            hint="Bijvoorbeeld 4,9"
            value={String(value.rating)}
            onChange={(rating) =>
              onChange({ ...value, rating: Number.parseFloat(rating.replace(',', '.')) || 0 })
            }
          />
        </div>
      );
    }
    case 'team-member': {
      const value = content as TeamMemberContent;
      return (
        <div className="flex flex-col gap-4">
          <TextField
            label="Naam"
            value={value.name}
            onChange={(name) => onChange({ ...value, name })}
          />
          <TextField
            label="Functie"
            hint="Bijvoorbeeld: Vakman & eigenaar van Jansen Schilderwerken"
            value={value.role}
            onChange={(role) => onChange({ ...value, role })}
          />
          <TextAreaField
            label="Jouw verhaal"
            value={value.text}
            onChange={(text) => onChange({ ...value, text })}
          />
          <TextField
            label="Vakman sinds"
            value={value.since}
            onChange={(since) => onChange({ ...value, since })}
          />
        </div>
      );
    }
    case 'project-stats': {
      const value = content as ProjectStatsContent;
      return (
        <ListField
          label="Cijfers"
          hint="Bijvoorbeeld: 15 jaar ervaring, 120 reviews."
          items={value.stats}
          itemTitle={(item, index) => `Cijfer ${index + 1}`}
          createItem={() => ({ value: '', label: '' })}
          fields={[
            { key: 'value', label: 'Getal' },
            { key: 'label', label: 'Omschrijving' },
          ]}
          onChange={(stats) => onChange({ stats })}
        />
      );
    }
    case 'opening-hours': {
      const value = content as OpeningHoursContent;
      return (
        <div className="flex flex-col gap-4">
          <ListField
            label="Openingstijden"
            items={value.hours}
            itemTitle={(item, index) => item.days || `Dag ${index + 1}`}
            createItem={() => ({ days: '', time: '' })}
            fields={[
              { key: 'days', label: 'Dag' },
              { key: 'time', label: 'Tijd' },
            ]}
            onChange={(hours) => onChange({ ...value, hours })}
          />
          <TextAreaField
            label="Let op"
            value={value.note}
            onChange={(note) => onChange({ ...value, note })}
          />
        </div>
      );
    }
    case 'availability': {
      const value = content as AvailabilityContent;
      return (
        <div className="flex flex-col gap-4">
          <TextField
            label="Eerstvolgende mogelijkheid"
            hint="Bijvoorbeeld: Deze week of Volgende week dinsdag"
            value={value.next}
            onChange={(next) => onChange({ ...value, next })}
          />
          <LinesField
            label="Wat je belooft"
            hint="Eén belofte per regel."
            items={value.promises}
            onChange={(promises) => onChange({ ...value, promises })}
          />
        </div>
      );
    }
    case 'promotion': {
      const value = content as PromotionContent;
      return (
        <div className="flex flex-col gap-4">
          <TextField
            label="Titel"
            value={value.title}
            onChange={(title) => onChange({ ...value, title })}
          />
          <TextAreaField
            label="Toelichting"
            value={value.description}
            onChange={(description) => onChange({ ...value, description })}
          />
          <TextField
            label="Knop"
            value={value.cta}
            onChange={(cta) => onChange({ ...value, cta })}
          />
        </div>
      );
    }
    case 'service-areas': {
      const value = content as ServiceAreasContent;
      return (
        <LinesField
          label="Werkgebied"
          hint="Eén plaats per regel. De eerste is je standplaats."
          items={value.areas}
          onChange={(areas) => onChange({ areas })}
        />
      );
    }
    case 'contact-cta': {
      const value = content as ContactCtaContent;
      return (
        <div className="flex flex-col gap-4">
          <TextField
            label="Titel"
            value={value.title}
            onChange={(title) => onChange({ ...value, title })}
          />
          <TextAreaField
            label="Toelichting"
            value={value.description}
            onChange={(description) => onChange({ ...value, description })}
          />
        </div>
      );
    }
    default:
      return null;
  }
};

export { SelectField };
