import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildActiveSite } from '../../data/tradesData';
import { defaultBlockContent } from '../../data/blocks';
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
  { name: 'TrustBar', expected: 'SKH-gecertificeerd', element: <TrustBar site={site} content={defaultBlockContent(site, 'trust-bar')} /> },
  { name: 'OpeningHoursCard', expected: 'Openingstijden', element: <OpeningHoursCard site={site} content={defaultBlockContent(site, 'opening-hours')} /> },
  { name: 'AvailabilityCard', expected: 'Eerstvolgende mogelijkheid', element: <AvailabilityCard site={site} content={defaultBlockContent(site, 'availability')} /> },
  { name: 'TeamMemberCard', expected: 'Jouw vaste aanspreekpunt', element: <TeamMemberCard site={site} content={defaultBlockContent(site, 'team-member')} /> },
  { name: 'TestimonialCard', expected: 'Klant van', element: <TestimonialCard site={site} content={defaultBlockContent(site, 'testimonial')} /> },
  { name: 'GuaranteeList', expected: 'Goed werk.', element: <GuaranteeList site={site} content={defaultBlockContent(site, 'guarantees')} /> },
  { name: 'PromotionBanner', expected: 'Slimmer plannen', element: <PromotionBanner site={site} content={defaultBlockContent(site, 'promotion')} /> },
  { name: 'ServiceAreaChips', expected: 'Actief in', element: <ServiceAreaChips site={site} content={defaultBlockContent(site, 'service-areas')} /> },
  { name: 'ProjectStats', expected: 'Klantbeoordelingen', element: <ProjectStats site={site} content={defaultBlockContent(site, 'project-stats')} /> },
  { name: 'ContactCtaBanner', expected: 'Bereken je prijs', element: <ContactCtaBanner site={site} content={defaultBlockContent(site, 'contact-cta')} /> },
];

for (const preview of previews) {
  test(`${preview.name} renders a useful palette-aware preview`, () => {
    const markup = renderToStaticMarkup(preview.element);

    assert.ok(markup.includes(preview.expected));
    assert.ok(markup.includes('oklch('));
    assert.ok(!markup.includes('undefined'));
  });
}
