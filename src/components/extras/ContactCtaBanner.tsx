import React from 'react';
import { ArrowRight, Phone } from 'lucide-react';
import type { ActiveSiteData, ContactCtaContent } from '../../types';
import { buildSiteTelUrl } from '../../utils/contact';

export interface ContactCtaBannerProps {
  site: ActiveSiteData;
  content: ContactCtaContent;
}

export const ContactCtaBanner: React.FC<ContactCtaBannerProps> = ({ site, content }) => {
  return (
    <section
      className="w-full p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-8 items-center border"
      style={{
        background: site.invBg,
        color: site.invFg,
        borderColor: site.invLine,
        borderRadius: site.radiusLg,
      }}
      aria-label="Contact en offerte"
    >
      <div className="flex flex-col gap-4 max-w-2xl">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: site.invMuted }}>
          Bespreek jouw project
        </span>
        <h3
          className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight m-0"
          style={{ fontFamily: site.display, fontWeight: site.dw, letterSpacing: site.ls }}
        >
          {content.title}
        </h3>
        <p className="text-sm sm:text-base leading-relaxed m-0" style={{ color: site.invMuted }}>
          {content.description}
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:min-w-56">
        <a
          href="#prijs"
          className="h-13 px-6 flex items-center justify-center gap-2 text-sm font-bold"
          style={{
            background: site.hi,
            color: site.onHi,
            borderRadius: site.radius,
          }}
        >
          Bereken je prijs
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </a>
        <a
          href={buildSiteTelUrl(site.contactPhone)}
          className="h-13 px-6 flex items-center justify-center gap-2 text-sm font-bold border"
          style={{
            borderColor: site.invLine,
            color: site.invFg,
            borderRadius: site.radius,
          }}
        >
          <Phone className="w-4 h-4" aria-hidden="true" />
          {site.callLabel}
        </a>
        <span className="text-xs text-center" style={{ color: site.invMuted }}>
          Vrijblijvend · persoonlijk advies
        </span>
      </div>
    </section>
  );
};
