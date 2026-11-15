const fs = require('node:fs');
const path = require('node:path');

// Some Node builds decode Windows-1252 bytes as C1 controls. Map those
// explicitly so a recovery conversion preserves punctuation on Windows.
const punctuation = new Map([
 [0x80, 0x20ac], [0x82, 0x201a], [0x83, 0x0192], [0x84, 0x201e],
 [0x85, 0x2026], [0x86, 0x2020], [0x87, 0x2021], [0x88, 0x02c6],
 [0x89, 0x2030], [0x8a, 0x0160], [0x8b, 0x2039], [0x8c, 0x0152],
 [0x8e, 0x017d], [0x91, 0x2018], [0x92, 0x2019], [0x93, 0x201c],
 [0x94, 0x201d], [0x95, 0x2022], [0x96, 0x2013], [0x97, 0x2014],
 [0x98, 0x02dc], [0x99, 0x2122], [0x9a, 0x0161], [0x9b, 0x203a],
 [0x9c, 0x0153], [0x9e, 0x017e], [0x9f, 0x0178],
]);
function normalize(file) {
 const bytes = fs.readFileSync(file);
 let text;
 try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
 catch { text = new TextDecoder('windows-1252').decode(bytes); }
 text = [...text].map(c => String.fromCodePoint(punctuation.get(c.codePointAt(0)) ?? c.codePointAt(0))).join('');
 text = text.replace(/^\uFEFF/, '');
 if (!bytes.equals(Buffer.from(text, 'utf8'))) {
  fs.writeFileSync(file, text, 'utf8');
  console.log('Normalized UTF-8:', file);
 }
}
function walk(dir) {
 for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
  const file = path.join(dir, entry.name);
  if (entry.isDirectory()) walk(file);
  else if (/\.(jsx?|cjs|md)$/.test(file)) normalize(file);
 }
}
for (const dir of ['src', 'tests', 'scripts']) walk(dir);
for (const file of ['README.md', 'DEVELOPMENT_LOG.md']) normalize(file);
