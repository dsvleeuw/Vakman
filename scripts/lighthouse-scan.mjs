#!/usr/bin/env node
/**
 * Lighthouse-scan over alle bedrijfssites uit de leadlijst.
 *
 * Draait de echte Lighthouse-CLI (geen API-key, geen limiet), één site per keer.
 * Werkt op je eigen machine of een VPS waar Chrome/Chromium aanwezig is.
 *
 *   npm run lh:scan                 # alle sites zonder score scannen
 *   npm run lh:scan -- --limit 10   # eerste 10 proberen
 *   npm run lh:scan -- --force      # alles opnieuw
 *   npm run lh:scan -- --desktop    # desktop-profiel i.p.v. mobiel
 *   npm run lh:merge                # scores in de CSV bijwerken
 *
 * Resultaat: leads/lh-cli-scores.json (herstartbaar; al gescande sites worden
 * overgeslagen). Met --merge worden de kolommen lh_* in de CSV bijgewerkt.
 *
 * Vereist: Node 18+ en een Chrome/Chromium. Zet CHROME_PATH als Lighthouse de
 * browser niet zelf vindt. Een lokaal geïnstalleerde lighthouse gebruiken:
 * LIGHTHOUSE_BIN=./node_modules/.bin/lighthouse npm run lh:scan
 */

import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');
const CATEGORIES = 'performance,seo,accessibility,best-practices';

// ---------------------------------------------------------------- argumenten
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const value = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};

const INPUT = value('input', join(ROOT, 'leads/leads-noord-holland.csv'));
const OUT = value('out', join(ROOT, 'leads/lh-cli-scores.json'));
const LIMIT = Number(value('limit', '0')) || Infinity;
const CONCURRENCY = Math.max(1, Number(value('concurrency', '2')) || 2);
const TIMEOUT_MS = Number(value('timeout', '90')) * 1000;
const FORCE = flag('force');
const MERGE = flag('merge');
const DESKTOP = flag('desktop');
const ONLY = value('only', '');
const BIN = process.env.LIGHTHOUSE_BIN || 'lighthouse';

// ---------------------------------------------------------------- CSV-lezen
/** Minimale RFC4180-parser: genoeg voor de leadlijst (quotes, komma's, newlines). */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const escape = (v) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

function toCsv(rows) {
  return rows.map((r) => r.map(escape).join(',')).join('\n') + '\n';
}

// ---------------------------------------------------------------- werk lijst
const table = parseCsv(readFileSync(INPUT, 'utf8'));
const head = table[0];
const col = (name) => {
  const i = head.indexOf(name);
  if (i < 0) throw new Error(`Kolom "${name}" ontbreekt in ${INPUT}`);
  return i;
};
const C = {
  nr: col('nr'),
  naam: col('bedrijfsnaam'),
  site: col('website'),
};

const onlySet = new Set(ONLY.split(',').map((s) => s.trim()).filter(Boolean));
const sites = table.slice(1)
  .filter((r) => r[C.site])
  .filter((r) => !onlySet.size || onlySet.has(r[C.nr]))
  .map((r) => ({ nr: r[C.nr], bedrijf: r[C.naam], website: r[C.site].trim() }));

const results = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const done = (nr) => results[nr] && !FORCE && (results[nr].performance !== null || results[nr].error);

const todo = sites.filter((s) => !done(s.nr)).slice(0, LIMIT);
if (!todo.length) {
  console.log(`Niets te doen: alle ${sites.length} sites hebben al een resultaat in ${OUT}.`);
  if (MERGE) mergeIntoCsv();
  else process.exit(0);
}

console.log(`Lighthouse-scan: ${todo.length} van ${sites.length} sites (${DESKTOP ? 'desktop' : 'mobiel'}), ${CONCURRENCY} tegelijk.`);

// ---------------------------------------------------------------- één meting
function runLighthouse(url) {
  const outPath = join(tmpdir(), `lh-${process.pid}-${Math.random().toString(36).slice(2)}.json`);
  const args = [
    ...(BIN === 'lighthouse' ? ['--yes', 'lighthouse@13'] : []),
    url,
    '--quiet',
    '--output=json',
    `--output-path=${outPath}`,
    `--only-categories=${CATEGORIES}`,
    `--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage${DESKTOP ? '' : ''}`,
    ...(DESKTOP ? ['--preset=desktop'] : []),
  ];
  if (!DESKTOP) args.push('--form-factor=mobile');

  return new Promise((resolve) => {
    const child = spawn(BIN === 'lighthouse' ? 'npx' : BIN, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    const timer = setTimeout(() => child.kill('SIGKILL'), TIMEOUT_MS);

    child.on('close', () => {
      clearTimeout(timer);
      try {
        const report = JSON.parse(readFileSync(outPath, 'utf8'));
        rmSync(outPath, { force: true });

        // Lighthouse schrijft ook bij een mislukte load een rapport (lege scores).
        // Dat als "geen meting" vastleggen, niet als vier nullen.
        const mislukt = report.runtimeError
          || String(report.finalDisplayedUrl ?? '').startsWith('chrome-error');
        if (mislukt) {
          const reden = report.runtimeError?.code
            ?? (report.runWarnings ?? []).find((w) => /ERR_|error/i.test(w))
            ?? 'pagina niet geladen';
          resolve({ error: String(reden).slice(0, 200) });
          return;
        }

        const score = (k) => (report.categories[k]?.score == null ? null : Math.round(report.categories[k].score * 100));
        const lcp = report.audits['largest-contentful-paint'];
        resolve({
          performance: score('performance'),
          seo: score('seo'),
          toegankelijkheid: score('accessibility'),
          best_practices: score('best-practices'),
          lcp_ms: lcp?.numericValue ? Math.round(lcp.numericValue) : null,
          lcp: lcp?.displayValue ?? null,
          lighthouse: report.lighthouseVersion ?? null,
          url_getest: report.finalDisplayedUrl ?? url,
        });
      } catch {
        rmSync(outPath, { force: true });
        const line = stderr.split('\n').find((l) => /ERR_|error|Error/i.test(l)) ?? stderr.trim().split('\n').pop();
        resolve({ error: (line || 'geen rapport').slice(0, 200) });
      }
    });
  });
}

// ---------------------------------------------------------------- uitvoeren
let index = 0;
let klaar = 0;

async function worker() {
  while (index < todo.length) {
    const site = todo[index++];
    const res = await runLighthouse(site.website);
    results[site.nr] = { ...site, ...res };
    klaar++;
    const label = res.error
      ? `fout: ${res.error}`
      : `perf ${res.performance ?? '–'} · seo ${res.seo ?? '–'} · a11y ${res.toegankelijkheid ?? '–'} · bp ${res.best_practices ?? '–'} · LCP ${res.lcp ?? '–'}`;
    console.log(`[${String(klaar).padStart(3)}/${todo.length}] ${site.website} — ${label}`);
    // meteen wegschrijven: een crash kost hooguit één site
    writeFileSync(OUT, JSON.stringify(results, null, 1));
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

// ---------------------------------------------------------------- samenvatting
const gescoord = Object.values(results).filter((r) => r.performance != null);
if (gescoord.length) {
  const avg = (k) => {
    const v = gescoord.map((r) => r[k]).filter((x) => x != null);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : '–';
  };
  console.log(`\nGemiddeld over ${gescoord.length} sites: performance ${avg('performance')} · seo ${avg('seo')} · toegankelijkheid ${avg('toegankelijkheid')} · best practices ${avg('best_practices')}`);
  console.log(`Onder de 50 performance: ${gescoord.filter((r) => r.performance < 50).length}`);
}
console.log(`Resultaten: ${OUT}`);
if (MERGE) mergeIntoCsv();

// ---------------------------------------------------------------- CSV bijwerken
function mergeIntoCsv() {
  const cols = ['lh_performance', 'lh_seo', 'lh_toegankelijkheid', 'lh_best_practices', 'lh_lcp', 'lh_meting'];
  for (const c of cols) if (!head.includes(c)) { head.push(c); table.forEach((r, i) => { if (i) r.push(''); }); }

  const idx = Object.fromEntries(cols.map((c) => [c, head.indexOf(c)]));
  let bijgewerkt = 0;

  for (const r of table.slice(1)) {
    const res = results[r[C.nr]];
    if (!res) continue;
    const zet = (k, v) => { r[idx[k]] = v == null ? '' : String(v); };
    zet('lh_performance', res.performance);
    zet('lh_seo', res.seo);
    zet('lh_toegankelijkheid', res.toegankelijkheid);
    zet('lh_best_practices', res.best_practices);
    zet('lh_lcp', res.lcp_ms);
    r[idx['lh_meting']] = res.performance != null ? 'ja' : (res.error ? 'geen' : r[idx['lh_meting']] || '');
    bijgewerkt++;
  }

  writeFileSync(INPUT, toCsv(table));
  console.log(`CSV bijgewerkt: ${bijgewerkt} rijen in ${INPUT}`);
}
