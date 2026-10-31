import React from 'react';
import type { ActiveSiteData } from '../../types';
import { EmergencyButton } from './EmergencyButton';
import { FaultReportForm } from './FaultReportForm';
import { SurfaceCalculator } from './SurfaceCalculator';
import { ProjectTimeline } from './ProjectTimeline';
import { RoofCheckForm } from './RoofCheckForm';
import { GardenPlanForm } from './GardenPlanForm';

interface TradeToolProps {
  site: ActiveSiteData;
}

/**
 * Renders the smart, trade-specific conversion tool defined by
 * SectorData.tool. Sectors without a tool render nothing — the
 * standard sections already cover the baseline expectations.
 */
export const TradeTool: React.FC<TradeToolProps> = ({ site }) => {
  switch (site.tool) {
    case 'emergency':
      return <EmergencyButton site={site} />;
    case 'fault-report':
      return <FaultReportForm site={site} />;
    case 'm2-calculator':
      return <SurfaceCalculator site={site} />;
    case 'timeline':
      return <ProjectTimeline site={site} />;
    case 'roof-check':
      return <RoofCheckForm site={site} />;
    case 'garden-plan':
      return <GardenPlanForm site={site} />;
    default:
      return null;
  }
};
