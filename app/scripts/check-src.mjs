#!/usr/bin/env node
// Static source guard for app/src (Req 2.8, 9.3, 10.1, 10.2, 11.6).
// Plain Node, no dependencies. Exits 1 and prints file:line for each finding.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(appDir, 'src');
const componentsDir = join(srcDir, 'components');
const testsDir = join(srcDir, 'logic', '__tests__');

const SCANNED_EXT = /\.(ts|tsx|css)$/;

const RULES_ALL = [
  { name: 'native dialog call', re: /\b(alert|confirm|prompt)\s*\(/ },
  { name: 'forbidden color', re: /\b(violet|purple|indigo|fuchsia|lavender)\b/i },
  { name: 'emoji character', re: /\p{Extended_Pictographic}/u },
  { name: 'word "offline"', re: /offline/i },
];
const RULES_COMPONENTS = [
  { name: 'hardcoded financial figure', re: /\b(130[._]?000|20[._]?000|30[._]?000)\b/ },
];
const RULES_HTML = [
  { name: 'emoji character', re: /\p{Extended_Pictographic}/u },
  { name: 'forbidden color', re: /\b(violet|purple|indigo|fuchsia|lavender)\b/i },
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (full === testsDir) continue;
      walk(full, out);
    } else if (SCANNED_EXT.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const findings = [];

function scan(file, rules) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const rule of rules) {
      if (rule.re.test(line)) {
        findings.push(`${relative(appDir, file)}:${i + 1}: ${rule.name}: ${line.trim()}`);
      }
    }
  });
}

const files = walk(srcDir);
for (const file of files) {
  const inComponents = file.startsWith(componentsDir + sep);
  scan(file, inComponents ? [...RULES_ALL, ...RULES_COMPONENTS] : RULES_ALL);
}

const indexHtml = join(appDir, 'index.html');
if (existsSync(indexHtml)) scan(indexHtml, RULES_HTML);

if (findings.length > 0) {
  console.error(`check-src: ${findings.length} finding(s)`);
  for (const f of findings) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`check-src: OK (${files.length} files in src/ + index.html, 0 findings)`);
