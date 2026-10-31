import test from 'node:test';
import assert from 'node:assert/strict';
import { TIMELINES, timelineSteps } from './timeline';
import { SECTORS } from './tradesData';

/**
 * De projecttijdlijn komt uit de gegevens van het vak (roadmap 8.11).
 * Elk vak kan zo zijn eigen stappen hebben, in zijn eigen woorden.
 */

test('elke stap heeft een icoon, een dag, een titel en een toelichting', () => {
  for (const [sector, steps] of Object.entries(TIMELINES)) {
    assert.ok(steps.length >= 3, `${sector} heeft minstens drie stappen`);
    for (const step of steps) {
      assert.ok(step.icon, `${sector}: de stap heeft een icoon`);
      assert.ok(step.day.length > 0, `${sector}: de stap heeft een dag`);
      assert.ok(step.title.length > 0, `${sector}: de stap heeft een titel`);
      assert.ok(step.description.length > 0, `${sector}: de stap heeft een toelichting`);
    }
  }
});

test('elk vak krijgt stappen, ook zonder eigen tijdlijn', () => {
  for (const sector of Object.keys(SECTORS)) {
    const steps = timelineSteps(sector as keyof typeof SECTORS);
    assert.ok(steps.length >= 3, `${sector} krijgt stappen`);
  }
});

test('de stappen van het vak komen uit de gegevens', () => {
  const timmerman = timelineSteps('timmerman');
  assert.equal(timmerman[0].title, 'Intake & inmeten');
  assert.equal(timmerman.length, TIMELINES.timmerman?.length);
});

test('de dagen lopen van vroeg naar laat', () => {
  const steps = timelineSteps('timmerman');
  const days = steps.map((step) => step.day);
  assert.deepEqual(days, ['Dag 1 – 2', 'Dag 3 – 5', 'Dag 6 – 9', 'Dag 10 – 14']);
});
