import test from 'node:test';
import assert from 'node:assert/strict';
import { track } from './analytics';

function withWindow<T>(value: unknown, run: () => T): T {
  const globals = globalThis as Record<string, unknown>;
  const hadWindow = 'window' in globals;
  const previous = globals.window;
  globals.window = value;
  try {
    return run();
  } finally {
    if (hadWindow) globals.window = previous;
    else delete globals.window;
  }
}

test('track is a no-op without a browser or a tag manager', () => {
  assert.doesNotThrow(() => track('page_view', { path: '/' }));
  assert.doesNotThrow(() => withWindow({}, () => track('wizard_step_view', { step: 'vak' })));
});

test('track pushes to dataLayer and gtag when they exist', () => {
  const dataLayer: Array<Record<string, unknown>> = [];
  const calls: unknown[][] = [];

  withWindow(
    {
      dataLayer,
      gtag: (...args: unknown[]) => {
        calls.push(args);
      },
    },
    () => {
      track('plan_select', { plan: 'pro', price: 995 });
    }
  );

  assert.deepEqual(dataLayer, [{ event: 'plan_select', plan: 'pro', price: 995 }]);
  assert.deepEqual(calls[0], ['event', 'plan_select', { plan: 'pro', price: 995 }]);
});

test('track survives a missing dataLayer but a present gtag', () => {
  const calls: unknown[][] = [];
  withWindow(
    { gtag: (...args: unknown[]) => calls.push(args) },
    () => track('whatsapp_click', { source: 'sticky-bar' })
  );
  assert.equal(calls.length, 1);
});
