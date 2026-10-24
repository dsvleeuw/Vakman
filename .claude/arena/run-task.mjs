// Runs one Arena build task from build.json with live progress in the terminal.
// Usage: node .claude/arena/run-task.mjs <task-id> [startDelaySeconds]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [id, delayArg] = process.argv.slice(2);
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const spec = JSON.parse(fs.readFileSync(path.join(here, 'build.json'), 'utf8')).find((t) => t.id === id);
if (!spec) { console.error(`Onbekende taak: ${id}`); process.exit(2); }

const bridge = path.join(os.homedir(), '.arena-bridge');
const cli = path.join(bridge, 'arena-task.mjs');
const taskDir = path.join(bridge, 'tasks', id);
const chatsDir = path.join(bridge, 'chats');
const stamp = () => new Date().toLocaleTimeString('nl-NL');
const log = (msg) => console.log(`[${stamp()}] ${msg}`);
const line = (c = '=') => console.log(c.repeat(78));

line();
console.log(`TAAK  ${spec.id}`);
console.log(`REPO  ${spec.in}   mode: ${spec.mode || 'code'}   fix-rounds: ${spec.fix_rounds ?? 0}   arena-review: ${!!spec.arena_review}`);
line('-');
console.log('OPDRACHT\n' + spec.message.replace(/\. \(/g, '.\n  (') + '\n');
console.log('SCOPE');
for (const s of spec.scope.split(',')) console.log(`  - ${s}`);
console.log('\nACCEPTATIECRITERIA');
for (const a of spec.accept || []) console.log(`  [ ] ${a}`);
line();

const delay = Number(delayArg || 0);
if (delay) { log(`Wacht ${delay} s zodat de bridge niet overbelast raakt...`); await new Promise((r) => setTimeout(r, delay * 1000)); }

const promptFile = path.join(here, `${id}.prompt.md`);
fs.writeFileSync(promptFile, spec.message);
const args = [cli, 'run', id, '--in', spec.in, '--prompt-file', promptFile, '--scope', spec.scope, '--no-checkpoint'];
if (spec.mode) args.push('--mode', spec.mode);
// Small explicit file list so the scope files are not pasted into the prompt; Arena clones the repo itself.
if (spec.files) args.push('--files', ...spec.files.split(','));
// Arena clones the repo itself: no file contents and no context pack in the prompt.
if (spec.attach === false) args.push('--no-files');
if (spec.context === false) args.push('--no-context');
if (spec.run) args.push('--run');
if (spec.fix_rounds) args.push('--fix-rounds', String(spec.fix_rounds));
if (spec.arena_review) args.push('--arena-review');
for (const a of spec.accept || []) args.push('--accept', a);

log('Start Arena-taak...');
const started = Date.now();
let stdout = '';
const child = spawn(process.execPath, args, { cwd: process.cwd() });
child.stdout.on('data', (d) => (stdout += d));
child.stderr.on('data', (d) => process.stdout.write(`[${stamp()}] bridge: ${d}`));

// Live follow-up: state changes in status.json and new sections in the chat log.
let lastState = '';
const seen = new Map(); // chat file -> bytes already shown
const inPrompt = new Map(); // chat file -> currently inside our own prompt
const belongsToTask = (name) => {
  const full = path.join(chatsDir, name);
  if (fs.statSync(full).mtimeMs < started - 5000) return false;
  if (name.includes(`task-${id}.`) || name.endsWith(`task-${id}.md`)) return true;
  return /^# Arena chat .*\nTask: (\S+)/.exec(fs.readFileSync(full, 'utf8').slice(0, 300))?.[1]?.startsWith(id) ?? false;
};
const follow = setInterval(() => {
  try {
    const s = JSON.parse(fs.readFileSync(path.join(taskDir, 'status.json'), 'utf8'));
    const state = `${s.state}${s.turn ? ` (beurt ${s.turn})` : ''}${s.phase ? ` · ${s.phase}` : ''}`;
    if (state !== lastState) { log(`status: ${state}${s.url ? `  ${s.url}` : ''}`); lastState = state; }
  } catch {}
  try {
    for (const name of fs.readdirSync(chatsDir).filter((n) => n.endsWith('.md'))) {
      if (!seen.has(name)) {
        if (!belongsToTask(name)) continue;
        seen.set(name, 0);
        log(`nieuwe chat: ${name}`);
      }
      const text = fs.readFileSync(path.join(chatsDir, name), 'utf8');
      const from = seen.get(name);
      if (text.length <= from) continue;
      seen.set(name, text.length);
      for (const part of text.slice(from).split(/^(?=## )/m)) {
        const [head, ...rest] = part.split('\n');
        // Turn headers switch between our prompt (hidden) and Arena's reply (shown).
        if (/^## Orchestrator \(turn/.test(head)) { inPrompt.set(name, true); log(`chat: ${head.slice(3)} (prompt verstuurd)`); continue; }
        if (/^## Arena \(turn/.test(head)) { inPrompt.set(name, false); log(`chat: ${head.slice(3)}`); }
        else if (/^## (Retry|Error)/.test(head)) { log(`chat: ${head.slice(3)} ${rest.join(' ').trim().slice(0, 120)}`); continue; }
        if (inPrompt.get(name)) continue;
        const body = (head.startsWith('## Arena') ? rest.join('\n') : part).trim();
        if (!body) continue;
        const lines = body.split('\n');
        console.log(lines.slice(0, 15).map((l) => `    | ${l}`).join('\n') + (lines.length > 15 ? `\n    | ... (+${lines.length - 15} regels)` : ''));
      }
    }
  } catch {}
}, 5000);

child.on('close', (code) => {
  clearInterval(follow);
  line();
  log(`Klaar na ${Math.round((Date.now() - started) / 1000)} s (exitcode ${code})`);
  let r;
  try { r = JSON.parse(stdout.slice(stdout.indexOf('{'))); } catch {
    console.log(stdout || '(geen JSON-uitvoer: zie bridge-regels hierboven)');
    fs.writeFileSync(path.join(here, `${id}.result.json`), JSON.stringify({ id, state: 'error', error: 'no JSON output', code }));
    return;
  }
  if (r.error) console.log(`FOUT      ${String(r.error).split('\n')[0].slice(0, 200)}`);
  const c = r.check || {};
  console.log(`VERDICT   ${c.verdict ?? r.state ?? '?'}`);
  if (r.url) console.log(`CHAT      ${r.url}`);
  for (const p of c.problems || []) console.log(`PROBLEEM  ${typeof p === 'string' ? p : JSON.stringify(p)}`);
  for (const w of c.warnings || []) console.log(`WAARSCH.  ${typeof w === 'string' ? w : JSON.stringify(w)}`);
  for (const a of c.acceptance || []) console.log(`  [${a.pass ?? a.ok ? 'x' : ' '}] ${a.criterion ?? a.text ?? JSON.stringify(a)}`);
  for (const [k, v] of Object.entries(c.commands || {})) console.log(`CMD       ${k}: ${typeof v === 'object' ? (v.ok ? 'ok' : 'FAIL') : v}`);
  const files = r.changedFiles || r.files || c.changedFiles;
  if (files?.length) { console.log('BESTANDEN'); for (const f of files) console.log(`  - ${typeof f === 'string' ? f : f.path}`); }
  if (r.summary) { line('-'); console.log(r.summary); }
  line();
  fs.writeFileSync(path.join(here, `${id}.result.json`), stdout);
  log(`Resultaat opgeslagen in .claude/arena/${id}.result.json`);
});
