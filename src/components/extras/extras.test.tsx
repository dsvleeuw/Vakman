import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildActiveSite } from '../../data/tradesData';
import { AvailabilityCard } from './AvailabilityCard';
import { ContactCtaBanner } from './ContactCtaBanner';
import { GuaranteeList } from './GuaranteeList';
import { OpeningHoursCard } from './OpeningHoursCard';
import { ProjectStats } from './ProjectStats';
import { PromotionBanner } from './PromotionBanner';
import { ServiceAreaChips } from './ServiceAreaChips';
import { TeamMemberCard } from './TeamMemberCard';
import { TestimonialCard } from './TestimonialCard';
import { TrustBar } from './TrustBar';

const site = buildActiveSite('timmerman', 0);
const previews = [
  { name: 'TrustBar', expected: 'Verzekerd', element: <TrustBar site={site} /> },
  { name: 'OpeningHoursCard', expected: 'Openingstijden', element: <OpeningHoursCard site={site} /> },
  { name: 'AvailabilityCard', expected: 'Eerstvolgende mogelijkheid', element: <AvailabilityCard site={site} /> },
  { name: 'TeamMemberCard', expected: 'Jouw vaste aanspreekpunt', element: <TeamMemberCard site={site} /> },
  { name: 'TestimonialCard', expected: 'Klant van', element: <TestimonialCard site={site} /> },
  { name: 'GuaranteeList', expected: 'Goed werk.', element: <GuaranteeList site={site} /> },
  { name: 'PromotionBanner', expected: 'Slimmer plannen', element: <PromotionBanner site={site} /> },
  { name: 'ServiceAreaChips', expected: 'Actief in', element: <ServiceAreaChips site={site} /> },
  { name: 'ProjectStats', expected: 'Klantbeoordelingen', element: <ProjectStats site={site} /> },
  { name: 'ContactCtaBanner', expected: 'Bereken je prijs', element: <ContactCtaBanner site={site} /> },
];

for (const preview of previews) {
  test(`${preview.name} renders a useful palette-aware preview`, () => {
    const markup = renderToStaticMarkup(preview.element);

    assert.ok(markup.includes(preview.expected));
    assert.ok(markup.includes('oklch('));
    assert.ok(!markup.includes('undefined'));
  });
}
