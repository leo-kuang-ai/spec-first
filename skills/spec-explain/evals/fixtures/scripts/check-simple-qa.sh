#!/bin/bash
# 断言:简单问答直接回答主题(stream/buffer/流/缓冲),且 spec-explain 的两个
# canonical/legacy 产物根下都没有任何教学文档。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
node <<'EVAL_JUDGE_NODE'
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const message = (process.env.EVAL_FINAL_MESSAGE || '').toLowerCase();
assert.ok(['stream', 'buffer', '流', '缓冲'].some((word) => message.includes(word)),
  '最终输出没有直接回答 stream/buffer 主题');

const roots = ['.spec-first/workflows/spec-explain', 'docs/explainers'];
for (const root of roots) assert.ok(!fs.existsSync(root), `被发现不应存在的教学产物根: ${root}`);
function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const name of fs.readdirSync(directory)) {
    if (name === '.git' || name === 'node_modules') continue;
    const file = path.join(directory, name);
    const stat = fs.lstatSync(file);
    if (stat.isDirectory()) walk(file);
    else assert.ok(!/^explainer\.(?:html|md)$/i.test(name), `发现不应存在的教学文档: ${file}`);
  }
}
walk('.');
console.log('PASS: 普通问答直接回答主题，未产生 spec-explain 教学文档。');
EVAL_JUDGE_NODE
