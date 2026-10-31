// Controleert de showcase-pagina's in `Lavish/`.
//
// De pagina's verwijzen naar bestanden in de map (schermafbeeldingen, de
// gedeelde stijl). Een kapotte verwijzing is een lege afbeelding op de
// pagina, en dat merkt niemand voordat iemand de pagina opent. Deze proef
// faalt dus zodra er een verwijzing naar een niet-bestaand bestand rondsluurt.
//
//   node scripts/check-lavish.mjs
//
// Exitcode 0 als alles klopt, 1 als er iets ontbreekt.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lavish = path.join(root, 'Lavish');

/** Alle HTML-bestanden in Lavish/, diep genoeg voor de pr-mapjes. */
function htmlFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...htmlFiles(full));
    else if (entry.endsWith('.html')) found.push(full);
  }
  return found;
}

if (!existsSync(lavish)) {
  console.error('De map Lavish/ ontbreekt.');
  process.exit(1);
}

const files = htmlFiles(lavish);
const problems = [];

/** Verwijzingen die naar buiten de repository wijzen of geen bestand zijn. */
function isExternal(reference) {
  return (
    reference === '' ||
    reference.startsWith('#') ||
    reference.startsWith('http://') ||
    reference.startsWith('https://') ||
    reference.startsWith('//') ||
    reference.startsWith('mailto:') ||
    reference.startsWith('tel:') ||
    reference.startsWith('data:')
  );
}

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const relative = path.relative(root, file);

  const references = [
    ...html.matchAll(/\bsrc="([^"]+)"/g),
    ...html.matchAll(/\bhref="([^"]+)"/g),
  ].map((match) => match[1]);

  for (const reference of references) {
    if (isExternal(reference)) continue;
    const target = path.resolve(path.dirname(file), reference.split('#')[0]);
    if (!existsSync(target)) {
      problems.push(`${relative}: verwijst naar een bestand dat niet bestaat: ${reference}`);
    }
  }

  // Elke PR-pagina toont minstens één schermafbeelding.
  if (/pr-\d+/.test(relative) && !html.includes('data-shot')) {
    problems.push(`${relative}: geen schermafbeelding gevonden (data-shot ontbreekt).`);
  }
}

// Het overzicht hoort alle PR-pagina's te tonen.
const overview = readFileSync(path.join(lavish, 'index.html'), 'utf8');
for (const file of files) {
  const relative = path.relative(lavish, file).replace(/index\.html$/, '');
  if (!relative || !relative.startsWith('pr-')) continue;
  if (!overview.includes(`${relative}index.html`)) {
    problems.push(`Lavish/index.html: de map ${relative} staat niet in het overzicht.`);
  }
}

if (problems.length) {
  console.error('De showcase is niet in orde:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`Lavish: ${files.length} pagina's gecontroleerd, alle verwijzingen kloppen.`);
