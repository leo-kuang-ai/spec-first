#!/bin/bash
set -euo pipefail
node <<'EVAL_JUDGE_NODE'
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

assert.ok((process.env.EVAL_FINAL_MESSAGE || '').trim(), 'Missing reply');

const roots = ['.spec-first/workflows/spec-explain', 'docs/explainers'];
for (const root of roots) assert.ok(!fs.existsSync(root), `Unexpected teaching artifact root: ${root}`);
function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const name of fs.readdirSync(directory)) {
    if (name === '.git' || name === 'node_modules') continue;
    const file = path.join(directory, name);
    const stat = fs.lstatSync(file);
    if (stat.isDirectory()) walk(file);
    else assert.ok(!/^explainer\.(?:html|md)$/i.test(name), `Unexpected teaching document: ${file}`);
  }
}
walk('.');
console.log('PASS: nonblank reply and no known teaching artifact in the fixture; content not graded.');
EVAL_JUDGE_NODE
