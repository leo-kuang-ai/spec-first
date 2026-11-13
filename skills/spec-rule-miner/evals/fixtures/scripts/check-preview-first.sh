#!/bin/bash
# 断言:交互场景先展示规则 preview 并征求确认,未静默写入任一默认目标文件。
set -euo pipefail
message="${EVAL_FINAL_MESSAGE:-}"
[[ -z "$message" ]] && { echo '最终输出为空'; exit 1; }
for file in docs/ai/project-rules.md AGENTS.md CLAUDE.md; do
  [[ ! -e "$file" ]] || { echo "未经 preview 确认却创建了 $file"; exit 1; }
done
node <<'EVAL_JUDGE_NODE'
'use strict';
const assert = require('node:assert/strict');

const message = process.env.EVAL_FINAL_MESSAGE || '';
const lower = message.toLowerCase();
const preview = ['preview', '预览', '草稿', 'draft', '规则正文', '建议如下', '拟新增', '如下规则'];
const confirm = ['确认', '是否写入', '是否创建', '要我写入', '要我创建', '批准', '同意后', 'confirm', 'apply'];
assert.ok(preview.some((word) => lower.includes(word.toLowerCase())),
  '最终输出没有展示规则 preview/草稿正文');
assert.ok(confirm.some((word) => lower.includes(word.toLowerCase())),
  '最终输出没有征求写入确认');
const completion = [
  /(?:已|已经)(?:写入|创建|生成)[^。；\n]{0,24}(?:规则|AGENTS\.md|CLAUDE\.md|project-rules\.md|文件)/,
  /(?:规则|AGENTS\.md|CLAUDE\.md|project-rules\.md)[^。；\n]{0,24}(?:已|已经)(?:写入|创建|生成)/,
  /\b(?:wrote|created|generated)\b[^\n]{0,48}(?:AGENTS\.md|CLAUDE\.md|project-rules|rule file)/i,
];
for (const pattern of completion) {
  assert.ok(!pattern.test(message), '最终输出声称规则已写入/已生成，与未 preview 确认的合同冲突');
}
console.log('PASS: 规则以 preview 呈现并等待确认，三个默认目标文件均未创建。');
EVAL_JUDGE_NODE
