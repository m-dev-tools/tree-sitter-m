#!/usr/bin/env node
// Bucket smoke-gate failures by error context. For each ERROR node in
// each parsed file, grab the source line and a small window around the
// error column, then group by syntactic shape so we can prioritise the
// next grammar fix.
//
// Heuristic categorisation, not perfect — designed to surface the top
// 5-10 patterns that account for most failures.

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node tools/error-buckets.js <root-dir> [--sample N]');
  process.exit(2);
}
const ROOT = path.resolve(args[0]);
const SAMPLE = args.includes('--sample') ? parseInt(args[args.indexOf('--sample') + 1], 10) : 1000;

const TS = path.resolve(__dirname, '..', 'node_modules', '.bin', 'tree-sitter');

const files = [];
walk(ROOT);
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.m')) files.push(full);
  }
}

// Deterministic stride sample, same approach as smoke-corpus.js.
const stride = Math.floor(files.length / SAMPLE) || 1;
const chosen = [];
for (let i = 0; i < files.length && chosen.length < SAMPLE; i += stride) {
  chosen.push(files[i]);
}

const buckets = new Map();
const examples = new Map();

for (const file of chosen) {
  const result = spawnSync(TS, ['parse', file], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.status === 0) continue;
  // tree-sitter parse on error returns non-zero AND prints the (ERROR ...) tree to stdout.
  const out = result.stdout || '';
  const errMatches = [...out.matchAll(/\(ERROR\s+\[(\d+),\s*(\d+)\]\s*-\s*\[(\d+),\s*(\d+)\]/g)];
  if (errMatches.length === 0) continue;

  const src = fs.readFileSync(file, 'utf8').split('\n');
  for (const m of errMatches) {
    const startRow = parseInt(m[1], 10);
    const startCol = parseInt(m[2], 10);
    const line = src[startRow] || '';
    const before = line.slice(Math.max(0, startCol - 12), startCol);
    const at = line.slice(startCol, Math.min(line.length, startCol + 20));
    const bucket = classify(line, startCol, before, at);
    buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
    if (!examples.has(bucket)) {
      examples.set(bucket, `${path.basename(file)}:${startRow + 1}:${startCol} :: ${line.trim().slice(0, 80)}`);
    }
  }
}

function classify(line, col, before, at) {
  // 1. Space-separated dot prefix at line start: " . . N X" or " . S X"
  if (/^\s*\.\s+\./.test(line)) return 'dot-prefix-spaced';
  // 2. Multi-value FOR: " F VAR=val,val,val ..."
  if (/^\s*F(OR)?\s+\S+=\S+,/.test(line) && col > 0) return 'for-multi-value';
  // 3. Trailing single space then EOL after a command keyword
  if (col >= line.length - 1 && /\s$/.test(line)) return 'trailing-space-eol';
  // 4. SET/KILL/MERGE list target: "S (A,B)=val" or "K (A,B)"
  if (/^\s*(S|SET|K|KILL|M|MERGE)\s+\(/.test(line)) return 'set-kill-list-target';
  // 5. ?N tab-to-column in WRITE (after W or a comma in W-arg)
  if (before.endsWith('?') && /^\d/.test(at)) return 'write-tab-column';
  // 6. ##class / &sql IRIS extensions
  if (/##class|&sql|##super/.test(line)) return 'iris-class-syntax';
  // 7. LABEL+offset^ROUTINE
  if (/[A-Za-z%][\w%]*\+\d+\^/.test(line)) return 'label-offset-routine';
  // 8. Argument indirection in odd positions (after comma, etc.)
  if (at.startsWith('@')) return 'indirection-mid-arg';
  // 9. NEW with parenthesised exclusion list: "N (A,B,C)"
  if (/^\s*N(EW)?\s+\(/.test(line)) return 'new-exclusion-list';
  // 10. JOB-style argument with parameters: " J ^FOO():pp:to"
  if (/^\s*J(OB)?\s+/.test(line) && /:/.test(at)) return 'job-args';
  // 11. Numeric-literal vs decimal in pattern context
  if (/[?][\d.]/.test(before) || /[?][\d.]/.test(at)) return 'pattern-numeric';
  return 'other';
}

const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
console.log('Error buckets (sample of', chosen.length, 'files):');
for (const [k, n] of sorted) {
  console.log(`  ${String(n).padStart(4)}  ${k.padEnd(28)}  e.g. ${examples.get(k)}`);
}
