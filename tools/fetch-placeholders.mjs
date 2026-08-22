#!/usr/bin/env node
/**
 * Pull every Wikimedia placeholder into the repo and credit it properly.
 *
 *   node tools/fetch-placeholders.mjs
 *
 * Three things, in order:
 *   1. downloads each remote image into assets/placeholders/ and repoints
 *      every src and srcset at the local copy — no more hotlinking, and no
 *      more images that vanish behind a webview's CSP;
 *   2. asks the Commons API who took each photograph and under what licence;
 *   3. rewrites the PHOTO CREDITS block in the footer, and writes CREDITS.md.
 *
 * Safe to re-run: files already downloaded are skipped.
 *
 * This has to run somewhere that can reach upload.wikimedia.org — a sandbox
 * with a restrictive egress policy will refuse the connection.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HTML = join(ROOT, 'index.html');
const OUT_DIR = join(ROOT, 'assets', 'placeholders');
const UA = 'LocrianEnsembleSite/1.0 (static site build script)';

let html = readFileSync(HTML, 'utf8');

/* --------------------------------------------------- 1. what needs fetching */
const URL_RE = /https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/"\s]+\.(?:jpg|png))(?:\/([^"\s]+))?/g;

const urls = new Map();  // remote url -> local filename
for (const m of html.matchAll(URL_RE)) {
  const source = decodeURIComponent(m[1]);                 // the Commons file
  const rendered = decodeURIComponent(m[2] || m[1]);       // the thumb actually used
  urls.set(m[0], { file: rendered.replace(/[^\w.\-]+/g, '_'), source });
}
if (!urls.size) {
  console.log('No Wikimedia URLs left in index.html — nothing to do.');
  process.exit(0);
}
console.log(`${urls.size} remote images across ${new Set([...urls.values()].map(v => v.source)).size} Commons files\n`);

mkdirSync(OUT_DIR, { recursive: true });

/* ------------------------------------------------------------- 2. downloads */
async function download(url, dest) {
  if (existsSync(dest) && statSync(dest).size > 0) return 'cached';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return `${(statSync(dest).size / 1024).toFixed(0)} KB`;
}

let failed = 0;
for (const [url, { file }] of urls) {
  try {
    console.log(`  ${(await download(url, join(OUT_DIR, file))).padStart(8)}  ${file}`);
    html = html.split(url).join(`/assets/placeholders/${file}`);
  } catch (err) {
    console.error(`  FAILED    ${file} — ${err.message}`);
    failed++;
  }
}
if (failed) {
  console.error(`\n${failed} download(s) failed; those URLs were left pointing at Wikimedia.`);
  process.exitCode = 1;
}

// The preconnect only earns its place while images are still hotlinked.
if (!/upload\.wikimedia\.org/.test(html.replace(/<link rel="preconnect"[^>]*>/g, ''))) {
  html = html.replace(/\n<link rel="preconnect" href="https:\/\/upload\.wikimedia\.org"[^>]*>/, '');
}

/* --------------------------------------------------------- 3. who to credit */
const sources = [...new Set([...urls.values()].map(v => v.source))].sort();
const strip = s => (s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const credits = [];
for (let i = 0; i < sources.length; i += 20) {
  const batch = sources.slice(i, i + 20);
  const api = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo'
    + '&iiprop=extmetadata&iiextmetadatafilter=Artist|LicenseShortName|LicenseUrl|Credit'
    + '&titles=' + batch.map(f => encodeURIComponent('File:' + f)).join('|');
  try {
    const pages = (await (await fetch(api, { headers: { 'User-Agent': UA } })).json())?.query?.pages || {};
    for (const page of Object.values(pages)) {
      const meta = page?.imageinfo?.[0]?.extmetadata || {};
      credits.push({
        file: (page.title || '').replace(/^File:/, ''),
        author: strip(meta.Artist?.value) || 'Author not stated',
        licence: strip(meta.LicenseShortName?.value) || 'Licence not stated',
        licenceUrl: strip(meta.LicenseUrl?.value) || ''
      });
    }
  } catch (err) {
    console.error(`\nCould not reach the Commons API (${err.message}) — credits left as they were.`);
  }
}

if (credits.length) {
  credits.sort((a, b) => a.file.localeCompare(b.file));
  const pageUrl = f => 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(f);

  const items = credits.map(c => {
    const lic = c.licenceUrl
      ? `<a href="${esc(c.licenceUrl)}" target="_blank" rel="noopener">${esc(c.licence)}</a>`
      : esc(c.licence);
    return `      <li><a href="${pageUrl(c.file)}" target="_blank" rel="noopener">`
      + `${esc(c.file.replace(/_/g, ' ').replace(/\.\w+$/, ''))}</a> `
      + `<span class="lic">${esc(c.author)} · ${lic}</span></li>`;
  }).join('\n');

  const block = `  <!-- PHOTO CREDITS — written by tools/fetch-placeholders.mjs from the
       Commons API. Re-run it after changing which placeholders are used.
       Delete the whole <details> once the ensemble's own photography is in. -->
  <details class="credit">
    <summary>Placeholder photography — Wikimedia Commons</summary>
    <p>Every photograph on this page is a stand-in pending the ensemble's own
      images, reproduced under the licences below.</p>
    <ul>
${items}
    </ul>
  </details>
  <!-- /PHOTO CREDITS -->`;

  const marked = /  <!-- PHOTO CREDITS[\s\S]*?<!-- \/PHOTO CREDITS -->/;
  if (marked.test(html)) html = html.replace(marked, block);
  else console.error('\nPHOTO CREDITS markers missing from index.html — credits block not updated.');

  writeFileSync(join(ROOT, 'CREDITS.md'),
    '# Photography credits\n\n'
    + 'Placeholder images, pending the ensemble\'s own photography.\n'
    + 'Generated by `tools/fetch-placeholders.mjs`.\n\n'
    + '| File | Author | Licence |\n|---|---|---|\n'
    + credits.map(c => `| [${c.file.replace(/_/g, ' ')}](${pageUrl(c.file)}) | ${c.author} | `
      + (c.licenceUrl ? `[${c.licence}](${c.licenceUrl})` : c.licence) + ' |').join('\n')
    + '\n');
  console.log(`\nCredited ${credits.length} files → footer block and CREDITS.md`);
}

writeFileSync(HTML, html);
console.log('index.html updated.');
