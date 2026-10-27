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
const cleanEnv = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: devNull, TZ: 'UTC' };
for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_PREFIX']) {
  delete cleanEnv[key];
}

function command(cwd, executable, args, { env = {}, allowed = [0] } = {}) {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: 'utf8',
    env: { ...cleanEnv, ...env },
    maxBuffer: 16 * 1024 * 1024,
  });
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

function commit(dir, message, date) {
  command(dir, 'git', ['commit', '--quiet', '-m', message], {
    env: { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
  });
}

function generate(dir, args = [], allowed = [0]) {
  return command(dir, process.execPath, [generator, ...args], { allowed });
}

function readRows(dir) {
  // CSV-parser voor de tests: ook komma's, quotes en regeleinden in paden.
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

function row(rows, branch, file) {
  return rows.find((entry) => entry.Branch === branch && entry.Pad === file);
}

test('inventariseert branches, de index, Git-tijden en veilige CSV zonder genegeerde bestanden', (t) => {
  const dir = repo(t);
  const dangerousName = '=SUM(1,2)\n"bestand".md';
  write(dir, '.gitignore', 'ignored/\n.env*\n!.env.example\n');
  write(dir, '.env.example');
  write(dir, 'README.md', 'first\n');
  write(dir, 'docs/oude-naam.md', 'unchanged content for rename detection\n');
  write(dir, dangerousName);
  symlinkSync('README.md', path.join(dir, 'link'));
  git(dir, 'add', '.');
  commit(dir, 'first', '2024-01-01T10:00:00+02:00');
  git(dir, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
  git(dir, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main');

  git(dir, 'mv', 'docs/oude-naam.md', 'docs/nieuwe-naam.md');
  commit(dir, 'rename', '2024-01-02T09:00:00+00:00');
  git(dir, 'update-ref', 'refs/remotes/origin/feature/test', 'HEAD');
  write(dir, 'src/nieuw.ts');
  git(dir, 'add', 'src/nieuw.ts');
  git(dir, 'update-index', '--add', '--cacheinfo', `160000,${git(dir, 'rev-parse', 'HEAD')},vendor/module`);
  write(dir, 'ignored/geheim.csv', 'private data\n');
  git(dir, 'add', '-f', 'ignored/geheim.csv'); // ook geforceerd toegevoegde ignore-paden uitsluiten
  write(dir, 'niet-toegevoegd.txt');
  write(dir, '.env.secret', 'private data\n');

  generate(dir);
  const rows = readRows(dir);
  assert.deepEqual([...new Set(rows.map((entry) => entry.Branch))], ['feature/test', 'main', 'work']);
  assert.ok(row(rows, 'main', 'docs/oude-naam.md'));
  assert.equal(row(rows, 'main', 'docs/nieuwe-naam.md'), undefined);
  assert.equal(row(rows, 'feature/test', 'src/nieuw.ts'), undefined);
  assert.equal(row(rows, 'work', 'src/nieuw.ts')['Eerste commit (UTC)'], '');
  assert.equal(row(rows, 'work', 'src/nieuw.ts')['Laatste wijziging (UTC)'], '');
  assert.equal(row(rows, 'work', 'src/nieuw.ts').Type, 'TypeScript');
  assert.equal(row(rows, 'work', 'link').Type, 'Symbolische link');
  assert.equal(row(rows, 'work', 'vendor/module').Type, 'Git-submodule');
  assert.ok(row(rows, 'work', '.env.example'));
  assert.ok(rows.every((entry) => !entry.Pad.endsWith('.gitignore')));
  assert.ok(rows.every((entry) => !entry.Pad.includes('geheim.csv') && entry.Pad !== '.env.secret'));
  assert.equal(row(rows, 'work', 'niet-toegevoegd.txt'), undefined);

  const renamed = row(rows, 'work', 'docs/nieuwe-naam.md');
  assert.equal(renamed['Eerste commit (UTC)'], '2024-01-01T08:00:00Z');
  assert.equal(renamed['Laatste wijziging (UTC)'], '2024-01-02T09:00:00Z');
  const safe = row(rows, 'work', `'${dangerousName}`);
  assert.equal(safe.Bestand, `'${dangerousName}`);
  assert.equal(safe.Type, 'Markdown-document');

  const before = readFileSync(path.join(dir, output), 'utf8');
  generate(dir, ['--check']);
  assert.equal(readFileSync(path.join(dir, output), 'utf8'), before);
  write(dir, 'src/tweede.ts');
  git(dir, 'add', 'src/tweede.ts');
  assert.equal(generate(dir, ['--check'], [1]).status, 1);
  assert.equal(readFileSync(path.join(dir, output), 'utf8'), before);
  generate(dir);
  assert.ok(row(readRows(dir), 'work', 'src/tweede.ts'));

  generate(dir, ['--include-untracked']);
  const withUntracked = readRows(dir);
  assert.ok(row(withUntracked, 'work', 'niet-toegevoegd.txt'));
  assert.ok(row(withUntracked, 'work', output));
  assert.ok(withUntracked.every((entry) => !entry.Pad.includes('geheim.csv') && entry.Pad !== '.env.secret'));
});

test('een automatische CSV-commit veroorzaakt geen eindeloze updatecyclus', (t) => {
  const dir = repo(t);
  write(dir, 'file.txt');
  git(dir, 'add', '.');
  commit(dir, 'initial', '2024-02-01T12:00:00Z');
  git(dir, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
  generate(dir);
  git(dir, 'add', output);
  commit(dir, 'add inventory', '2024-02-02T12:00:00Z');
  generate(dir);
  const firstRefresh = readFileSync(path.join(dir, output), 'utf8');
  const self = row(readRows(dir), 'work', output);
  assert.equal(self['Eerste commit (UTC)'], '2024-02-02T12:00:00Z');
  assert.equal(self['Laatste wijziging (UTC)'], '');
  git(dir, 'add', output);
  commit(dir, 'automated refresh', '2024-02-03T12:00:00Z');
  generate(dir);
  assert.equal(readFileSync(path.join(dir, output), 'utf8'), firstRefresh);
  assert.equal(git(dir, 'status', '--porcelain', '--', output), '');
});

test('detached HEAD en shallow clones worden niet stilzwijgend verkeerd weergegeven', (t) => {
  const dir = repo(t);
  write(dir, 'first.txt');
  git(dir, 'add', '.');
  commit(dir, 'first', '2024-03-01T00:00:00Z');
  write(dir, 'second.txt');
  git(dir, 'add', '.');
  commit(dir, 'second', '2024-03-02T00:00:00Z');
  assert.match(generate(dir, ['--branch', 'wrong'], [1]).stderr, /HEAD staat op work/);
  git(dir, 'checkout', '--quiet', '--detach', 'HEAD');
  assert.match(generate(dir, [], [1]).stderr, /Detached HEAD/);
  generate(dir, ['--branch', 'work']);
  assert.ok(row(readRows(dir), 'work', 'second.txt'));

  const clone = `${dir}-shallow`;
  t.after(() => rmSync(clone, { recursive: true, force: true }));
  command(dir, 'git', ['clone', '--quiet', '--depth=1', `file://${dir}`, clone]);
  assert.equal(git(clone, 'rev-parse', '--is-shallow-repository'), 'true');
  assert.match(generate(clone, [], [1]).stderr, /git fetch --unshallow/);
});

test('publicatie werkt op een schoon tijdelijk remote en blijft idempotent', (t) => {
  const dir = repo(t);
  const bare = `${dir}-remote.git`;
  t.after(() => rmSync(bare, { recursive: true, force: true }));
  command(dir, 'git', ['init', '--quiet', '--bare', bare]);
  git(dir, 'remote', 'add', 'origin', bare);
  mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  copyFileSync(generator, path.join(dir, 'scripts/file-inventory.mjs'));
  copyFileSync(publisher, path.join(dir, 'scripts/publish-file-inventory.sh'));
  write(dir, output, 'oud overzicht\n');
  write(dir, 'tracked.txt');
  git(dir, 'add', '.');
  commit(dir, 'initial', '2024-04-01T00:00:00Z');
  git(dir, 'push', '--quiet', 'origin', 'work');

  // Buiten Actions of met niet-gecommitte wijzigingen mag de reset nooit draaien.
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
  assert.ok(row(readRows(dir), 'work', 'tracked.txt'));
  publish();
  assert.equal(git(dir, 'rev-parse', 'HEAD'), refreshed);

  // Een extra remote branch wordt in hetzelfde centrale overzicht opgenomen.
  write(dir, 'feature-alleen.md');
  git(dir, 'add', 'feature-alleen.md');
  const tree = git(dir, 'write-tree');
  const featureCommit = git(dir, 'commit-tree', tree, '-p', 'HEAD', '-m', 'feature');
  git(dir, 'reset', '--quiet', '--hard', 'HEAD');
  git(dir, 'push', '--quiet', 'origin', `${featureCommit}:refs/heads/feature/test`);
  assert.equal(existsSync(path.join(dir, 'feature-alleen.md')), false);
  publish();
  assert.ok(row(readRows(dir), 'feature/test', 'feature-alleen.md'));
  assert.equal(row(readRows(dir), 'work', 'feature-alleen.md'), undefined);
  assert.equal(git(dir, 'diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'), output);

  git(dir, 'push', '--quiet', 'origin', ':refs/heads/feature/test');
  publish();
  assert.equal(row(readRows(dir), 'feature/test', 'feature-alleen.md'), undefined);
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
  write(dir, output, 'oud overzicht\n');
  write(dir, 'basis.txt');
  git(dir, 'add', '.');
  commit(dir, 'initial', '2024-05-01T00:00:00Z');
  git(dir, 'push', '--quiet', 'origin', 'work');

  // Maak een echte concurrerende commit en zet het object alvast in de remote.
  write(dir, 'gelijktijdige-wijziging.txt', 'behouden\n');
  git(dir, 'add', 'gelijktijdige-wijziging.txt');
  const tree = git(dir, 'write-tree');
  const racingCommit = git(dir, 'commit-tree', tree, '-p', 'HEAD', '-m', 'concurrent change');
  git(dir, 'reset', '--quiet', '--hard', 'HEAD');
  git(dir, 'push', '--quiet', 'origin', `${racingCommit}:refs/heads/racing-object`);

  // Verplaats de remote precies vóór de eerste push van de bot. De echte git
  // weigert daarna de niet-fast-forward push; de tweede poging moet slagen.
  mkdirSync(bin, { recursive: true });
  const realGit = command(dir, 'which', ['git']).stdout.trim();
  const wrapper = path.join(bin, 'git');
  writeFileSync(wrapper, `#!/usr/bin/env bash\nset -e\nif [[ "\${1:-}" == push && ! -e "$RACE_MARKER" ]]; then\n  "$REAL_GIT" --git-dir="$RACE_REMOTE" update-ref refs/heads/work "$RACE_COMMIT"\n  touch "$RACE_MARKER"\nfi\nexec "$REAL_GIT" "$@"\n`);
  chmodSync(wrapper, 0o755);
  const result = command(dir, 'bash', [publisher, 'work'], {
    env: {
      GITHUB_ACTIONS: 'true',
      PATH: `${bin}${path.delimiter}${cleanEnv.PATH}`,
      REAL_GIT: realGit,
      RACE_REMOTE: bare,
      RACE_COMMIT: racingCommit,
      RACE_MARKER: path.join(bin, 'injected'),
    },
  });
  assert.match(result.stdout, /poging 1\/3/);
  git(dir, 'merge-base', '--is-ancestor', racingCommit, 'HEAD');
  assert.equal(readFileSync(path.join(dir, 'gelijktijdige-wijziging.txt'), 'utf8'), 'behouden\n');
  assert.ok(row(readRows(dir), 'work', 'gelijktijdige-wijziging.txt'));
  assert.equal(git(dir, 'diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'), output);
  assert.equal(git(dir, 'rev-parse', 'HEAD'), git(bare, 'rev-parse', 'refs/heads/work'));
});
