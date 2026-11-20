#!/usr/bin/env node
// Post-build verification of the GitHub Pages output in docs/ (Req 11.1-11.4, 12.2-12.5).
// Usage: node scripts/verify-dist.mjs [docsDir]
// Without an argument, docs/ is resolved relative to this file (../../docs/), not the cwd.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const docsDir = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL('../../docs/', import.meta.url));

const failures = [];
const fail = (msg) => failures.push(msg);
const isAbsoluteRef = (v) => v.startsWith('/') || /^http/i.test(v);

// Parse simple HTML tags into attribute maps (enough for the Vite output).
function tags(html, name) {
  const out = [];
  const re = new RegExp(`<${name}\\b([^>]*)>`, 'gi');
  let m;
  while ((m = re.exec(html))) {
    const attrs = {};
    const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
    let a;
    while ((a = attrRe.exec(m[1]))) attrs[a[1].toLowerCase()] = a[3] ?? a[4] ?? a[5] ?? '';
    out.push(attrs);
  }
  return out;
}

// 1. .nojekyll (Req 12.4)
if (!existsSync(join(docsDir, '.nojekyll'))) fail(`missing ${join(docsDir, '.nojekyll')}`);

// 2. index.html (Req 11.3, 12.2, 12.5)
const indexPath = join(docsDir, 'index.html');
if (!existsSync(indexPath)) {
  fail(`missing ${indexPath}`);
} else {
  const html = readFileSync(indexPath, 'utf8');

  const refRe = /\b(src|href)\s*=\s*["']?([^"'\s>]+)/gi;
  let r;
  while ((r = refRe.exec(html))) {
    if (isAbsoluteRef(r[2])) fail(`index.html: ${r[1]}="${r[2]}" is not relative`);
  }

  const htmlTag = tags(html, 'html')[0];
  if (!htmlTag || htmlTag.lang !== 'ro') fail('index.html: <html lang="ro"> missing');

  const metas = tags(html, 'meta');
  const viewport = metas.find((m) => m.name === 'viewport');
  if (!viewport) fail('index.html: viewport meta missing');
  else if (!(viewport.content ?? '').includes('width=device-width'))
    fail(`index.html: viewport content "${viewport.content}" lacks width=device-width`);

  const theme = metas.find((m) => m.name === 'theme-color');
  if (!theme) fail('index.html: theme-color meta missing');
  else if ((theme.content ?? '').toLowerCase() !== '#0f766e')
    fail(`index.html: theme-color content "${theme.content}" is not #0f766e`);

  const manifestLink = tags(html, 'link').find((l) => (l.rel ?? '').split(/\s+/).includes('manifest'));
  if (!manifestLink) fail('index.html: <link rel="manifest"> missing');
  else if (!/(^|\/)manifest\.webmanifest$/.test(manifestLink.href ?? ''))
    fail(`index.html: manifest link href "${manifestLink.href}" does not point to manifest.webmanifest`);
}

// 3. manifest.webmanifest (Req 11.1, 11.2, 11.4)
const manifestPath = join(docsDir, 'manifest.webmanifest');
if (!existsSync(manifestPath)) {
  fail(`missing ${manifestPath}`);
} else {
  let mf = null;
  try {
    mf = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    fail(`manifest.webmanifest does not parse: ${e.message}`);
  }
  if (mf) {
    const expect = {
      name: 'PaletCheck UR20',
      lang: 'ro',
      display: 'standalone',
      theme_color: '#0f766e',
      start_url: './',
    };
    for (const [k, v] of Object.entries(expect)) {
      if (mf[k] !== v) fail(`manifest: ${k} is ${JSON.stringify(mf[k])}, expected ${JSON.stringify(v)}`);
    }
    if (typeof mf.short_name !== 'string' || mf.short_name.length === 0)
      fail('manifest: short_name missing');
    else if (mf.short_name.length > 12)
      fail(`manifest: short_name "${mf.short_name}" is longer than 12 characters`);

    if (!Array.isArray(mf.icons) || mf.icons.length === 0) {
      fail('manifest: icons missing or empty');
    } else {
      mf.icons.forEach((icon, i) => {
        for (const k of ['src', 'type', 'sizes']) {
          if (!icon || typeof icon[k] !== 'string' || !icon[k]) fail(`manifest: icons[${i}].${k} missing`);
        }
        if (typeof icon?.src !== 'string' || !icon.src) return;
        if (isAbsoluteRef(icon.src)) fail(`manifest: icons[${i}].src "${icon.src}" is not relative`);
        else if (!existsSync(join(docsDir, icon.src.split(/[?#]/)[0])))
          fail(`manifest: icons[${i}].src "${icon.src}" not found in ${docsDir}`);
      });
    }
  }
}

if (failures.length) {
  console.error(`verify-dist: FAILED (${failures.length}) in ${docsDir}`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  'verify-dist: OK — .nojekyll; index.html (relative src/href, lang="ro", viewport, theme-color #0f766e, manifest link); ' +
    'manifest.webmanifest (JSON, name, short_name<=12, lang, display, theme_color, start_url, icons exist)',
);
