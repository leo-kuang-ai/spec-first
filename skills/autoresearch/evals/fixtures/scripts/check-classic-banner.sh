#!/bin/bash
# 断言:classic mode banner 必须由助手输出，且早于首个「工作」工具调用。
# 工作调用 = 会改变工作区或执行测量循环的调用（测试运行、文件写入、脚手架、安装、任意未知命令）。
# 只读协议读取（diff/find/cat/ls/rg/git 只读子命令等）不算工作调用：SKILL.md 的 banner 合同是
# 「加载定义后、在测试运行/文件编辑/脚手架之前」，逐条命令白名单之外一律按工作调用处理（fail-closed）。
# tool_result 中的文件内容不算助手输出；缺少 transcript 时无法证明时序，判失败。
set -euo pipefail
[[ -n "${EVAL_TRANSCRIPT_PATH:-}" ]] || { echo '缺少 runner transcript，无法证明 banner 时序'; exit 1; }
node <<'EVAL_JUDGE_NODE'
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');

const messages = JSON.parse(fs.readFileSync(process.env.EVAL_TRANSCRIPT_PATH, 'utf8'));
assert.ok(Array.isArray(messages), 'Unsupported runner transcript');

const READ_ONLY_SEGMENT = /^(?:sudo\s+)?(?:git\s+(?:rev-parse|status|diff|log|show|branch|ls-files|cat-file)\b|diff|find|ls|cat|head|tail|wc|rg|grep|sed\s+-n|awk|pwd|which|command\s+-v|shasum|sha256sum|stat|tree|file|echo|printf)\b/;
const WRITE_REDIRECT = /(?:^|[^0-9&])>(?!&)/;

function segments(command) {
  return String(command)
    .split(/&&|\|\||[;|]/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function isReadOnlySegment(segment) {
  if (WRITE_REDIRECT.test(segment)) return false;
  return READ_ONLY_SEGMENT.test(segment);
}

function isWorkCall(name, input) {
  if (!/bash|shell|exec|terminal/i.test(name || '')) {
    return /write|edit|patch|apply/i.test(name || '');
  }
  const list = segments(input && input.command);
  return list.length === 0 || !list.every(isReadOnlySegment);
}

const firstWork = messages.findIndex((entry) => entry.role === 'tool_call'
  && isWorkCall(entry.tool_call?.name, entry.tool_call?.input ?? entry.tool_call?.arguments));
const banner = messages.some((entry, index) => entry.role === 'assistant'
  && typeof entry.content === 'string'
  && entry.content.includes('mode: classic')
  && (firstWork < 0 || index < firstWork));
assert.ok(banner, '助手输出中没有在首个工作工具调用之前出现 `mode: classic` banner');
console.log('PASS: classic banner appeared in assistant output before the first work tool call.');
EVAL_JUDGE_NODE
