#!/usr/bin/env node
/**
 * Point one image slot at new files. No build step, no dependencies.
 *
 *   node tools/set-image.mjs --list
 *   node tools/set-image.mjs hero assets/hero.jpg
 *   node tools/set-image.mjs hero assets/hero-960.jpg assets/hero-1280.jpg assets/hero-1920.jpg
 *   node tools/set-image.mjs gallery-1 assets/nave.jpg --alt "The nave, looking east"
 *
 * A `-<width>` suffix on the filename is read as the srcset width. Give one
 * file with no suffix and the srcset is dropped and `src` used alone. The
 * `sizes`, `loading` and `fetchpriority` attributes are left exactly as they
 * are — they are tuned per slot and rarely want touching.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const HTML = new URL('../index.html', import.meta.url).pathname;
const args = process.argv.slice(2);

/** Every <img data-slot="..."> in the page, in document order. */
function slots(html) {
  return [...html.matchAll(/<img\b[^>]*\bdata-slot="([^"]+)"[^>]*>/g)]
    .map(m => ({ slot: m[1], tag: m[0], index: m.index }));
}

const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}="([^"]*)"`)) || [])[1];

function setAttr(tag, name, value) {
  const re = new RegExp(`\\s${name}="[^"]*"`);
  if (value === null) return tag.replace(re, '');
  const next = ` ${name}="${value.replace(/"/g, '&quot;')}"`;
  return re.test(tag) ? tag.replace(re, next) : tag.replace(/<img\b/, `<img${next}`);
}

const html = readFileSync(HTML, 'utf8');

if (!args.length || args[0] === '--list' || args[0] === '-l') {
  for (const { slot, tag } of slots(html)) {
    const src = attr(tag, 'src') || '';
    const local = !/^https?:/.test(src);
    console.log(
      `${local ? '✓' : '·'} ${slot.padEnd(14)} ${src.replace(/^https:\/\/upload\.wikimedia\.org\S*\//, '…/')}`
    );
    const alt = attr(tag, 'alt');
    if (alt) console.log(`${' '.repeat(17)}alt: ${alt}`);
  }
  console.log('\n✓ = local file   · = remote placeholder');
  process.exit(0);
}

const [slot, ...rest] = args;
const altAt = rest.indexOf('--alt');
const alt = altAt === -1 ? null : rest[altAt + 1];
const files = (altAt === -1 ? rest : rest.slice(0, altAt)).filter(Boolean);

const target = slots(html).find(s => s.slot === slot);
if (!target) {
  console.error(`No slot "${slot}". Run --list to see them all.`);
  process.exit(1);
}
if (!files.length && alt === null) {
  console.error('Give at least one file, or --alt "…".');
  process.exit(1);
}

let tag = target.tag;

if (files.length) {
  for (const f of files) if (!existsSync(f)) console.warn(`  warning: ${f} does not exist yet`);

  const widthOf = f => Number((f.match(/-(\d{2,5})\.[a-z0-9]+$/i) || [])[1]) || null;
  const withWidths = files.map(f => ({ file: f, w: widthOf(f) })).filter(x => x.w);
  const sorted = [...withWidths].sort((a, b) => a.w - b.w);
  const url = f => '/' + f.replace(/^\.?\//, '');

  if (sorted.length === files.length && files.length > 1) {
    tag = setAttr(tag, 'srcset', sorted.map(x => `${url(x.file)} ${x.w}w`).join(', '));
    tag = setAttr(tag, 'src', url(sorted[sorted.length - 1].file));
  } else {
    if (files.length > 1) console.warn('  no -<width> suffixes: using the first file alone');
    tag = setAttr(tag, 'srcset', null);
    tag = setAttr(tag, 'src', url(files[0]));
  }
}

if (alt !== null) tag = setAttr(tag, 'alt', alt);

writeFileSync(HTML, html.slice(0, target.index) + tag + html.slice(target.index + target.tag.length));
console.log(`${slot} →`);
console.log(`  src    ${attr(tag, 'src')}`);
if (attr(tag, 'srcset')) console.log(`  srcset ${attr(tag, 'srcset')}`);
if (attr(tag, 'alt') !== undefined) console.log(`  alt    ${attr(tag, 'alt') || '(empty — decorative)'}`);
