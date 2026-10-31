import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_TIMELINE, TIMELINES, timelineFor } from './timeline';
import { SECTORS } from './tradesData';

/**
 * De projecttijdlijn komt uit de gegevens van het vak (roadmap 8.11).
 * Elk vak kan zo zijn eigen stappen hebben, in zijn eigen woorden.
 */

test('elke stap heeft een icoon, een dag, een titel en een toelichting', () => {
  for (const [sector, timeline] of Object.entries(TIMELINES)) {
    assert.ok(timeline.steps.length >= 3, `${sector} heeft minstens drie stappen`);
    for (const step of timeline.steps) {
      assert.ok(step.icon, `${sector}: de stap heeft een icoon`);
      assert.ok(step.day.length > 0, `${sector}: de stap heeft een dag`);
      assert.ok(step.title.length > 0, `${sector}: de stap heeft een titel`);
      assert.ok(step.description.length > 0, `${sector}: de stap heeft een toelichting`);
    }
    assert.ok(timeline.title.length > 0, `${sector}: de tijdlijn heeft een titel`);
    assert.ok(timeline.lead.length > 0, `${sector}: de tijdlijn heeft een toelichting`);
  }
});

test('elk vak krijgt stappen, ook zonder eigen tijdlijn', () => {
  for (const sector of Object.keys(SECTORS)) {
    const steps = timelineFor(sector as keyof typeof SECTORS).steps;
    assert.ok(steps.length >= 3, `${sector} krijgt stappen`);
  }
});

test('de stappen van het vak komen uit de gegevens', () => {
  const timmerman = timelineFor('timmerman');
  assert.equal(timmerman.steps[0].title, 'Intake & inmeten');
  assert.equal(timmerman.steps.length, TIMELINES.timmerman?.steps.length);
});

test('de dagen lopen van vroeg naar laat', () => {
  const steps = timelineFor('timmerman').steps;
  const days = steps.map((step) => step.day);
  assert.deepEqual(days, ['Dag 1 – 2', 'Dag 3 – 5', 'Dag 6 – 9', 'Dag 10 – 14']);
});

test('de aannemer heeft zijn eigen, langere route', () => {
  const aannemer = timelineFor('aannemer');
  assert.equal(aannemer.title, 'Van de eerste scheppen spade tot de sleutel.');
  assert.equal(aannemer.steps.length, 5);
  assert.ok(
    aannemer.steps.some((step) => step.title.includes('Casco')),
    'de aannemer bouwt een casconummer'
  );
  // De belofte van de timmerman blijft voor de timmerman.
  assert.ok(!timelineFor('aannemer').title.includes('2 weken'));
});

test('een vak zonder eigen tijdlijn valt terug op de algemene route', () => {
  assert.equal(timelineFor('schilder').title, DEFAULT_TIMELINE.title);
  assert.equal(timelineFor('schilder').steps.length, DEFAULT_TIMELINE.steps.length);
});
