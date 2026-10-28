import React from 'react';
import type { ActiveSiteData, BlockId } from '../types';
import { defaultBlockContent } from '../data/blocks';
import { blockContentOf } from '../utils/siteContent';
import { PriceCalculator } from './PriceCalculator';
import { AreaChecker } from './AreaChecker';
import { BookingCalendar } from './BookingCalendar';
import { TradeTool } from './tools/TradeTool';
import { TrustBar } from './extras/TrustBar';
import { GuaranteeList } from './extras/GuaranteeList';
import { TestimonialCard } from './extras/TestimonialCard';
import { TeamMemberCard } from './extras/TeamMemberCard';
import { ProjectStats } from './extras/ProjectStats';
import { OpeningHoursCard } from './extras/OpeningHoursCard';
import { AvailabilityCard } from './extras/AvailabilityCard';
import { PromotionBanner } from './extras/PromotionBanner';
import { ServiceAreaChips } from './extras/ServiceAreaChips';
import { ContactCtaBanner } from './extras/ContactCtaBanner';

export interface BlockRendererProps {
  site: ActiveSiteData;
  block: BlockId;
}

/**
 * Renders one block of a craftsman website.
 *
 * The four tools bring their own section (with padding and an anchor id), so
 * they are rendered as they are. The content blocks are wrapped in a padded
 * band, because they are just the component itself.
 */
export const BlockRenderer: React.FC<BlockRendererProps> = ({ site, block }) => {
  switch (block) {
    case 'price-calculator':
      return <PriceCalculator site={site} />;
    case 'area-checker':
      return <AreaChecker site={site} />;
    case 'booking-calendar':
      return <BookingCalendar site={site} />;
    case 'trade-tool':
      return <TradeTool site={site} />;
    case 'trust-bar':
      return (
        <Band>
          <TrustBar
            site={site}
            content={blockContentOf(
              site.blockContent,
              'trust-bar',
              defaultBlockContent(site, 'trust-bar')
            )}
          />
        </Band>
      );
    case 'guarantees':
      return (
        <Band>
          <GuaranteeList
            site={site}
            content={blockContentOf(
              site.blockContent,
              'guarantees',
              defaultBlockContent(site, 'guarantees')
            )}
          />
        </Band>
      );
    case 'testimonial':
      return (
        <Band>
          <TestimonialCard
            site={site}
            content={blockContentOf(
              site.blockContent,
              'testimonial',
              defaultBlockContent(site, 'testimonial')
            )}
          />
        </Band>
      );
    case 'team-member':
      return (
        <Band>
          <TeamMemberCard
            site={site}
            content={blockContentOf(
              site.blockContent,
              'team-member',
              defaultBlockContent(site, 'team-member')
            )}
          />
        </Band>
      );
    case 'project-stats':
      return (
        <Band>
          <ProjectStats
            site={site}
            content={blockContentOf(
              site.blockContent,
              'project-stats',
              defaultBlockContent(site, 'project-stats')
            )}
          />
        </Band>
      );
    case 'opening-hours':
      return (
        <Band>
          <OpeningHoursCard
            site={site}
            content={blockContentOf(
              site.blockContent,
              'opening-hours',
              defaultBlockContent(site, 'opening-hours')
            )}
          />
        </Band>
      );
    case 'availability':
      return (
        <Band>
          <AvailabilityCard
            site={site}
            content={blockContentOf(
              site.blockContent,
              'availability',
              defaultBlockContent(site, 'availability')
            )}
          />
        </Band>
      );
    case 'promotion':
      return (
        <Band>
          <PromotionBanner
            site={site}
            content={blockContentOf(
              site.blockContent,
              'promotion',
              defaultBlockContent(site, 'promotion')
            )}
          />
        </Band>
      );
    case 'service-areas':
      return (
        <Band>
          <ServiceAreaChips
            site={site}
            content={blockContentOf(
              site.blockContent,
              'service-areas',
              defaultBlockContent(site, 'service-areas')
            )}
          />
        </Band>
      );
    case 'contact-cta':
      return (
        <Band>
          <ContactCtaBanner
            site={site}
            content={blockContentOf(
              site.blockContent,
              'contact-cta',
              defaultBlockContent(site, 'contact-cta')
            )}
          />
        </Band>
      );
    default:
      return null;
  }
};

/** Padding around a content block, so every block sits at the same width. */
const Band: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="py-8 sm:py-16 px-4 sm:px-8 md:px-12">
    <div className="max-w-7xl mx-auto">{children}</div>
  </div>
);
