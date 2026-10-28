import React from 'react';
import { Quote } from 'lucide-react';
import type { ActiveSiteData, TestimonialContent } from '../../types';
import { StarRating } from '../Icons';

export interface TestimonialCardProps {
  site: ActiveSiteData;
  content: TestimonialContent;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({ site, content }) => {
  return (
    <article
      className="w-full p-6 sm:p-8 border flex flex-col gap-6"
      style={{
        background: site.card,
        borderColor: site.line,
        borderRadius: site.radiusLg,
        color: site.fg,
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <span
          className="w-11 h-11 flex items-center justify-center"
          style={{
            background: site.soft,
            color: site.accentText,
            borderRadius: site.radiusSm,
          }}
        >
          <Quote className="w-5 h-5" aria-hidden="true" />
        </span>
        <span style={{ color: site.accentText }}>
          <StarRating className="text-current" />
        </span>
      </div>

      <blockquote
        className="text-xl sm:text-2xl font-semibold leading-relaxed tracking-tight m-0"
        style={{ fontFamily: site.display }}
      >
        “{content.quote}”
      </blockquote>

      <footer
        className="pt-5 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
        style={{ borderColor: site.line }}
      >
        <div>
          <cite className="not-italic font-bold text-sm">{content.who}</cite>
          <p className="text-xs m-0 mt-1" style={{ color: site.muted }}>
            Klant van {site.biz}
          </p>
        </div>
        <span className="text-xs font-semibold" style={{ color: site.muted }}>
          {content.rating} uit 5 · {site.reviewCount} beoordelingen
        </span>
      </footer>
    </article>
  );
};
