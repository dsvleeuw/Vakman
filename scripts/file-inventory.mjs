#!/usr/bin/env node
// Maak een reproduceerbaar CSV-overzicht van de Git-index en origin-branches.
// Git-geschiedenis is de bron voor de datums; lokale bestandstijden zijn dat niet.
import { execFile, spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { devNull } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const OUTPUT = 'docs/bestandenoverzicht.csv';
const REMOTE_PREFIX = 'refs/remotes/origin/';
const CONCURRENCY = 8;
const TYPES = {
  '.avif': 'AVIF-afbeelding',
  '.css': 'CSS',
  '.csv': 'CSV-spreadsheet',
  '.gif': 'GIF-afbeelding',
  '.html': 'HTML',
  '.ico': 'Pictogram',
  '.jpeg': 'JPEG-afbeelding',
  '.jpg': 'JPEG-afbeelding',
  '.js': 'JavaScript',
  '.json': 'JSON',
  '.lock': 'Lockbestand',
  '.md': 'Markdown-document',
  '.mjs': 'JavaScript-module',
  '.mp3': 'Audio',
  '.mp4': 'Video',
  '.mts': 'TypeScript-module',
  '.pdf': 'PDF-document',
  '.png': 'PNG-afbeelding',
  '.sh': 'Shellscript',
  '.svg': 'SVG-afbeelding',
  '.ts': 'TypeScript',
  '.tsx': 'React / TypeScript',
  '.webmanifest': 'Webapp-manifest',
  '.webp': 'WebP-afbeelding',
  '.woff': 'Lettertype',
  '.woff2': 'Lettertype',
  '.xlsx': 'Excel-spreadsheet',
  '.yaml': 'YAML',
  '.yml': 'YAML',
};

function usage() {
  console.log(`Gebruik: node scripts/file-inventory.mjs [opties]

  --check              Controleer of het overzicht actueel is, zonder te schrijven
  --include-untracked  Neem ook niet-genegeerde, nog niet toegevoegde bestanden mee
  --branch NAAM        Gebruik deze branchnaam bij een detached HEAD
  --help               Toon deze hulp

De origin-branches worden niet automatisch opgehaald; voer eerst git fetch uit.`);
}

function optionsFrom(args) {
  const options = { check: false, includeUntracked: false, branch: null };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--check') options.check = true;
    else if (arg === '--include-untracked') options.includeUntracked = true;
    else if (arg === '--branch' && args[i + 1]) options.branch = args[++i];
    else if (arg === '--help') {
      usage();
      process.exit(0);
    } else throw new Error(`Onbekende of onvolledige optie: ${arg}`);
  }
  return options;
}

function git(args, { cwd, input, allowed = [0] } = {}) {
  const result = spawnSync('git', args, {
    cwd,
    input,
    encoding: 'buffer',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, LC_ALL: 'C' },
  });
  if (result.error) throw result.error;
  if (!allowed.includes(result.status)) {
    const detail = result.stderr.toString('utf8').trim();
    throw new Error(`git ${args[0]} is mislukt${detail ? `: ${detail}` : ''}`);
  }
  return { status: result.status, stdout: result.stdout };
}

function text(args, cwd, allowed) {
  return git(args, { cwd, allowed }).stdout.toString('utf8').replace(/\n$/, '');
}

function nulRecords(buffer) {
  const result = buffer.toString('utf8').split('\0');
  if (result.at(-1) === '') result.pop();
  return result;
}

function parseIndex(root) {
  const records = nulRecords(git(['ls-files', '--stage', '-z'], { cwd: root }).stdout);
  const files = new Map();
  for (const record of records) {
    const tab = record.indexOf('\t');
    const match = /^([0-7]{6}) [0-9a-f]+ ([0-3])$/.exec(record.slice(0, tab));
    if (tab < 0 || !match) throw new Error('Git-index kon niet worden gelezen.');
    if (match[2] !== '0') throw new Error('Los eerst de mergeconflicten in de Git-index op.');
    files.set(record.slice(tab + 1), match[1]);
  }
  return files;
}

function parseTree(root, oid) {
  const records = nulRecords(git(['ls-tree', '-r', '-z', '--full-tree', oid], { cwd: root }).stdout);
  const files = new Map();
  for (const record of records) {
    const tab = record.indexOf('\t');
    const match = /^([0-7]{6}) (?:blob|commit) [0-9a-f]+$/.exec(record.slice(0, tab));
    if (tab < 0 || !match) throw new Error('Git-branch kon niet worden gelezen.');
    files.set(record.slice(tab + 1), match[1]);
  }
  return files;
}

function collectBranches(root, options) {
  const attached = git(['symbolic-ref', '--quiet', '--short', 'HEAD'], {
    cwd: root,
    allowed: [0, 1],
  }).stdout.toString('utf8').replace(/\n$/, '');
  if (options.branch && attached && options.branch !== attached) {
    throw new Error(`HEAD staat op ${attached}, niet op ${options.branch}.`);
  }
  const currentBranch = options.branch || attached;
  if (!currentBranch) throw new Error('Detached HEAD: geef de branchnaam op met --branch NAAM.');

  const branches = new Map();
  const refs = text(['for-each-ref', '--format=%(refname)%00%(objectname)%00%(symref)', REMOTE_PREFIX], root);
  for (const line of refs ? refs.split('\n') : []) {
    const [ref, oid, symbolic] = line.split('\0');
    if (!ref.startsWith(REMOTE_PREFIX) || symbolic) continue; // origin/HEAD is geen branch.
    branches.set(ref.slice(REMOTE_PREFIX.length), { oid, files: parseTree(root, oid) });
  }

  const head = git(['rev-parse', '--verify', 'HEAD^{commit}'], { cwd: root, allowed: [0, 128] });
  const oid = head.status === 0 ? head.stdout.toString('utf8').trim() : null;
  const files = parseIndex(root);
  if (options.includeUntracked) {
    const untracked = nulRecords(git(['ls-files', '--others', '--exclude-standard', '-z'], { cwd: root }).stdout);
    for (const file of untracked) {
      const stat = lstatSync(path.join(root, file));
      files.set(file, stat.isSymbolicLink() ? '120000' : '100644');
    }
  }
  // Voor de huidige branch toont de index ook zojuist met git add toegevoegde bestanden.
  // Overschrijf dezelfde origin-branch om dubbele of verouderde regels te voorkomen.
  branches.set(currentBranch, { oid, files, headFiles: oid ? parseTree(root, oid) : new Map() });
  return branches;
}

function ignoredFiles(root, files) {
  if (files.length === 0) return new Set();
  const result = git(['-c', `core.excludesFile=${devNull}`, 'check-ignore', '--no-index', '-z', '--stdin'], {
    cwd: root,
    input: Buffer.from(`${files.join('\0')}\0`),
    allowed: [0, 1],
  });
  return new Set(nulRecords(result.stdout));
}

function compare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function describeFile(file, mode) {
  const name = path.posix.basename(file);
  const extension = path.posix.extname(name).toLowerCase();
  if (mode === '160000') return { name, extension, type: 'Git-submodule' };
  if (mode === '120000') return { name, extension, type: 'Symbolische link' };
  if (name === '.env.example') return { name, extension, type: 'Voorbeeldconfiguratie' };
  return { name, extension, type: TYPES[extension] || (extension ? 'Overig bestand' : 'Bestand zonder extensie') };
}

function csvCell(value) {
  let cell = String(value ?? '');
  // Quotes alleen voorkomen geen spreadsheetformules. Maak ook gevaarlijke
  // bestands-/branchnamen letterlijk bij openen in Excel of Google Sheets.
  if (/^[\t\r\n]/.test(cell) || /^\s*[=+\-@]/.test(cell)) cell = `'${cell}`;
  return `"${cell.replaceAll('"', '""')}"`;
}

function utc(date) {
  return new Date(date).toISOString().replace('.000Z', 'Z');
}

async function history(root, oid, file) {
  const { stdout } = await execFileAsync('git', [
    '--literal-pathspecs', 'log', '--follow', '--format=%cI', oid, '--', file,
  ], {
    cwd: root,
    env: { ...process.env, LC_ALL: 'C' },
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  const dates = stdout.trim().split('\n').filter(Boolean);
  if (dates.length === 0) return { first: '', last: '' };
  return { first: utc(dates.at(-1)), last: utc(dates[0]) };
}

async function fillHistory(root, rows) {
  const cache = new Map();
  let next = 0;
  async function worker() {
    while (next < rows.length) {
      const row = rows[next++];
      if (!row.oid || (row.headFiles && !row.headFiles.has(row.file))) continue;
      const key = `${row.oid}\0${row.file}`;
      if (!cache.has(key)) cache.set(key, history(root, row.oid, row.file));
      const dates = await cache.get(key);
      row.first = dates.first;
      // De gegenereerde CSV zou anders bij elke automatische commit weer
      // wijzigen en zo een oneindige updatecyclus veroorzaken.
      if (row.file !== OUTPUT) row.last = dates.last;
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, rows.length) }, worker));
}

async function main() {
  const options = optionsFrom(process.argv.slice(2));
  const root = text(['rev-parse', '--show-toplevel']);
  if (text(['rev-parse', '--is-shallow-repository'], root) === 'true') {
    throw new Error('De Git-geschiedenis is onvolledig. Voer eerst git fetch --unshallow origin uit.');
  }

  const branches = collectBranches(root, options);
  const allFiles = [...new Set([...branches.values()].flatMap(({ files }) => [...files.keys()]))];
  const ignored = ignoredFiles(root, allFiles);
  const rows = [];
  for (const [branch, snapshot] of branches) {
    for (const [file, mode] of snapshot.files) {
      if (path.posix.basename(file) === '.gitignore' || ignored.has(file)) continue;
      rows.push({ branch, file, mode, oid: snapshot.oid, headFiles: snapshot.headFiles, first: '', last: '' });
    }
  }
  rows.sort((a, b) => compare(a.branch, b.branch) || compare(a.file, b.file));
  await fillHistory(root, rows);

  const header = ['Bestand', 'Pad', 'Type', 'Extensie', 'Branch', 'Eerste commit (UTC)', 'Laatste wijziging (UTC)'];
  const lines = [header.map(csvCell).join(',')];
  for (const row of rows) {
    const { name, extension, type } = describeFile(row.file, row.mode);
    lines.push([name, row.file, type, extension, row.branch, row.first, row.last].map(csvCell).join(','));
  }
  // BOM maakt UTF-8 herkenbaar voor Excel; LF houdt Git-diffs leesbaar.
  const csv = `\uFEFF${lines.join('\n')}\n`;
  const output = path.join(root, OUTPUT);
  const previous = existsSync(output) ? readFileSync(output, 'utf8') : null;
  if (options.check) {
    if (previous !== csv) {
      console.error(`${OUTPUT} is niet actueel. Voer bun run inventory uit.`);
      process.exitCode = 1;
    } else console.log(`${OUTPUT} is actueel.`);
    return;
  }
  if (previous !== csv) {
    mkdirSync(path.dirname(output), { recursive: true });
    writeFileSync(output, csv, 'utf8');
  }
  const uniqueFiles = new Set(rows.map(({ file }) => file)).size;
  console.log(`${OUTPUT}: ${uniqueFiles} bestanden, ${branches.size} branches, ${rows.length} regels${previous === csv ? ' (ongewijzigd)' : ''}.`);
}

main().catch((error) => {
  console.error(`Bestandenoverzicht: ${error.message}`);
  process.exitCode = 1;
});
