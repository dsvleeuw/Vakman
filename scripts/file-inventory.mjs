#!/usr/bin/env node
// Eén regel per Git-bestandswijziging; bestaande regels blijven bewaard.
// De actuele vlag wordt per branch opnieuw bepaald op basis van de Git-boom.
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, writeFileSync } from 'node:fs';
import { devNull } from 'node:os';
import path from 'node:path';

const OUTPUT = 'docs/bestandenoverzicht.csv';
const REMOTE_PREFIX = 'refs/remotes/origin/';
const HEADERS = [
  'Bestand', 'Pad', 'Type', 'Extensie', 'Is actueel', 'Actueel op branches',
  'Branches (commit in geschiedenis)', 'Eerder gezien op branches', 'Wijziging', 'Git-status',
  'Vorige pad', 'Gelijkenis (%)', 'Commit', 'Korte commit', 'Oudercommits',
  'Commitdatum (UTC)', 'Auteurdatum (UTC)', 'Auteur', 'Auteur e-mail',
  'Committer', 'Committer e-mail', 'Commit onderwerp', 'Commit bericht',
  'Toegevoegde regels', 'Verwijderde regels', 'Binair', 'Grootte (bytes)',
  'Vorige grootte (bytes)', 'Git object-ID', 'Vorig object-ID', 'Modus',
  'Vorige modus', 'Commit-URL', 'Bestandsversie-URL', 'Bron',
  'Voor het eerst gezien (UTC)', 'Gebeurtenis-ID', 'Padcode', 'Vorige padcode',
];
const TYPES = {
  '.avif': 'AVIF-afbeelding', '.css': 'CSS', '.csv': 'CSV-spreadsheet',
  '.gif': 'GIF-afbeelding', '.html': 'HTML', '.ico': 'Pictogram',
  '.jpeg': 'JPEG-afbeelding', '.jpg': 'JPEG-afbeelding', '.js': 'JavaScript',
  '.json': 'JSON', '.lock': 'Lockbestand', '.md': 'Markdown-document',
  '.mjs': 'JavaScript-module', '.mp3': 'Audio', '.mp4': 'Video',
  '.mts': 'TypeScript-module', '.pdf': 'PDF-document', '.png': 'PNG-afbeelding',
  '.sh': 'Shellscript', '.svg': 'SVG-afbeelding', '.ts': 'TypeScript',
  '.tsx': 'React / TypeScript', '.webmanifest': 'Webapp-manifest',
  '.webp': 'WebP-afbeelding', '.woff': 'Lettertype', '.woff2': 'Lettertype',
  '.xlsx': 'Excel-spreadsheet', '.yaml': 'YAML', '.yml': 'YAML',
};
const CHANGES = {
  A: 'Toegevoegd', C: 'Gekopieerd', D: 'Verwijderd', M: 'Gewijzigd',
  R: 'Hernoemd', T: 'Type gewijzigd', U: 'Conflict', X: 'Onbekend',
};

function usage() {
  console.log(`Gebruik: node scripts/file-inventory.mjs [opties]

  --check              Controleer het overzicht zonder te schrijven
  --include-untracked  Toon ook niet-genegeerde, niet-toegevoegde lokale bestanden
  --rebuild            Bouw alleen uit de nu bereikbare Git-geschiedenis op
  --branch NAAM        Gebruik deze branchnaam bij een detached HEAD
  --help               Toon deze hulp

Haal eerst de origin-branches op. Alleen commits en lokale indexwijzigingen worden vastgelegd.`);
}

function optionsFrom(args) {
  const options = { check: false, includeUntracked: false, rebuild: false, branch: null };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--check') options.check = true;
    else if (arg === '--include-untracked') options.includeUntracked = true;
    else if (arg === '--rebuild') options.rebuild = true;
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
    cwd, input, encoding: 'buffer', maxBuffer: 64 * 1024 * 1024,
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
  const records = buffer.toString('utf8').split('\0');
  if (records.at(-1) === '') records.pop();
  return records;
}

function compare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sorted(values) {
  return [...values].sort(compare);
}

function utc(date) {
  return new Date(date).toISOString().replace('.000Z', 'Z');
}

function pathCode(file) {
  return `p:${Buffer.from(file, 'utf8').toString('base64url')}`;
}

function decodePath(code) {
  if (!code.startsWith('p:')) throw new Error('Ongeldige padcode in het bestaande overzicht.');
  const file = Buffer.from(code.slice(2), 'base64url').toString('utf8');
  if (!file || pathCode(file) !== code) throw new Error('Ongeldige padcode in het bestaande overzicht.');
  return file;
}

function csvCell(value) {
  let cell = String(value ?? '');
  // Quotes voorkomen geen formules in spreadsheetprogramma's; maak de cel letterlijk.
  if (/^[\t\r\n]/.test(cell) || /^\s*[=+\-@]/.test(cell)) cell = `'${cell}`;
  return `"${cell.replaceAll('"', '""')}"`;
}

function parseCsv(input) {
  const records = [];
  let record = [];
  let field = '';
  let quoted = false;
  let closed = false;
  const source = input.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
        closed = true;
      } else field += char;
    } else if (char === '"' && field === '' && !closed) quoted = true;
    else if (char === ',') {
      record.push(field);
      field = '';
      closed = false;
    } else if (char === '\n' || (char === '\r' && source[i + 1] === '\n')) {
      if (char === '\r') i += 1;
      record.push(field);
      records.push(record);
      record = [];
      field = '';
      closed = false;
    } else if (closed || char === '"') throw new Error('Het bestaande CSV-bestand is ongeldig.');
    else field += char;
  }
  if (quoted) throw new Error('Het bestaande CSV-bestand is onvolledig.');
  if (record.length || field || closed) {
    record.push(field);
    records.push(record);
  }
  return records;
}

function branchList(value) {
  try {
    const list = JSON.parse(value || '[]');
    if (!Array.isArray(list) || list.some((branch) => typeof branch !== 'string')) throw new Error();
    return new Set(list);
  } catch {
    throw new Error('Ongeldige branchlijst in het bestaande overzicht.');
  }
}

function existingEvents(previous, rebuild) {
  if (!previous || rebuild) return [];
  const [header, ...records] = parseCsv(previous);
  if (!header) return [];
  // Eenmalige migratie van het oorspronkelijke momentopname-formaat.
  if (header.includes('Eerste commit (UTC)') && header.includes('Branch') && !header.includes('Gebeurtenis-ID')) return [];
  if (header.length !== HEADERS.length || header.some((value, i) => value !== HEADERS[i])) {
    throw new Error('Onbekend CSV-formaat. Gebruik --rebuild om het overzicht opnieuw op te bouwen.');
  }
  const seenIds = new Set();
  return records.map((values) => {
    if (values.length !== HEADERS.length) throw new Error('Het bestaande CSV-bestand is onvolledig.');
    const row = Object.fromEntries(HEADERS.map((name, index) => [name, values[index]]));
    const id = row['Gebeurtenis-ID'];
    if (!id || seenIds.has(id)) throw new Error('Dubbele of ontbrekende gebeurtenis-ID in het overzicht.');
    seenIds.add(id);
    return {
      id, row, file: decodePath(row.Padcode),
      previousFile: row['Vorige padcode'] ? decodePath(row['Vorige padcode']) : '',
      seen: branchList(row['Eerder gezien op branches']),
      current: new Set(), reachable: new Set(),
      pending: row.Bron !== 'Commit',
    };
  });
}

function parseIndex(root) {
  const files = new Map();
  for (const record of nulRecords(git(['ls-files', '--stage', '-z'], { cwd: root }).stdout)) {
    const tab = record.indexOf('\t');
    const match = /^([0-7]{6}) ([0-9a-f]+) ([0-3])$/.exec(record.slice(0, tab));
    if (tab < 0 || !match) throw new Error('Git-index kon niet worden gelezen.');
    if (match[3] !== '0') throw new Error('Los eerst de mergeconflicten in de Git-index op.');
    files.set(record.slice(tab + 1), { mode: match[1], oid: match[2] });
  }
  return files;
}

function parseTree(root, oid) {
  const files = new Map();
  for (const record of nulRecords(git(['ls-tree', '-r', '-z', '--full-tree', oid], { cwd: root }).stdout)) {
    const tab = record.indexOf('\t');
    const match = /^([0-7]{6}) (?:blob|commit) ([0-9a-f]+)$/.exec(record.slice(0, tab));
    if (tab < 0 || !match) throw new Error('Git-branch kon niet worden gelezen.');
    files.set(record.slice(tab + 1), { mode: match[1], oid: match[2] });
  }
  return files;
}

function collectBranches(root, options) {
  const attached = git(['symbolic-ref', '--quiet', '--short', 'HEAD'], {
    cwd: root, allowed: [0, 1],
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
    if (ref.startsWith(REMOTE_PREFIX) && !symbolic) branches.set(ref.slice(REMOTE_PREFIX.length), oid);
  }
  const head = git(['rev-parse', '--verify', 'HEAD^{commit}'], { cwd: root, allowed: [0, 128] });
  const oid = head.status === 0 ? head.stdout.toString('utf8').trim() : null;
  branches.set(currentBranch, oid); // Lokale HEAD gaat vóór een eventueel verouderde origin-ref.
  return { branches, currentBranch };
}

function branchHistory(root, branches) {
  const cache = new Map();
  const membership = new Map();
  const info = new Map();
  for (const [branch, oid] of branches) {
    if (!oid) {
      info.set(branch, { tree: new Map(), firstParent: [] });
      continue;
    }
    if (!cache.has(oid)) {
      const all = text(['rev-list', oid], root).split('\n').filter(Boolean);
      const firstParent = text(['rev-list', '--first-parent', oid], root).split('\n').filter(Boolean);
      cache.set(oid, { all, firstParent, tree: parseTree(root, oid) });
    }
    const data = cache.get(oid);
    info.set(branch, data);
    for (const commit of data.all) {
      if (!membership.has(commit)) membership.set(commit, new Set());
      membership.get(commit).add(branch);
    }
  }
  const tips = [...new Set([...branches.values()].filter(Boolean))];
  const order = tips.length ? text(['rev-list', '--reverse', '--topo-order', ...tips], root).split('\n').filter(Boolean) : [];
  return { info, membership, order };
}

function commitMetadata(root, oid) {
  const format = '%H%x00%P%x00%aI%x00%an%x00%ae%x00%cI%x00%cn%x00%ce%x00%s%x00%B';
  const parts = text(['show', '-s', '--no-show-signature', '--encoding=UTF-8', `--format=format:${format}`, oid], root).split('\0');
  if (parts.length !== 10 || parts[0] !== oid) throw new Error(`Commit ${oid} kon niet worden gelezen.`);
  return {
    oid, parents: parts[1] ? parts[1].split(' ') : [], authorDate: utc(parts[2]),
    author: parts[3], authorEmail: parts[4], date: utc(parts[5]),
    committer: parts[6], committerEmail: parts[7], subject: parts[8],
    message: parts[9].replace(/\n+$/, ''),
  };
}

function diffOutput(root, { commit, parent, index = false }, format) {
  const command = index ? ['diff', '--cached'] : ['diff-tree', '--no-commit-id', '-r'];
  command.push(format, '-z', '--no-abbrev', '--find-renames', '--no-ext-diff', '--no-textconv', '--ignore-submodules=none');
  if (!index) command.push(...(parent ? [parent, commit] : ['--root', commit]));
  return git(command, { cwd: root }).stdout;
}

function noZero(oid) {
  return /^0+$/.test(oid) ? '' : oid;
}

function diffChanges(root, source) {
  const raw = nulRecords(diffOutput(root, source, '--raw'));
  const changes = [];
  for (let i = 0; i < raw.length; i += 1) {
    const match = /^:([0-7]{6}) ([0-7]{6}) ([0-9a-f]+) ([0-9a-f]+) ([A-Z])(\d*)$/.exec(raw[i]);
    if (!match || i + 1 >= raw.length) throw new Error('Git-wijzigingen konden niet worden gelezen.');
    let file = raw[++i];
    let previousFile = '';
    if (match[5] === 'R' || match[5] === 'C') {
      previousFile = file;
      if (i + 1 >= raw.length) throw new Error('Onvolledige hernoeming in Git-wijzigingen.');
      file = raw[++i];
    }
    changes.push({ oldMode: match[1], newMode: match[2], oldOid: noZero(match[3]), newOid: noZero(match[4]),
      status: match[5], score: match[6], file, previousFile });
  }
  const stats = new Map();
  const numstat = nulRecords(diffOutput(root, source, '--numstat'));
  for (let i = 0; i < numstat.length; i += 1) {
    const firstTab = numstat[i].indexOf('\t');
    const secondTab = numstat[i].indexOf('\t', firstTab + 1);
    if (firstTab < 0 || secondTab < 0) throw new Error('Git-regelaantallen konden niet worden gelezen.');
    const added = numstat[i].slice(0, firstTab);
    const deleted = numstat[i].slice(firstTab + 1, secondTab);
    let file = numstat[i].slice(secondTab + 1);
    if (!file) {
      if (i + 2 >= numstat.length) throw new Error('Onvolledige hernoeming in Git-regelaantallen.');
      i += 1; // Vorig pad.
      file = numstat[++i];
    }
    stats.set(file, { added: added === '-' ? '' : added, deleted: deleted === '-' ? '' : deleted,
      binary: added === '-' || deleted === '-' });
  }
  for (const change of changes) change.stats = stats.get(change.file) || null;
  return changes;
}

function ignoredFiles(root, files) {
  if (files.length === 0) return new Set();
  const result = git(['-c', `core.excludesFile=${devNull}`, 'check-ignore', '--no-index', '-z', '--stdin'], {
    cwd: root, input: Buffer.from(`${files.join('\0')}\0`), allowed: [0, 1],
  });
  return new Set(nulRecords(result.stdout));
}

function objectSizes(root, oids) {
  if (!oids.size) return new Map();
  const result = textBatch(root, ['cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize)'], `${[...oids].join('\n')}\n`);
  const sizes = new Map();
  for (const line of result.split('\n').filter(Boolean)) {
    const [oid, kind, size] = line.split(' ');
    if (kind === 'blob' && /^\d+$/.test(size || '')) sizes.set(oid, size);
  }
  return sizes;
}

function textBatch(root, args, input) {
  return git(args, { cwd: root, input: Buffer.from(input) }).stdout.toString('utf8');
}

function describeFile(file, mode) {
  const name = path.posix.basename(file);
  const extension = path.posix.extname(name).toLowerCase();
  if (mode === '160000') return { name, extension, type: 'Git-submodule' };
  if (mode === '120000') return { name, extension, type: 'Symbolische link' };
  if (name === '.env.example') return { name, extension, type: 'Voorbeeldconfiguratie' };
  return { name, extension, type: TYPES[extension] || (extension ? 'Overig bestand' : 'Bestand zonder extensie') };
}

function githubBase(root) {
  const remote = text(['remote', 'get-url', 'origin'], root, [0, 1, 2, 128]);
  const match = /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(remote);
  return match ? `https://github.com/${match[1]}/${match[2]}` : '';
}

function urlPath(file) {
  return file.split('/').map((part) => encodeURIComponent(part).replace(/[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)).join('/');
}

function makeRow(event, sizes, base, firstSeen) {
  const { file, oldMode, newMode, oldOid, newOid, status, score, stats, metadata, source } = event;
  const mode = newMode !== '000000' ? newMode : oldMode;
  const { name, extension, type } = describeFile(file, mode);
  const parent = metadata?.parents[0] || '';
  const commit = metadata?.oid || '';
  const commitUrl = base && commit ? `${base}/commit/${commit}` : '';
  const versionCommit = newOid ? commit : parent;
  const versionUrl = base && versionCommit ? `${base}/blob/${versionCommit}/${urlPath(file)}` : '';
  return {
    Bestand: name, Pad: file, Type: type, Extensie: extension,
    'Is actueel': 'FALSE', 'Actueel op branches': '[]',
    'Branches (commit in geschiedenis)': '[]', 'Eerder gezien op branches': '[]',
    Wijziging: CHANGES[status] || 'Onbekend', 'Git-status': status,
    'Vorige pad': event.previousFile || '', 'Gelijkenis (%)': score || '',
    Commit: commit, 'Korte commit': commit ? commit.slice(0, 12) : '',
    Oudercommits: JSON.stringify(metadata?.parents || []),
    'Commitdatum (UTC)': metadata?.date || '', 'Auteurdatum (UTC)': metadata?.authorDate || '',
    Auteur: metadata?.author || '', 'Auteur e-mail': metadata?.authorEmail || '',
    Committer: metadata?.committer || '', 'Committer e-mail': metadata?.committerEmail || '',
    'Commit onderwerp': metadata?.subject || '', 'Commit bericht': metadata?.message || '',
    'Toegevoegde regels': stats?.added ?? '', 'Verwijderde regels': stats?.deleted ?? '',
    Binair: stats ? (stats.binary ? 'TRUE' : 'FALSE') : '',
    'Grootte (bytes)': event.workingSize ?? (newMode === '160000' ? '' : sizes.get(newOid) || ''),
    'Vorige grootte (bytes)': oldMode === '160000' ? '' : sizes.get(oldOid) || '',
    'Git object-ID': newOid, 'Vorig object-ID': oldOid,
    Modus: newMode === '000000' ? '' : newMode, 'Vorige modus': oldMode === '000000' ? '' : oldMode,
    'Commit-URL': commitUrl, 'Bestandsversie-URL': versionUrl, Bron: source,
    'Voor het eerst gezien (UTC)': firstSeen, 'Gebeurtenis-ID': event.id,
    Padcode: pathCode(file), 'Vorige padcode': event.previousFile ? pathCode(event.previousFile) : '',
  };
}

function untrackedChanges(root, currentBranch) {
  const changes = [];
  const files = nulRecords(git(['ls-files', '--others', '--exclude-standard', '-z'], { cwd: root }).stdout);
  for (const file of files) {
    const absolute = path.join(root, file);
    const stat = lstatSync(absolute);
    const symlink = stat.isSymbolicLink();
    const content = symlink ? Buffer.from(readlinkSync(absolute)) : null;
    const oid = symlink
      ? git(['hash-object', '--stdin'], { cwd: root, input: content }).stdout.toString('utf8').trim()
      : text(['hash-object', '--no-filters', '--', file], root);
    changes.push({ file, previousFile: '', oldMode: '000000', newMode: symlink ? '120000' : '100644',
      oldOid: '', newOid: oid, status: 'A', score: '', stats: null, workingSize: String(symlink ? content.length : stat.size),
      source: 'Niet gevolgd', branch: currentBranch });
  }
  return changes;
}

function eventId(event) {
  const code = pathCode(event.file).slice(2);
  if (event.metadata) return `${event.metadata.oid}:${code}`;
  return `${event.source === 'Git-index' ? 'index' : 'werkboom'}:${pathCode(event.branch).slice(2)}:${code}:${event.status}:${event.oldOid || '0'}:${event.newOid || '0'}`;
}

function main() {
  const options = optionsFrom(process.argv.slice(2));
  const root = text(['rev-parse', '--show-toplevel']);
  if (text(['rev-parse', '--is-shallow-repository'], root) === 'true') {
    throw new Error('De Git-geschiedenis is onvolledig. Voer eerst git fetch --unshallow origin uit.');
  }
  const output = path.join(root, OUTPUT);
  const previous = existsSync(output) ? readFileSync(output, 'utf8') : null;
  const prior = existingEvents(previous, options.rebuild);
  const priorById = new Map(prior.map((event) => [event.id, event]));
  const { branches, currentBranch } = collectBranches(root, options);
  const { info, membership, order } = branchHistory(root, branches);
  parseIndex(root); // Weiger een onopgelost mergeconflict, ook zonder indexwijzigingen.
  const commits = new Map();
  const fresh = [];
  const allPaths = new Set(prior.flatMap(({ file, previousFile }) => [file, previousFile]).filter(Boolean));
  for (const oid of order) {
    const metadata = commitMetadata(root, oid);
    const changes = diffChanges(root, { commit: oid, parent: metadata.parents[0] });
    const events = changes.map((change) => ({ ...change, metadata, source: 'Commit' }));
    events.sort((a, b) => compare(a.file, b.file));
    commits.set(oid, events);
    fresh.push(...events);
  }
  const staged = diffChanges(root, { index: true }).map((change) => ({ ...change, source: 'Git-index', branch: currentBranch }));
  const untracked = options.includeUntracked ? untrackedChanges(root, currentBranch) : [];
  for (const event of [...fresh, ...staged, ...untracked]) {
    allPaths.add(event.file);
    if (event.previousFile) allPaths.add(event.previousFile);
  }
  const ignored = ignoredFiles(root, [...allPaths]);
  // Het overzicht zelf registreren zou bij iedere botcommit een nieuwe regel
  // opleveren en zo een oneindige reeks automatische commits veroorzaken.
  const excluded = (file) => !file || file === OUTPUT || path.posix.basename(file) === '.gitignore' || ignored.has(file);
  const sizes = objectSizes(root, new Set([...fresh, ...staged].flatMap(({ oldOid, newOid }) => [oldOid, newOid]).filter(Boolean)));
  const base = githubBase(root);
  const now = utc(new Date());
  const rows = prior.filter((event) => !event.pending && !excluded(event.file));
  const byId = new Map(rows.map((event) => [event.id, event]));

  function add(event) {
    if (excluded(event.file)) return null;
    if (excluded(event.previousFile)) event.previousFile = '';
    event.id = eventId(event);
    const old = priorById.get(event.id);
    const row = makeRow(event, sizes, base, old?.row['Voor het eerst gezien (UTC)'] || now);
    const entry = byId.get(event.id) || { id: event.id, seen: old?.seen || new Set(), current: new Set(), reachable: new Set() };
    entry.row = row;
    entry.file = event.file;
    entry.previousFile = event.previousFile;
    entry.pending = event.source !== 'Commit';
    if (!byId.has(event.id)) {
      byId.set(event.id, entry);
      rows.push(entry);
    }
    return entry;
  }

  for (const event of fresh) {
    const entry = add(event);
    if (!entry) continue;
    entry.reachable = new Set(membership.get(event.metadata.oid) || []);
    for (const branch of entry.reachable) entry.seen.add(branch);
  }

  // Eerste-ouderlijn: precies de laatste wijziging die de branchboom heeft
  // opgeleverd, ook wanneer een merge de inhoud van een andere branch inbrengt.
  const currentFor = new Map();
  for (const [branch, data] of info) {
    const remaining = new Map([...data.tree].filter(([file]) => !excluded(file)));
    for (const oid of data.firstParent) {
      for (const event of commits.get(oid) || []) {
        const expected = remaining.get(event.file);
        if (!expected || event.newMode !== expected.mode || event.newOid !== expected.oid) continue;
        const entry = byId.get(eventId(event));
        if (!entry) throw new Error(`De actuele versie van ${event.file} ontbreekt in het overzicht.`);
        entry.current.add(branch);
        currentFor.set(`${branch}\0${event.file}`, entry);
        remaining.delete(event.file);
      }
      if (!remaining.size) break;
    }
    if (remaining.size) throw new Error(`De actuele Git-versie van ${remaining.keys().next().value} kon niet worden gevonden.`);
  }

  // Indexregels zijn tijdelijk: zij worden na de commit vervangen door de
  // definitieve commitregel met auteur, datum en bericht.
  const visibleStaged = staged.filter((event) => !excluded(event.file));
  for (const event of staged) {
    for (const file of [event.file, event.previousFile].filter((value) => !excluded(value))) {
      currentFor.get(`${currentBranch}\0${file}`)?.current.delete(currentBranch);
    }
  }
  for (const event of visibleStaged) {
    const entry = add(event);
    entry.reachable.add(currentBranch);
    entry.seen.add(currentBranch);
    if (event.newMode !== '000000') entry.current.add(currentBranch);
  }
  for (const event of untracked) {
    const entry = add(event);
    if (!entry) continue;
    entry.seen.add(currentBranch); // Niet gevolgd: nog niet actueel op een Git-branch.
  }

  for (const entry of rows) {
    // Oude gebeurtenissen blijven staan, ook als hun branch inmiddels is weg.
    // Een nieuw ignore-patroon verwijdert het oude pad uit een hernoemingsregel.
    if (excluded(entry.previousFile)) {
      entry.row['Vorige pad'] = '';
      entry.row['Vorige padcode'] = '';
    }
    entry.row['Is actueel'] = entry.current.size ? 'TRUE' : 'FALSE';
    entry.row['Actueel op branches'] = JSON.stringify(sorted(entry.current));
    entry.row['Branches (commit in geschiedenis)'] = JSON.stringify(sorted(entry.reachable));
    entry.row['Eerder gezien op branches'] = JSON.stringify(sorted(entry.seen));
  }
  const lines = [HEADERS.map(csvCell).join(',')];
  for (const entry of rows) lines.push(HEADERS.map((name) => csvCell(entry.row[name])).join(','));
  const csv = `\uFEFF${lines.join('\n')}\n`;
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
  console.log(`${OUTPUT}: ${rows.length} wijzigingsregels, ${uniqueFiles} paden, ${branches.size} branches${previous === csv ? ' (ongewijzigd)' : ''}.`);
}

try {
  main();
} catch (error) {
  console.error(`Bestandenoverzicht: ${error.message}`);
  process.exitCode = 1;
}
