import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { devNull, tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const generator = fileURLToPath(new URL('./file-inventory.mjs', import.meta.url));
const publisher = fileURLToPath(new URL('./publish-file-inventory.sh', import.meta.url));
const output = 'docs/bestandenoverzicht.csv';
const legacyHeader = '"Bestand","Pad","Type","Extensie","Branch","Eerste commit (UTC)","Laatste wijziging (UTC)"\n';
const cleanEnv = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: devNull, TZ: 'UTC' };
for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_PREFIX']) {
  delete cleanEnv[key];
}

function command(cwd, executable, args, { env = {}, allowed = [0] } = {}) {
  const result = spawnSync(executable, args, { cwd, encoding: 'utf8', env: { ...cleanEnv, ...env }, maxBuffer: 32 * 1024 * 1024 });
  if (result.error) throw result.error;
  assert.ok(allowed.includes(result.status), `${executable} ${args.join(' ')}: ${result.stderr}\n${result.stdout}`);
  return result;
}

function git(cwd, ...args) {
  return command(cwd, 'git', args).stdout.trim();
}

function repo(t) {
  const dir = mkdtempSync(path.join(tmpdir(), 'vakman-inventory-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  git(dir, 'init', '--quiet', '--initial-branch=work');
  git(dir, 'config', 'user.name', 'Inventory Test');
  git(dir, 'config', 'user.email', 'inventory@example.test');
  git(dir, 'config', 'commit.gpgsign', 'false');
  return dir;
}

function write(dir, file, content = 'example\n') {
  const destination = path.join(dir, file);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, content);
}

function commit(dir, message, date, extra = []) {
  command(dir, 'git', ['commit', '--quiet', ...extra, '-m', message], {
    env: { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
  });
  return git(dir, 'rev-parse', 'HEAD');
}

function generate(dir, args = [], allowed = [0]) {
  return command(dir, process.execPath, [generator, ...args], { allowed });
}

function readRows(dir) {
  // Ondersteunt ook komma's, quotes en regeleinden in paden en commitberichten.
  const input = readFileSync(path.join(dir, output), 'utf8').replace(/^\uFEFF/, '');
  const records = [];
  let record = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') {
        field += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      record.push(field);
      field = '';
    } else if (char === '\n' && !quoted) {
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else field += char;
  }
  assert.equal(quoted, false);
  const [header, ...body] = records;
  return body.map((values) => Object.fromEntries(header.map((name, index) => [name, values[index]])));
}

function forFile(rows, file) {
  const code = `p:${Buffer.from(file).toString('base64url')}`;
  return rows.filter((entry) => entry.Padcode === code);
}

function event(rows, file, hash) {
  return forFile(rows, file).find((entry) => entry.Commit === hash);
}

function currentBranches(row) {
  return JSON.parse(row['Actueel op branches']);
}

test('wijzigingsgeschiedenis, actuele branches en uitgebreide veilige metadata', (t) => {
  const dir = repo(t);
  const dangerous = '=SUM(1,2)\n"bestand".md';
  const apostrophe = `'${dangerous}`;
  git(dir, 'remote', 'add', 'origin', 'https://github.com/example/inventory.git');
  write(dir, '.gitignore', 'ignored/\n.env*\n!.env.example\n');
  write(dir, '.env.example');
  write(dir, 'README.md', 'first\n');
  write(dir, 'docs/oude-naam.md', 'unchanged content for rename detection\n');
  write(dir, 'notes.txt', 'obsolete\n');
  write(dir, 'image.bin', Buffer.from([0, 1, 2]));
  write(dir, dangerous);
  write(dir, apostrophe);
  symlinkSync('README.md', path.join(dir, 'link'));
  git(dir, 'add', '.');
  const first = commit(dir, 'First commit\n\nMore details, with "quotes".', '2024-01-01T10:00:00+02:00');
  git(dir, 'update-ref', 'refs/remotes/origin/main', first);
  git(dir, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main');

  git(dir, 'mv', 'docs/oude-naam.md', 'docs/nieuwe-naam.md');
  write(dir, 'README.md', 'first\nsecond\n');
  git(dir, 'rm', '--quiet', 'notes.txt');
  git(dir, 'add', 'README.md');
  const second = commit(dir, '=Change files\n\nDetailed body\nwith a second line.', '2024-01-02T09:00:00Z');
  git(dir, 'update-ref', 'refs/remotes/origin/feature/test', second);
  write(dir, 'src/nieuw.ts');
  git(dir, 'add', 'src/nieuw.ts');
  git(dir, 'update-index', '--add', '--cacheinfo', `160000,${second},vendor/module`);
  write(dir, 'ignored/geheim.csv', 'private data\n');
  git(dir, 'add', '-f', 'ignored/geheim.csv');
  write(dir, 'niet-toegevoegd.txt');
  write(dir, '.env.secret', 'private data\n');

  generate(dir);
  let rows = readRows(dir);
  const oldReadme = event(rows, 'README.md', first);
  const newReadme = event(rows, 'README.md', second);
  assert.equal(oldReadme['Is actueel'], 'TRUE');
  assert.deepEqual(currentBranches(oldReadme), ['main']);
  assert.deepEqual(currentBranches(newReadme), ['feature/test', 'work']);
  assert.deepEqual(JSON.parse(oldReadme['Branches (commit in geschiedenis)']), ['feature/test', 'main', 'work']);
  assert.equal(newReadme['Commitdatum (UTC)'], '2024-01-02T09:00:00Z');
  assert.equal(oldReadme['Auteurdatum (UTC)'], '2024-01-01T08:00:00Z');
  assert.equal(newReadme.Auteur, 'Inventory Test');
  assert.equal(newReadme['Auteur e-mail'], 'inventory@example.test');
  assert.equal(newReadme.Committer, 'Inventory Test');
  assert.equal(newReadme['Commit onderwerp'], "'=Change files");
  assert.match(newReadme['Commit bericht'], /^'=Change files\n\nDetailed body\nwith a second line\.$/);
  assert.equal(newReadme['Toegevoegde regels'], '1');
  assert.equal(newReadme['Verwijderde regels'], '0');
  assert.equal(newReadme.Binair, 'FALSE');
  assert.equal(newReadme['Grootte (bytes)'], '13');
  assert.ok(newReadme['Git object-ID']);
  assert.equal(newReadme['Commit-URL'], `https://github.com/example/inventory/commit/${second}`);
  assert.equal(newReadme['Bestandsversie-URL'], `https://github.com/example/inventory/blob/${second}/README.md`);
  assert.ok(newReadme['Voor het eerst gezien (UTC)'].endsWith('Z'));

  const renamed = event(rows, 'docs/nieuwe-naam.md', second);
  assert.equal(renamed.Wijziging, 'Hernoemd');
  assert.equal(renamed['Vorige pad'], 'docs/oude-naam.md');
  assert.deepEqual(currentBranches(renamed), ['feature/test', 'work']);
  assert.deepEqual(currentBranches(event(rows, 'docs/oude-naam.md', first)), ['main']);
  const deleted = event(rows, 'notes.txt', second);
  assert.equal(deleted.Wijziging, 'Verwijderd');
  assert.equal(deleted['Is actueel'], 'FALSE');
  assert.equal(deleted['Bestandsversie-URL'], `https://github.com/example/inventory/blob/${first}/notes.txt`);
  assert.deepEqual(currentBranches(event(rows, 'notes.txt', first)), ['main']);
  assert.equal(event(rows, 'image.bin', first).Binair, 'TRUE');
  assert.equal(event(rows, 'image.bin', first)['Grootte (bytes)'], '3');
  assert.equal(event(rows, 'link', first).Type, 'Symbolische link');

  const staged = forFile(rows, 'src/nieuw.ts')[0];
  assert.equal(staged.Bron, 'Git-index');
  assert.equal(staged.Commit, '');
  assert.equal(staged['Is actueel'], 'TRUE');
  assert.deepEqual(currentBranches(staged), ['work']);
  assert.equal(forFile(rows, 'vendor/module')[0].Type, 'Git-submodule');
  assert.ok(forFile(rows, '.env.example').length);
  assert.ok(rows.every((entry) => !entry.Pad.endsWith('.gitignore') && !entry.Pad.includes('geheim.csv')));
  assert.equal(forFile(rows, '.env.secret').length, 0);
  assert.equal(forFile(rows, 'niet-toegevoegd.txt').length, 0);
  assert.equal(forFile(rows, output).length, 0);
  assert.equal(event(rows, dangerous, first).Pad, `'${dangerous}`);
  assert.equal(event(rows, apostrophe, first).Pad, apostrophe);
  assert.notEqual(event(rows, dangerous, first)['Gebeurtenis-ID'], event(rows, apostrophe, first)['Gebeurtenis-ID']);
  assert.match(event(rows, dangerous, first)['Bestandsversie-URL'], /%3DSUM%281%2C2%29%0A%22bestand%22\.md$/);

  const before = readFileSync(path.join(dir, output), 'utf8');
  generate(dir, ['--check']);
  assert.equal(readFileSync(path.join(dir, output), 'utf8'), before);
  write(dir, 'src/tweede.ts');
  git(dir, 'add', 'src/tweede.ts');
  assert.equal(generate(dir, ['--check'], [1]).status, 1);
  assert.equal(readFileSync(path.join(dir, output), 'utf8'), before);
  generate(dir);
  rows = readRows(dir);
  assert.equal(forFile(rows, 'src/tweede.ts')[0].Bron, 'Git-index');
  assert.ok(rows.find((entry) => entry['Gebeurtenis-ID'] === oldReadme['Gebeurtenis-ID']));
  generate(dir, ['--include-untracked']);
  assert.equal(forFile(readRows(dir), 'niet-toegevoegd.txt')[0].Bron, 'Niet gevolgd');
  assert.equal(forFile(readRows(dir), 'niet-toegevoegd.txt')[0]['Is actueel'], 'FALSE');
  assert.equal(forFile(readRows(dir), '.env.secret').length, 0);
});

test('alleen gewijzigde bestanden krijgen regels; indexregels worden commitregels', (t) => {
  const dir = repo(t);
  write(dir, 'file.txt', 'first\n');
  write(dir, 'other.txt', 'unmodified\n');
  git(dir, 'add', '.');
  const first = commit(dir, 'initial', '2024-02-01T12:00:00Z');
  generate(dir);
  const initial = readRows(dir);
  const firstSeen = event(initial, 'file.txt', first)['Voor het eerst gezien (UTC)'];
  write(dir, 'file.txt', 'second\n');
  git(dir, 'add', 'file.txt');
  generate(dir);
  let rows = readRows(dir);
  assert.equal(forFile(rows, 'file.txt').length, 2);
  assert.equal(event(rows, 'file.txt', first)['Is actueel'], 'FALSE');
  assert.equal(forFile(rows, 'file.txt').find((r) => r.Bron === 'Git-index')['Is actueel'], 'TRUE');
  const second = commit(dir, 'change file', '2024-02-02T12:00:00Z');
  generate(dir);
  rows = readRows(dir);
  assert.equal(forFile(rows, 'file.txt').length, 2);
  assert.equal(forFile(rows, 'file.txt').filter((r) => r.Bron === 'Git-index').length, 0);
  assert.equal(event(rows, 'file.txt', second)['Is actueel'], 'TRUE');
  assert.equal(event(rows, 'file.txt', first)['Voor het eerst gezien (UTC)'], firstSeen);
  assert.equal(forFile(rows, 'other.txt').length, 1);
  const beforeEmptyCommit = readFileSync(path.join(dir, output), 'utf8');
  commit(dir, 'empty commit', '2024-02-03T12:00:00Z', ['--allow-empty']);
  generate(dir);
  assert.equal(readFileSync(path.join(dir, output), 'utf8'), beforeEmptyCommit);

  // Een extra branch met dezelfde historie verandert vlaggen, maar voegt geen regels toe.
  const ids = readRows(dir).map((row) => row['Gebeurtenis-ID']);
  git(dir, 'update-ref', 'refs/remotes/origin/extra', 'HEAD');
  generate(dir);
  rows = readRows(dir);
  assert.deepEqual(rows.map((row) => row['Gebeurtenis-ID']), ids);
  assert.deepEqual(currentBranches(event(rows, 'file.txt', second)), ['extra', 'work']);

  // De spreadsheet zelf wordt niet gelogd: botcommits veroorzaken geen lus.
  git(dir, 'add', output);
  commit(dir, 'automated refresh', '2024-02-04T12:00:00Z');
  const afterSheetCommit = readFileSync(path.join(dir, output), 'utf8');
  generate(dir);
  assert.equal(readFileSync(path.join(dir, output), 'utf8'), afterSheetCommit);
  assert.equal(forFile(readRows(dir), output).length, 0);
  generate(dir, ['--check']);
});

test('mergeversies zijn actueel op de juiste branch en wijzigen geen andere bestanden', (t) => {
  const dir = repo(t);
  write(dir, 'base.txt', 'base\n');
  git(dir, 'add', '.');
  const base = commit(dir, 'base', '2024-03-01T00:00:00Z');
  write(dir, 'feature.txt', 'feature\n');
  git(dir, 'add', 'feature.txt');
  const featureTree = git(dir, 'write-tree');
  const feature = git(dir, 'commit-tree', featureTree, '-p', base, '-m', 'feature');
  git(dir, 'reset', '--quiet', '--hard', 'HEAD');
  git(dir, 'update-ref', 'refs/remotes/origin/feature', feature);
  write(dir, 'work.txt', 'work\n');
  git(dir, 'add', 'work.txt');
  const work = commit(dir, 'work', '2024-03-02T00:00:00Z');
  write(dir, 'feature.txt', 'feature\n');
  git(dir, 'add', 'feature.txt');
  const mergeTree = git(dir, 'write-tree');
  const merge = git(dir, 'commit-tree', mergeTree, '-p', work, '-p', feature, '-m', 'merge feature');
  git(dir, 'update-ref', 'refs/heads/work', merge);
  git(dir, 'reset', '--quiet', '--hard', merge);
  generate(dir);
  const rows = readRows(dir);
  assert.deepEqual(currentBranches(event(rows, 'feature.txt', feature)), ['feature']);
  assert.deepEqual(currentBranches(event(rows, 'feature.txt', merge)), ['work']);
  assert.deepEqual(JSON.parse(event(rows, 'feature.txt', feature)['Branches (commit in geschiedenis)']), ['feature', 'work']);
  assert.deepEqual(JSON.parse(event(rows, 'feature.txt', merge).Oudercommits), [work, feature]);
  assert.equal(event(rows, 'work.txt', merge), undefined);
  assert.equal(event(rows, 'base.txt', merge), undefined);
  assert.equal(forFile(rows, 'work.txt').length, 1);
});

test('verwijderde branches behouden historie; rebuild en ignore-regels kunnen die wissen', (t) => {
  const dir = repo(t);
  write(dir, '.gitignore', 'private/\n');
  write(dir, 'base.txt');
  git(dir, 'add', '.');
  const base = commit(dir, 'base', '2024-04-01T00:00:00Z');
  write(dir, 'feature-only.md', 'old feature\n');
  git(dir, 'add', 'feature-only.md');
  const tree = git(dir, 'write-tree');
  const feature = git(dir, 'commit-tree', tree, '-p', base, '-m', 'feature');
  git(dir, 'reset', '--quiet', '--hard', 'HEAD');
  git(dir, 'update-ref', 'refs/remotes/origin/feature', feature);
  generate(dir);
  const featureRow = event(readRows(dir), 'feature-only.md', feature);
  assert.deepEqual(currentBranches(featureRow), ['feature']);
  git(dir, 'update-ref', '-d', 'refs/remotes/origin/feature');
  generate(dir);
  let retained = event(readRows(dir), 'feature-only.md', feature);
  assert.ok(retained);
  assert.equal(retained['Is actueel'], 'FALSE');
  assert.deepEqual(JSON.parse(retained['Branches (commit in geschiedenis)']), []);
  assert.deepEqual(JSON.parse(retained['Eerder gezien op branches']), ['feature']);
  generate(dir, ['--check']);
  generate(dir, ['--rebuild']);
  assert.equal(event(readRows(dir), 'feature-only.md', feature), undefined);

  git(dir, 'update-ref', 'refs/remotes/origin/feature', feature);
  generate(dir);
  write(dir, '.gitignore', 'private/\nfeature-only.md\n');
  generate(dir);
  retained = event(readRows(dir), 'feature-only.md', feature);
  assert.equal(retained, undefined);
});

test('detached HEAD, onvolledige historie en ongeldige bestaande CSV worden veilig behandeld', (t) => {
  const dir = repo(t);
  write(dir, 'first.txt');
  git(dir, 'add', '.');
  commit(dir, 'first', '2024-05-01T00:00:00Z');
  write(dir, 'second.txt');
  git(dir, 'add', '.');
  commit(dir, 'second', '2024-05-02T00:00:00Z');
  assert.match(generate(dir, ['--branch', 'wrong'], [1]).stderr, /HEAD staat op work/);
  git(dir, 'checkout', '--quiet', '--detach', 'HEAD');
  assert.match(generate(dir, [], [1]).stderr, /Detached HEAD/);
  generate(dir, ['--branch', 'work']);
  assert.ok(forFile(readRows(dir), 'second.txt').length);
  write(dir, output, 'unexpected format\n');
  assert.match(generate(dir, ['--branch', 'work'], [1]).stderr, /Onbekend CSV-formaat/);
  generate(dir, ['--branch', 'work', '--rebuild']);

  const clone = `${dir}-shallow`;
  t.after(() => rmSync(clone, { recursive: true, force: true }));
  command(dir, 'git', ['clone', '--quiet', '--depth=1', `file://${dir}`, clone]);
  assert.equal(git(clone, 'rev-parse', '--is-shallow-repository'), 'true');
  assert.match(generate(clone, [], [1]).stderr, /git fetch --unshallow/);
});

test('publicatie werkt op een tijdelijk remote, is idempotent en bewaart oude branchhistorie', (t) => {
  const dir = repo(t);
  const bare = `${dir}-remote.git`;
  t.after(() => rmSync(bare, { recursive: true, force: true }));
  command(dir, 'git', ['init', '--quiet', '--bare', bare]);
  git(dir, 'remote', 'add', 'origin', bare);
  mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  copyFileSync(generator, path.join(dir, 'scripts/file-inventory.mjs'));
  copyFileSync(publisher, path.join(dir, 'scripts/publish-file-inventory.sh'));
  write(dir, output, legacyHeader);
  write(dir, 'tracked.txt');
  git(dir, 'add', '.');
  commit(dir, 'initial', '2024-06-01T00:00:00Z');
  git(dir, 'push', '--quiet', 'origin', 'work');

  assert.match(command(dir, 'bash', [publisher, 'work'], { env: { GITHUB_ACTIONS: '' }, allowed: [1] }).stderr, /alleen/);
  write(dir, 'niet-kwijtraken.txt', 'local\n');
  assert.match(command(dir, 'bash', [publisher, 'work'], { env: { GITHUB_ACTIONS: 'true' }, allowed: [1] }).stderr, /niet schoon/);
  assert.equal(readFileSync(path.join(dir, 'niet-kwijtraken.txt'), 'utf8'), 'local\n');
  rmSync(path.join(dir, 'niet-kwijtraken.txt'));

  const publish = () => command(dir, 'bash', [publisher, 'work'], { env: { GITHUB_ACTIONS: 'true' } });
  publish();
  const refreshed = git(dir, 'rev-parse', 'HEAD');
  assert.equal(git(dir, 'diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'), output);
  assert.equal(git(dir, 'rev-parse', 'refs/remotes/origin/work'), refreshed);
  assert.equal(forFile(readRows(dir), 'tracked.txt')[0]['Is actueel'], 'TRUE');
  publish();
  assert.equal(git(dir, 'rev-parse', 'HEAD'), refreshed);

  write(dir, 'feature-alleen.md');
  git(dir, 'add', 'feature-alleen.md');
  const tree = git(dir, 'write-tree');
  const feature = git(dir, 'commit-tree', tree, '-p', 'HEAD', '-m', 'feature');
  git(dir, 'reset', '--quiet', '--hard', 'HEAD');
  git(dir, 'push', '--quiet', 'origin', `${feature}:refs/heads/feature/test`);
  assert.equal(existsSync(path.join(dir, 'feature-alleen.md')), false);
  publish();
  assert.deepEqual(currentBranches(event(readRows(dir), 'feature-alleen.md', feature)), ['feature/test']);
  assert.equal(git(dir, 'diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'), output);

  git(dir, 'push', '--quiet', 'origin', ':refs/heads/feature/test');
  publish();
  const retained = event(readRows(dir), 'feature-alleen.md', feature);
  assert.equal(retained['Is actueel'], 'FALSE');
  assert.deepEqual(JSON.parse(retained['Eerder gezien op branches']), ['feature/test']);
  const last = git(dir, 'rev-parse', 'HEAD');
  publish();
  assert.equal(git(dir, 'rev-parse', 'HEAD'), last);
});

test('een gelijktijdige push wordt opgehaald en niet overschreven', (t) => {
  const dir = repo(t);
  const bare = `${dir}-race.git`;
  const bin = `${dir}-bin`;
  t.after(() => {
    rmSync(bare, { recursive: true, force: true });
    rmSync(bin, { recursive: true, force: true });
  });
  command(dir, 'git', ['init', '--quiet', '--bare', bare]);
  git(dir, 'remote', 'add', 'origin', bare);
  mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  copyFileSync(generator, path.join(dir, 'scripts/file-inventory.mjs'));
  copyFileSync(publisher, path.join(dir, 'scripts/publish-file-inventory.sh'));
  write(dir, output, legacyHeader);
  write(dir, 'basis.txt');
  git(dir, 'add', '.');
  commit(dir, 'initial', '2024-07-01T00:00:00Z');
  git(dir, 'push', '--quiet', 'origin', 'work');
  write(dir, 'gelijktijdige-wijziging.txt', 'behouden\n');
  git(dir, 'add', 'gelijktijdige-wijziging.txt');
  const tree = git(dir, 'write-tree');
  const racingCommit = git(dir, 'commit-tree', tree, '-p', 'HEAD', '-m', 'concurrent change');
  git(dir, 'reset', '--quiet', '--hard', 'HEAD');
  git(dir, 'push', '--quiet', 'origin', `${racingCommit}:refs/heads/racing-object`);

  mkdirSync(bin, { recursive: true });
  const realGit = command(dir, 'which', ['git']).stdout.trim();
  const wrapper = path.join(bin, 'git');
  writeFileSync(wrapper, `#!/usr/bin/env bash\nset -e\nif [[ "\${1:-}" == push && ! -e "$RACE_MARKER" ]]; then\n  "$REAL_GIT" --git-dir="$RACE_REMOTE" update-ref refs/heads/work "$RACE_COMMIT"\n  touch "$RACE_MARKER"\nfi\nexec "$REAL_GIT" "$@"\n`);
  chmodSync(wrapper, 0o755);
  const result = command(dir, 'bash', [publisher, 'work'], {
    env: { GITHUB_ACTIONS: 'true', PATH: `${bin}${path.delimiter}${cleanEnv.PATH}`,
      REAL_GIT: realGit, RACE_REMOTE: bare, RACE_COMMIT: racingCommit, RACE_MARKER: path.join(bin, 'injected') },
  });
  assert.match(result.stdout, /poging 1\/3/);
  git(dir, 'merge-base', '--is-ancestor', racingCommit, 'HEAD');
  assert.equal(readFileSync(path.join(dir, 'gelijktijdige-wijziging.txt'), 'utf8'), 'behouden\n');
  assert.ok(currentBranches(event(readRows(dir), 'gelijktijdige-wijziging.txt', racingCommit)).includes('work'));
  assert.equal(git(dir, 'diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'), output);
  assert.equal(git(dir, 'rev-parse', 'HEAD'), git(bare, 'rev-parse', 'refs/heads/work'));
});

test('een revert en een moduswijziging leveren een nieuwe actuele versie op', (t) => {
  const dir = repo(t);
  write(dir, 'file.sh', 'first\n');
  git(dir, 'add', '.');
  const first = commit(dir, 'first', '2024-08-01T00:00:00Z');
  write(dir, 'file.sh', 'second\n');
  git(dir, 'add', 'file.sh');
  const second = commit(dir, 'second', '2024-08-02T00:00:00Z');
  write(dir, 'file.sh', 'first\n');
  git(dir, 'add', 'file.sh');
  const revert = commit(dir, 'revert', '2024-08-03T00:00:00Z');
  git(dir, 'update-index', '--chmod=+x', 'file.sh');
  const chmod = commit(dir, 'make executable', '2024-08-04T00:00:00Z');
  generate(dir);
  const rows = readRows(dir);
  assert.equal(forFile(rows, 'file.sh').length, 4);
  assert.equal(event(rows, 'file.sh', first)['Is actueel'], 'FALSE');
  assert.equal(event(rows, 'file.sh', second)['Is actueel'], 'FALSE');
  assert.equal(event(rows, 'file.sh', revert)['Is actueel'], 'FALSE');
  assert.equal(event(rows, 'file.sh', chmod)['Is actueel'], 'TRUE');
  assert.equal(event(rows, 'file.sh', chmod)['Vorig object-ID'], event(rows, 'file.sh', chmod)['Git object-ID']);
  assert.equal(event(rows, 'file.sh', chmod)['Vorige modus'], '100644');
  assert.equal(event(rows, 'file.sh', chmod).Modus, '100755');
});

test('een staged hernoeming naar een genegeerd pad laat geen oude versie als actueel staan', (t) => {
  const dir = repo(t);
  write(dir, '.gitignore', 'private/\n');
  write(dir, 'visible.txt', 'a long file to ensure rename detection\n');
  git(dir, 'add', '.');
  const initial = commit(dir, 'initial', '2024-09-01T00:00:00Z');
  generate(dir);
  mkdirSync(path.join(dir, 'private'), { recursive: true });
  git(dir, 'mv', '-f', 'visible.txt', 'private/secret.txt');
  generate(dir);
  const rows = readRows(dir);
  assert.equal(event(rows, 'visible.txt', initial)['Is actueel'], 'FALSE');
  assert.equal(forFile(rows, 'private/secret.txt').length, 0);
});
