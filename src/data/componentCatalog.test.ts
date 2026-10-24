import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPONENT_ENTRIES, COMPONENT_FILTERS } from './componentCatalog';

const EXISTING_COMPONENT_FILES = [
  'components/AreaChecker.tsx',
  'components/BeforeAfterSlider.tsx',
  'components/BookingCalendar.tsx',
  'components/ContactSection.tsx',
  'components/FaqSection.tsx',
  'components/Header.tsx',
  'components/HeroStrip.tsx',
  'components/HowItWorks.tsx',
  'components/Icons.tsx',
  'components/ImageWithFallback.tsx',
  'components/PresetsSection.tsx',
  'components/PriceCalculator.tsx',
  'components/PricingSection.tsx',
  'components/SiteView.tsx',
  'components/WizardView.tsx',
  'components/tools/EmergencyButton.tsx',
  'components/tools/FaultReportForm.tsx',
  'components/tools/ProjectTimeline.tsx',
  'components/tools/SurfaceCalculator.tsx',
  'components/tools/TradeTool.tsx',
];

test('component catalog includes every existing module and ten additions', () => {
  const existingFiles = COMPONENT_ENTRIES.filter((entry) => !entry.isNew)
    .map((entry) => entry.file)
    .sort();
  const newEntries = COMPONENT_ENTRIES.filter((entry) => entry.isNew);

  assert.deepEqual(existingFiles, [...EXISTING_COMPONENT_FILES].sort());
  assert.equal(newEntries.length, 10);
  assert.equal(COMPONENT_ENTRIES.length, 30);
  assert.ok(newEntries.every((entry) => entry.category === 'Nieuw'));
});

test('component catalog ids and file paths are unique and valid', () => {
  const ids = COMPONENT_ENTRIES.map((entry) => entry.id);
  const files = COMPONENT_ENTRIES.map((entry) => entry.file);

  assert.equal(new Set(ids).size, COMPONENT_ENTRIES.length);
  assert.equal(new Set(files).size, COMPONENT_ENTRIES.length);
  for (const entry of COMPONENT_ENTRIES) {
    assert.ok(entry.file.startsWith('components/'));
    assert.ok(entry.file.endsWith(`/${entry.name}.tsx`));
    assert.ok(entry.label.length > 0);
    assert.ok(entry.description.length > 20);
  }
});

test('component filters cover every catalog category', () => {
  const categories = new Set(COMPONENT_ENTRIES.map((entry) => entry.category));

  assert.ok(COMPONENT_FILTERS.includes('Alles'));
  for (const category of categories) {
    assert.ok(COMPONENT_FILTERS.includes(category));
  }
});
