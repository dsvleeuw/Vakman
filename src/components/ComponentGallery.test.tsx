import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { COMPONENT_ENTRIES } from '../data/componentCatalog';
import { ComponentGallery } from './ComponentGallery';

const noop = () => undefined;

test('component gallery renders the complete inventory and default live preview', () => {
  const markup = renderToStaticMarkup(
    <ComponentGallery
      onGoHome={noop}
      onGoStart={noop}
      onChooseStyle={noop}
      onViewPublishedSite={noop}
    />
  );

  for (const entry of COMPONENT_ENTRIES) {
    assert.ok(markup.includes(entry.label), `Missing gallery entry: ${entry.label}`);
  }
  assert.ok(markup.includes('Alle bouwstenen.'));
  assert.ok(markup.includes('Vertrouwen en service'));
  assert.ok(markup.includes('30 componenten'));
});
