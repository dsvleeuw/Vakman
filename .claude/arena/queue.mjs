// Runs Arena tasks from build.json with at most N at the same time (default 1).
// Before each start it waits until the bridge has fewer than N active turns and
// nothing queued, plus a short gap so two prompts are never typed at once.
// Usage: node .claude/arena/queue.mjs [--parallel N] <task-id> [<task-id> ...]
import { spawn } from 'node:child_process';
import path from 'node:path';

const argv = process.argv.slice(2);
let parallel = 1;
const pi = argv.indexOf('--parallel');
if (pi !== -1) { parallel = Math.max(1, Number(argv[pi + 1]) || 1); argv.splice(pi, 2); }
const ids = argv;
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const stamp = () => new Date().toLocaleTimeString('nl-NL');
const START_GAP_MS = 90_000; // time for the bridge to type the previous prompt

async function bridgeFree() {
  try {
    const h = await (await fetch('http://127.0.0.1:20140/health')).json();
    return { free: h.ready && h.queue.active < parallel && h.queue.depth === 0, h };
  } catch (e) {
    return { free: false, h: null, error: e.message };
  }
}

async function waitForSlot() {
  let last = '';
  for (;;) {
    const { free, h, error } = await bridgeFree();
    if (free) return;
    const msg = h ? `bridge bezig: ${h.queue.active} actief, ${h.queue.depth} in wachtrij, ${h.browser?.accounts?.[0]?.pages?.length ?? '?'} tabs` : `bridge onbereikbaar: ${error}`;
    if (msg !== last) { console.log(`[${stamp()}] ${msg} — wacht...`); last = msg; }
    await new Promise((r) => setTimeout(r, 10_000));
  }
}

function runTask(id) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(here, 'run-task.mjs'), id], { stdio: ['ignore', 'pipe', 'pipe'] });
    const prefix = parallel > 1 ? `[${id}] ` : '';
    for (const stream of [child.stdout, child.stderr]) {
      let buf = '';
      stream.on('data', (d) => {
        buf += d;
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const l of lines) console.log(prefix + l);
      });
      stream.on('end', () => buf && console.log(prefix + buf));
    }
    child.on('close', (code) => resolve(code));
  });
}

console.log(`[${stamp()}] Wachtrij (${parallel} tegelijk): ${ids.join(' → ')}`);
const running = new Set();
let lastStart = 0;
for (const [i, id] of ids.entries()) {
  while (running.size >= parallel) await Promise.race(running);
  const gap = lastStart + START_GAP_MS - Date.now();
  if (gap > 0) await new Promise((r) => setTimeout(r, gap));
  await waitForSlot();
  console.log(`\n[${stamp()}] ######## ${i + 1}/${ids.length}: ${id} ########`);
  lastStart = Date.now();
  const p = runTask(id).then(() => running.delete(p));
  running.add(p);
}
await Promise.all(running);
console.log(`\n[${stamp()}] Wachtrij klaar.`);
